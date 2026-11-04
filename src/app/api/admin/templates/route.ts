import { bundledTemplates, withBundledTemplates } from '@/lib/bundled-templates';
import { nextFreeSlug, templateSlug } from '@/lib/slug';
import { z } from 'zod';
import { DEFAULT_TEMPLATE_ORIGINAL_PRICE, TIER_PRICES } from '@/lib/template-pricing';
import { DEFAULT_TEMPLATE_TIER } from '@/lib/template-tiers';
import { requireAdmin, apiError, HttpError } from '@/lib/admin';
import { templateSchema } from '@/lib/schemas';
import { analyzeTemplate } from '@/lib/template-analyzer';
import { posterObjectName } from '@/lib/template-posters';
import { generateTemplatePoster } from '@/lib/generate-template-poster';

export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    const db = await requireAdmin(request);
    const { data, error } = await db.from('templates').select('*').order('id');
    if (error) throw error;
    if (new URL(request.url).searchParams.get('include_bundled') === '1') {
      const { data: categories, error: categoryError } = await db.from('categories').select('*').eq('is_active', true);
      if (categoryError) throw categoryError;
      return Response.json(withBundledTemplates(data || [], categories || []), { headers: { 'Cache-Control': 'no-store' } });
    }
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const db = await requireAdmin(request);
    const form = await request.formData();
    const input = templateSchema.safeParse(Object.fromEntries(['title', 'category', 'badge', 'price', 'original_price', 'tier'].map(key => [key, form.get(key)]).filter(([, v]) => v !== null)));
    const file = form.get('file');
    if (!input.success || !(file instanceof File) || !file.name.endsWith('.html') || file.size > 100 * 1024 * 1024) throw new HttpError(400, 'Choose an HTML file up to 100 MB and fill in the template details.');
    const html = await file.text();
    const report = analyzeTemplate(html);
    // Block upload if there's a critical failure (canvas text rendering)
    const critical = report.items.filter(i => i.status === 'fail' && i.key !== 'text');
    if (critical.length > 0 && form.get('force') !== 'true') {
      return Response.json({ success: false, report, requiresConfirmation: true }, { status: 422 });
    }
    const poster = form.get('poster');
    const hasPoster = poster instanceof File && poster.size > 0;
    if (hasPoster && (!['image/webp', 'image/png', 'image/jpeg'].includes(poster.type) || poster.size > 3 * 1024 * 1024)) throw new HttpError(400, 'Choose a WebP, PNG or JPG cover image under 3 MB.');
    let cover: Blob;
    if (hasPoster) cover = poster;
    else {
      try {
        cover = new Blob([new Uint8Array(await generateTemplatePoster(html))], { type: 'image/webp' });
      } catch (error) {
        console.error('Template cover generation failed', error);
        throw new HttpError(503, 'Could not generate the front image. Please retry or choose a cover image before uploading.');
      }
    }
    const id = crypto.randomUUID();
    const filename = `${id}.html`;
    const stored = [filename];
    const blob = new Blob([html], { type: 'text/html' });
    const { error: uploadError } = await db.storage.from('base-templates').upload(filename, blob, { contentType: 'text/html' });
    if (uploadError) throw uploadError;
    {
      // Cards show this image instead of loading the whole live page; see getTemplatePoster.
      const posterName = posterObjectName(id);
      const { error: posterError } = await db.storage.from('base-templates').upload(posterName, cover, { contentType: cover.type });
      if (posterError) { await db.storage.from('base-templates').remove(stored); throw posterError; }
      stored.push(posterName);
    }
    const { data: { publicUrl } } = db.storage.from('base-templates').getPublicUrl(filename);
    const { data: catData } = await db.from('categories').select('id').ilike('name', input.data.category).maybeSingle();
    // The link stays the same even if the title is edited later. Reading fails only before the slug migration.
    const { data: existing, error: slugError } = await db.from('templates').select('slug');
    const slug = slugError ? undefined : nextFreeSlug(templateSlug(input.data.title, input.data.category), [
      ...bundledTemplates.map(item => templateSlug(item.title, item.category)),
      ...(existing || []).flatMap(row => row.slug ? [row.slug] : []),
    ]);
    const payload = { ...input.data, ...(slug ? { slug } : {}), price: String(TIER_PRICES[input.data.tier ?? DEFAULT_TEMPLATE_TIER]), original_price: input.data.original_price ?? DEFAULT_TEMPLATE_ORIGINAL_PRICE, filename: publicUrl, category_id: catData?.id || null };
    const { error } = await db.from('templates').insert(payload);
    if (error) { await db.storage.from('base-templates').remove(stored); throw error; }
    return Response.json({ success: true, report });
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request) {
  try {
    const db = await requireAdmin(request);
    const input = templateSchema.partial().extend({ id: z.number().int().positive() }).safeParse(await request.json());
    if (!input.success) throw new HttpError(400, 'Invalid template details.');
    const { id, ...changes } = input.data;
    delete changes.price;
    // The tier sets the price, so the stored price always matches what the site shows.
    const updatePayload: Record<string, unknown> = { ...changes, ...(changes.tier ? { price: String(TIER_PRICES[changes.tier]) } : {}) };
    if (changes.category) {
      const { data: catData } = await db.from('categories').select('id').ilike('name', changes.category).maybeSingle();
      if (catData?.id) updatePayload.category_id = catData.id;
    }
    const { error } = await db.from('templates').update(updatePayload).eq('id', id).select('id').single();
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request) {
  try {
    const db = await requireAdmin(request);
    const input = z.object({ id: z.number().int().positive() }).safeParse(await request.json());
    if (!input.success) throw new HttpError(400, 'Invalid template ID.');
    const { error } = await db.from('templates').delete().eq('id', input.data.id).select('id').single();
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) { return apiError(error); }
}

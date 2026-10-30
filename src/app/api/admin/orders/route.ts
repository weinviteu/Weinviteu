import { bundledTemplates } from '@/lib/bundled-templates';
import { z } from 'zod';
import { requireAdmin, apiError, HttpError } from '@/lib/admin';
import { editorSchema } from '@/lib/schemas';
import { renderInvitation } from '@/lib/invitation';
import { templateFieldError } from '@/lib/template-fields';
import { readTemplate } from '@/lib/template-source';
import { nextFreeSlug, slugify } from '@/lib/slug';
const inputSchema = z.object({ id: z.uuid(), client_name: z.string().trim().min(1).max(200), email: z.email(), template_filename: z.string().min(1).max(2000), editor_state: editorSchema });
export async function GET(request: Request) {
  try {
    const db = await requireAdmin(request);
    const id = new URL(request.url).searchParams.get('id');
    if (id) {
      if (!z.uuid().safeParse(id).success) throw new HttpError(400, 'Invalid order ID.');
      const { data, error } = await db.from('orders').select('*').eq('id', id).single();
      if (error || !data) throw new HttpError(404, 'Order not found.');
      return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
    }
    const { data, error } = await db.from('orders').select('id,slug,client_name,email,template_name,status,price,message,created_at,updated_at,published_file,email_sent_at,email_sent_to,email_sent_count,last_email_error').order('created_at', { ascending: false });
    if (error) throw error;
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const db = await requireAdmin(request);
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) throw new HttpError(400, 'Provide client name, valid email, and valid customization.');
    const input = parsed.data;
    const { data: existing, error: lookupError } = await db.from('orders').select('*').eq('id', input.id).maybeSingle();
    if (lookupError) throw lookupError;
    const source = existing?.template_filename === input.template_filename && existing.source_html ? existing.source_html : await readTemplate(db, input.template_filename);
    const invalid = templateFieldError(source, input.editor_state.config);
    if (invalid) throw new HttpError(400, invalid);
    const { data: template, error: templateError } = await db.from('templates').select('title').eq('filename', input.template_filename).maybeSingle();
    if (templateError) throw templateError;
    const templateName = template?.title || bundledTemplates.find(item => item.filename === input.template_filename)?.title || (existing?.template_filename === input.template_filename ? existing.template_name : null);
    if (!templateName) throw new HttpError(404, 'Template not found.');
    // Versioned files keep the last good invitation intact if the database write fails.
    const filename = `${input.id}-${crypto.randomUUID()}.html`;
    const { error: uploadError } = await db.storage.from('custom-templates').upload(filename, renderInvitation(source, input.editor_state), { contentType: 'text/html' });
    if (uploadError) throw uploadError;
    // Sent or finished invitations keep their status; the client's link simply shows the new version.
    const status = existing && ['Link Delivered', 'Completed'].includes(existing.status) ? existing.status : 'Customizing';
    let slug: string = existing?.slug;
    for (let attempt = 0; ; attempt++) {
      if (!existing?.slug) slug = await freeSlug(db, slugify(input.client_name));
      const payload = { ...input, slug, source_html: source, template_name: templateName, status, published_file: filename, updated_at: new Date().toISOString() };
      // Updating explicitly preserves inquiry messages, price and creation date.
      const { error } = existing
        ? await db.from('orders').update(payload).eq('id', input.id)
        : await db.from('orders').insert(payload);
      if (!error) break;
      // Another save claimed the same name-based link a moment ago; pick the next free one.
      if (!existing?.slug && error.code === '23505' && /slug/.test(error.message) && attempt < 4) continue;
      await db.storage.from('custom-templates').remove([filename]);
      throw error;
    }
    if (existing?.published_file) await db.storage.from('custom-templates').remove([existing.published_file]);
    return Response.json({ id: input.id, slug, inviteUrl: `/invite/${slug}` });
  } catch (error) { return apiError(error); }
}
async function freeSlug(db: Awaited<ReturnType<typeof requireAdmin>>, base: string) {
  const { data, error } = await db.from('orders').select('slug').like('slug', `${base}%`);
  if (error) throw error;
  return nextFreeSlug(base, (data ?? []).map(row => row.slug as string));
}
export async function PATCH(request: Request) {
  try {
    const db = await requireAdmin(request);
    const input = z.object({ id: z.uuid(), status: z.enum(['Completed', 'Customizing', 'New Inquiry', 'Contacted', 'Draft Saved', 'Link Delivered', 'Archived']) }).safeParse(await request.json());
    if (!input.success) throw new HttpError(400, 'Invalid order update.');
    const { data, error } = await db.from('orders').update({ status: input.data.status, updated_at: new Date().toISOString() }).eq('id', input.data.id).select('id').single();
    if (error || !data) throw new HttpError(404, 'Order could not be updated.');
    return Response.json({ success: true });
  } catch (error) { return apiError(error); }
}

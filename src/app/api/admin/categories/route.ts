import { z } from 'zod';
import { requireAdmin, apiError, HttpError } from '@/lib/admin';

export async function GET(request: Request) {
  try {
    const db = await requireAdmin(request);
    const { data, error } = await db
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const db = await requireAdmin(request);
    const schema = z.object({
      name: z.string().trim().min(1, 'Category name is required').max(100),
      badge: z.string().trim().max(50).default(''),
      display_order: z.number().int().default(0),
    });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message || 'Invalid category input.');

    const name = parsed.data.name;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const badge = parsed.data.badge || name.toUpperCase();

    const { data, error } = await db
      .from('categories')
      .insert({
        name,
        slug,
        badge,
        display_order: parsed.data.display_order,
        is_active: true
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') throw new HttpError(409, 'A category with this name or slug already exists.');
      throw error;
    }

    return Response.json(data);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const db = await requireAdmin(request);
    const schema = z.object({
      id: z.number().int(),
      name: z.string().trim().min(1).max(100).optional(),
      badge: z.string().trim().max(50).optional(),
      display_order: z.number().int().optional(),
      is_active: z.boolean().optional()
    });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new HttpError(400, 'Invalid category update payload.');

    const { id, ...updates } = parsed.data;
    const payload: Record<string, unknown> = { ...updates };
    if (updates.name) {
      payload.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const { data, error } = await db
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    if (updates.name) {
      await db.from('templates').update({ category: updates.name }).eq('category_id', id);
    }

    return Response.json(data);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await requireAdmin(request);
    const id = new URL(request.url).searchParams.get('id');
    if (!id || isNaN(Number(id))) throw new HttpError(400, 'Invalid category ID.');

    const { error } = await db.from('categories').delete().eq('id', Number(id));
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}

import { z } from 'zod';
import { requireAdmin, apiError, HttpError } from '@/lib/admin';
import { isLegacyInquiry, legacyInquiry, loadInquiries, missingInquiryTable } from '@/lib/inquiry-data';

export async function GET(request: Request) {
  try {
    const db = await requireAdmin(request);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return Response.json(await loadInquiries(db), { headers: { 'Cache-Control': 'no-store' } });
    if (!z.uuid().safeParse(id).success) throw new HttpError(400, 'Invalid inquiry ID.');
    const primary = await db.from('inquiries').select('*').eq('id', id).maybeSingle();
    if (primary.error && !missingInquiryTable(primary.error)) throw primary.error;
    if (primary.data) return Response.json(primary.data, { headers: { 'Cache-Control': 'no-store' } });
    const legacy = await db.from('orders').select('*').eq('id', id).maybeSingle();
    if (legacy.error) throw legacy.error;
    if (!legacy.data || !isLegacyInquiry(legacy.data)) throw new HttpError(404, 'Inquiry not found.');
    return Response.json(legacyInquiry(legacy.data), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const db = await requireAdmin(request);
    const parsed = z.object({
      id: z.uuid(), status: z.enum(['New Inquiry', 'Contacted', 'Converted', 'Archived']).optional(),
      category: z.string().trim().min(1).max(100).regex(/^[^\[\]]+$/).optional(),
      template_name: z.string().max(200).optional()
    }).safeParse(await request.json());
    if (!parsed.success) throw new HttpError(400, 'Invalid inquiry update payload.');
    const { id, ...updates } = parsed.data;
    if (!Object.keys(updates).length) throw new HttpError(400, 'Choose an inquiry field to update.');
    const primary = await db.from('inquiries').update(updates).eq('id', id).select('id').maybeSingle();
    if (primary.error && !missingInquiryTable(primary.error)) throw primary.error;
    if (primary.data) return Response.json({ success: true, updated: 'inquiries' });
    const legacy = await db.from('orders').select('*').eq('id', id).maybeSingle();
    if (legacy.error) throw legacy.error;
    if (!legacy.data || !isLegacyInquiry(legacy.data)) throw new HttpError(404, 'Inquiry not found.');
    const orderUpdates: Record<string, string> = {};
    if (updates.status) orderUpdates.status = updates.status;
    if (updates.template_name !== undefined) orderUpdates.template_name = updates.template_name;
    if (updates.category) orderUpdates.message = `[Category: ${updates.category}] ${(legacy.data.message || '').replace(/\[Category: [^\]]+\]\s*/g, '')}`;
    const result = await db.from('orders').update(orderUpdates).eq('id', id).is('published_file', null).select('id').maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) throw new HttpError(404, 'Inquiry could not be updated.');
    return Response.json({ success: true, updated: 'orders' });
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request) {
  try {
    const db = await requireAdmin(request);
    const id = new URL(request.url).searchParams.get('id');
    if (!id || !z.uuid().safeParse(id).success) throw new HttpError(400, 'Invalid inquiry ID.');
    const primary = await db.from('inquiries').delete().eq('id', id).select('id').maybeSingle();
    if (primary.error && !missingInquiryTable(primary.error)) throw primary.error;
    if (primary.data) return Response.json({ success: true });
    const legacy = await db.from('orders').select('*').eq('id', id).maybeSingle();
    if (legacy.error) throw legacy.error;
    if (!legacy.data || !isLegacyInquiry(legacy.data)) throw new HttpError(404, 'Inquiry not found.');
    const result = await db.from('orders').delete().eq('id', id).is('published_file', null).select('id').maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) throw new HttpError(404, 'Inquiry could not be deleted.');
    return Response.json({ success: true });
  } catch (error) { return apiError(error); }
}

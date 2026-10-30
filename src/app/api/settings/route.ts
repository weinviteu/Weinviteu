import { publicWhatsAppNumber } from '@/lib/contact-settings';
import { supabase } from '@/lib/supabase';
import { requireAdmin, apiError, HttpError } from '@/lib/admin';
import { settingsSchema } from '@/lib/schemas';
export async function GET() {
  const { data, error } = await supabase.from('settings').select('studio_name,contact_email,whatsapp_number,location').eq('id', 1).single();
  if (error) return Response.json({ error: 'Settings are unavailable.' }, { status: 503 });
  return Response.json({ ...data, whatsapp_number: publicWhatsAppNumber(data.whatsapp_number) ? data.whatsapp_number : '' });
}
export async function PUT(request: Request) {
  try {
    const db = await requireAdmin(request);
    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) throw new HttpError(400, 'Enter a studio name, valid email and WhatsApp number.');
    const { error } = await db.from('settings').upsert({ ...parsed.data, id: 1, updated_at: new Date().toISOString() });
    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) { return apiError(error); }
}

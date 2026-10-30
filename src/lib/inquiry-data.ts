import type { SupabaseClient } from '@supabase/supabase-js';
import type { Inquiry, Order } from './models';

export function missingInquiryTable(error: { code?: string } | null) {
  return error && ['42P01', 'PGRST205'].includes(error.code || '');
}
export function isLegacyInquiry(order: Partial<Order>) {
  return !order.published_file && ['New Inquiry', 'Contacted', 'Converted', 'Archived'].includes(order.status || '');
}
export function legacyInquiry(order: Order): Inquiry {
  const category = order.message?.match(/\[Category: ([^\]]+)\]/)?.[1] || 'Wedding';
  const phone = order.message?.match(/\[Phone: ([^\]]+)\]/)?.[1];
  return { id: order.id, client_name: order.client_name, email: order.email, category, phone,
    template_name: order.template_name || '', message: order.message || '', status: order.status, created_at: order.created_at || '' };
}
export async function loadInquiries(db: SupabaseClient): Promise<Inquiry[]> {
  const primary = await db.from('inquiries').select('*').order('created_at', { ascending: false });
  if (primary.error && !missingInquiryTable(primary.error)) throw primary.error;
  const legacy = await db.from('orders').select('id,client_name,email,template_name,status,price,message,created_at,published_file').order('created_at', { ascending: false });
  if (legacy.error) throw legacy.error;
  const records = new Map<string, Inquiry>();
  for (const order of legacy.data || []) if (isLegacyInquiry(order)) records.set(order.id, legacyInquiry(order));
  for (const inquiry of primary.data || []) records.set(inquiry.id, inquiry);
  return [...records.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

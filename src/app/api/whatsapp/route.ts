import { publicWhatsAppNumber } from '@/lib/contact-settings';
import { supabase } from '@/lib/supabase';
export async function GET(request: Request) {
  const { data } = await supabase.from('settings').select('whatsapp_number').eq('id', 1).single();
  const number = publicWhatsAppNumber(data?.whatsapp_number);
  if (!number) return Response.redirect(new URL('/contact', request.url));
  const params = new URL(request.url).searchParams;
  const title = params.get('template');
  const message = params.get('text');
  const url = new URL(`https://wa.me/${number}`);
  if (message) url.searchParams.set('text', message.slice(0, 2000));
  else if (title) url.searchParams.set('text', `Hello, I would like to customize ${title.slice(0, 150)}.`);
  return Response.redirect(url);
}

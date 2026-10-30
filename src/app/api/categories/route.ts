import { supabase } from '@/lib/supabase';
export async function GET() {
  try {
    const { data, error } = await supabase.from('categories').select('*').eq('is_active', true).order('display_order', { ascending: true });
    if (error) throw error;
    return Response.json(data || [], { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Categories are unavailable. Please try again.' }, { status: 503 });
  }
}

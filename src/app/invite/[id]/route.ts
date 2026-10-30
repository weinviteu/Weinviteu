import { supabase } from '@/lib/supabase';
import { SLUG_PATTERN } from '@/lib/slug';
const UUID_PATTERN = /^[0-9a-f-]{36}$/i;
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  // Links use the client's name (/invite/priya-and-rahul); older links used the order UUID and still work.
  const isUuid = UUID_PATTERN.test(id);
  if (!isUuid && (id.length > 80 || !SLUG_PATTERN.test(id))) return new Response('Invitation not found', { status: 404 });
  // The database functions expose only a published storage filename.
  const { data: filename, error } = isUuid
    ? await supabase.rpc('invitation_file', { invitation_id: id })
    : await supabase.rpc('invitation_file_by_slug', { invitation_slug: id });
  if (error || !filename) return new Response('Invitation not found', { status: 404 });
  const { data: file, error: downloadError } = await supabase.storage.from('custom-templates').download(filename);
  if (downloadError || !file) return new Response('Invitation not found', { status: 404 });
  return new Response(await file.text(), { headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'Content-Security-Policy': "sandbox allow-scripts allow-forms allow-popups allow-modals; base-uri 'none'",
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    // Personal invitations are shared privately and must never appear in search results.
    'X-Robots-Tag': 'noindex, nofollow',
  } });
}

import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';
import { applyTemplatePresentation } from '@/lib/template-presentation';

export async function GET(request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (!/^[\w .()-]+\.html$/.test(filename)) return new Response('Template not found', { status: 404 });

  let html = '';
  // Try Supabase first
  try {
    const { data, error } = await supabase.storage.from('base-templates').download(filename);
    if (!error && data) {
      html = await data.text();
    }
  } catch (e) {
    // Ignore and fallback to local
  }

  // Fallback to local public/templates/
  if (!html) {
    const localPath = path.join(process.cwd(), 'public', 'templates', filename);
    if (fs.existsSync(localPath)) {
      html = fs.readFileSync(localPath, 'utf-8');
    }
  }

  if (!html) return new Response('Template not found', { status: 404 });
  html = applyTemplatePresentation(filename, html);

  const url = new URL(request.url);
  const autoscroll = url.searchParams.get('autoscroll') === '1' || url.searchParams.has('autoscroll');

  // Moving previews (hero tour) and silent card previews both need the preview script.
  const muted = url.searchParams.has('muted');
  if ((autoscroll || muted) && !html.includes('autoscroll.js')) {
    html = html.replace(/<head\b[^>]*>/i, '$&<script src="/templates/autoscroll.js"></script>');
  }

  return new Response(html, { headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': "sandbox allow-scripts allow-forms allow-popups allow-modals; base-uri 'none'",
    'X-Content-Type-Options': 'nosniff',
  } });
}

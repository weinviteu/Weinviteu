import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findTemplate, loadVisibleTemplates } from '@/lib/template-catalogue';
import { templatePath } from '@/lib/template-url';

/** Old template links used the numeric id. A real 308 here passes their ranking to the readable address. */
async function redirectOldTemplateLink(request: NextRequest) {
  const old = /^\/templates\/(-?\d+)$/.exec(request.nextUrl.pathname);
  if (!old) return null;
  const template = findTemplate(await loadVisibleTemplates().catch(() => []), old[1]);
  if (!template?.slug) return NextResponse.next();
  return NextResponse.redirect(new URL(templatePath(template), request.url), 308);
}

export async function proxy(request: NextRequest) {
  const oldTemplateLink = await redirectOldTemplateLink(request);
  if (oldTemplateLink) return oldTemplateLink;
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next();
  const token = request.cookies.get('admin_access')?.value;
  if (token) {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error } = await db.auth.getUser(token);
    if (!error && user?.app_metadata?.role === 'admin') return NextResponse.next();
  }
  return NextResponse.redirect(new URL('/admin/login', request.url));
}
export const config = { matcher: ['/admin/:path*', '/templates/:id(-?\\d+)'] };

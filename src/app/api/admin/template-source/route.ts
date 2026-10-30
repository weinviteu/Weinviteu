import { requireAdmin, apiError, HttpError } from '@/lib/admin';
import { readTemplate, writeTemplate } from '@/lib/template-source';
export async function GET(request: Request) {
  try {
    const db = await requireAdmin(request);
    const filename = new URL(request.url).searchParams.get('filename');
    if (!filename) throw new HttpError(400, 'Select a template.');
    return Response.json({ html: await readTemplate(db, filename) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  try {
    const db = await requireAdmin(request);
    const { filename, html } = await request.json();
    if (!filename || typeof html !== 'string') throw new HttpError(400, 'Filename and HTML content are required.');
    await writeTemplate(db, filename, html);
    return Response.json({ success: true });
  } catch (error) { return apiError(error); }
}


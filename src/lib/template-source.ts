import { bundledTemplates } from './bundled-templates';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from './admin';
import { applyTemplatePresentation } from './template-presentation';
export async function readTemplate(db: SupabaseClient, filename: string) {
  if (bundledTemplates.some(template => template.filename === filename)) return readRegisteredTemplate(db, filename);
  const { data, error } = await db.from('templates').select('filename').eq('filename', filename).single();
  if (error || !data) throw new HttpError(404, 'Template not found.');
  return readRegisteredTemplate(db, filename);
}

/** Only call after resolving a registered template. Paths and storage origins remain checked. */
export async function readRegisteredTemplate(db: SupabaseClient, filename: string) {
  if (filename.startsWith('http')) {
    const url = new URL(filename);
    const expected = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    if (url.origin !== expected.origin || !url.pathname.startsWith('/storage/v1/object/public/base-templates/')) throw new HttpError(400, 'Invalid template location.');
    const { data: file, error: downloadError } = await db.storage.from('base-templates').download(decodeURIComponent(url.pathname.split('/').pop()!));
    if (downloadError || !file) throw new HttpError(404, 'Template file not found.');
    return applyTemplatePresentation(filename, await file.text());
  }
  if (path.basename(filename) !== filename || !filename.endsWith('.html')) throw new HttpError(400, 'Invalid template filename.');
  return readFile(path.join(process.cwd(), 'public/templates', filename), 'utf8');
}

export async function writeTemplate(db: SupabaseClient, filename: string, html: string) {
  const { data, error } = await db.from('templates').select('filename').eq('filename', filename).single();
  if (error || !data) throw new HttpError(404, 'Template not found.');
  if (filename.startsWith('http')) {
    const url = new URL(filename);
    const expected = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    if (url.origin !== expected.origin || !url.pathname.startsWith('/storage/v1/object/public/base-templates/')) throw new HttpError(400, 'Invalid template location.');
    const objectName = decodeURIComponent(url.pathname.split('/').pop()!);
    const blob = new Blob([html], { type: 'text/html' });
    const { error: uploadError } = await db.storage.from('base-templates').upload(objectName, blob, { contentType: 'text/html', upsert: true });
    if (uploadError) throw uploadError;
    return;
  }
  if (path.basename(filename) !== filename || !filename.endsWith('.html')) throw new HttpError(400, 'Invalid template filename.');
  return writeFile(path.join(process.cwd(), 'public/templates', filename), html, 'utf8');
}

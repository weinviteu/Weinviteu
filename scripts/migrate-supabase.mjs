#!/usr/bin/env node
/**
 * Copies every row and uploaded file from the old Supabase project to the new one.
 * Run supabase/new_project_full_setup.sql on the new project and create its admin first.
 * The old project is only read. Safe to run again: rows and files are overwritten, never duplicated.
 *
 * Create .env.migrate (ignored by git, delete it afterwards) with:
 *   OLD_SUPABASE_URL=   OLD_SUPABASE_ANON_KEY=   OLD_ADMIN_EMAIL=   OLD_ADMIN_PASSWORD=
 *   NEW_SUPABASE_URL=   NEW_SUPABASE_ANON_KEY=   NEW_ADMIN_EMAIL=   NEW_ADMIN_PASSWORD=
 *
 *   node scripts/migrate-supabase.mjs --check    counts what would be copied, writes nothing
 *   node scripts/migrate-supabase.mjs            copies everything
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Parents first, so category links resolve. Orders go one at a time because each can hold a large invitation.
export const TABLES = [
  { name: 'categories', pageSize: 100 },
  { name: 'templates', pageSize: 100 },
  { name: 'settings', pageSize: 100 },
  { name: 'inquiries', pageSize: 100 },
  { name: 'orders', pageSize: 5, oneAtATime: true },
];
export const BUCKETS = ['base-templates', 'custom-templates'];

/** Rows store the project address in template links, so it has to change with the project. */
export function moveAddress(value, oldUrl, newUrl) {
  return JSON.parse(JSON.stringify(value).replaceAll(oldUrl, newUrl));
}

export async function readRows(db, table, pageSize) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db.from(table).select('*').order('id').range(from, from + pageSize - 1);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

export async function listFiles(db, bucket, prefix = '') {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`Could not list ${bucket}: ${error.message}`);
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      // Folders have no id.
      if (item.id == null) files.push(...await listFiles(db, bucket, path));
      else files.push({ path, size: item.metadata?.size ?? 0, type: item.metadata?.mimetype });
    }
    if (data.length < 1000) return files;
  }
}

export async function migrate({ from, to, oldUrl, newUrl, check = false, log = console.log }) {
  const problems = [];
  for (const { name, pageSize, oneAtATime } of TABLES) {
    const rows = (await readRows(from, name, pageSize)).map(row => moveAddress(row, oldUrl, newUrl));
    if (check) { log(`${name}: ${rows.length} rows`); continue; }
    for (const batch of oneAtATime ? rows.map(row => [row]) : rows.length ? [rows] : []) {
      const { error } = await to.from(name).upsert(batch, { onConflict: 'id' });
      if (error) problems.push(`${name} ${oneAtATime ? batch[0].id : ''}: ${error.message}`);
    }
    const copied = await readRows(to, name, pageSize);
    const missing = rows.filter(row => !copied.some(other => other.id === row.id));
    if (missing.length) problems.push(`${name}: ${missing.length} of ${rows.length} rows missing afterwards`);
    log(`${name}: ${rows.length - missing.length}/${rows.length} rows`);
  }
  for (const bucket of BUCKETS) {
    const files = await listFiles(from, bucket);
    if (check) { log(`${bucket}: ${files.length} files, ${(files.reduce((sum, file) => sum + file.size, 0) / 1e6).toFixed(1)} MB`); continue; }
    for (const file of files) {
      const { data, error } = await from.storage.from(bucket).download(file.path);
      const upload = error ? { error } : await to.storage.from(bucket).upload(file.path, data, { upsert: true, contentType: file.type || data.type });
      if (upload.error) problems.push(`${bucket}/${file.path}: ${upload.error.message}`);
      else log(`  ${bucket}/${file.path}`);
    }
    const copied = await listFiles(to, bucket);
    const missing = files.filter(file => !copied.some(other => other.path === file.path && other.size === file.size));
    if (missing.length) problems.push(`${bucket}: ${missing.length} of ${files.length} files missing or a different size afterwards`);
    log(`${bucket}: ${files.length - missing.length}/${files.length} files`);
  }
  return problems;
}

async function signIn(url, key, email, password, label) {
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Could not log in to the ${label} project: ${error.message}`);
  if (data.user.app_metadata?.role !== 'admin') throw new Error(`${email} is not an admin on the ${label} project. Run the UPDATE auth.users line from the setup file.`);
  return db;
}

async function main() {
  let text;
  try { text = readFileSync('.env.migrate', 'utf8'); } catch { throw new Error('Create .env.migrate first; the top of this script lists what goes in it.'); }
  const env = Object.fromEntries(text.split('\n').filter(line => /^\s*[A-Z_]+=/.test(line)).map(line => {
    const at = line.indexOf('=');
    return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
  }));
  const keys = ['URL', 'ANON_KEY', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
  const unset = ['OLD', 'NEW'].flatMap(side => keys.map(key => `${side}_${key === 'URL' || key === 'ANON_KEY' ? `SUPABASE_${key}` : key}`)).filter(key => !env[key]);
  if (unset.length) throw new Error(`Missing from .env.migrate: ${unset.join(', ')}`);
  const oldUrl = env.OLD_SUPABASE_URL.replace(/\/+$/, '');
  const newUrl = env.NEW_SUPABASE_URL.replace(/\/+$/, '');
  if (oldUrl === newUrl) throw new Error('The old and new project addresses are the same.');
  const check = process.argv.includes('--check');
  const from = await signIn(oldUrl, env.OLD_SUPABASE_ANON_KEY, env.OLD_ADMIN_EMAIL, env.OLD_ADMIN_PASSWORD, 'old');
  const to = await signIn(newUrl, env.NEW_SUPABASE_ANON_KEY, env.NEW_ADMIN_EMAIL, env.NEW_ADMIN_PASSWORD, 'new');
  const problems = await migrate({ from, to, oldUrl, newUrl, check });
  if (problems.length) {
    console.error(`\n${problems.length} problem(s). Fix them and run this again:`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log(check ? '\nCheck finished. Nothing was written.' : '\nAll rows and files copied and verified. Delete .env.migrate now.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exit(1); });
}

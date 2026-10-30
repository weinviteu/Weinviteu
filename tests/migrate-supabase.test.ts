import { describe, expect, it } from 'vitest';
import { BUCKETS, TABLES, listFiles, migrate, moveAddress, readRows } from '../scripts/migrate-supabase.mjs';

const OLD = 'https://old.supabase.co';
const NEW = 'https://new.supabase.co';
type Row = { id: number | string; [key: string]: unknown };
type File = { size: number; type: string };

/** In-memory stand-in for the parts of supabase-js the script uses. */
function fakeProject(rows: Record<string, Row[]>, files: Record<string, Record<string, File>> = {}, fail: { upsert?: string; upload?: string } = {}) {
  const writes: string[] = [];
  const store = rows;
  const db = {
    writes, store, files,
    from(table: string) {
      return {
        select: () => ({ order: () => ({ range: async (from: number, to: number) => ({ data: [...(store[table] || [])].sort((a, b) => String(a.id).localeCompare(String(b.id))).slice(from, to + 1), error: null }) }) }),
        upsert: async (batch: Row[]) => {
          writes.push(table);
          if (fail.upsert === table) return { error: { message: 'column does not exist' } };
          store[table] = [...(store[table] || []).filter(row => !batch.some(item => item.id === row.id)), ...batch];
          return { error: null };
        },
      };
    },
    storage: {
      from(bucket: string) {
        const content = (files[bucket] ||= {});
        return {
          list: async (prefix: string, { offset }: { offset: number }) => {
            const start = prefix ? `${prefix}/` : '';
            const names = new Map<string, { name: string; id: string | null; metadata?: { size: number; mimetype: string } }>();
            for (const [path, file] of Object.entries(content)) {
              if (!path.startsWith(start)) continue;
              const [head, ...rest] = path.slice(start.length).split('/');
              names.set(head, rest.length ? { name: head, id: null } : { name: head, id: path, metadata: { size: file.size, mimetype: file.type } });
            }
            return { data: [...names.values()].slice(offset, offset + 1000), error: null };
          },
          download: async (path: string) => ({ data: content[path], error: null }),
          upload: async (path: string, data: File, options: { upsert: boolean; contentType: string }) => {
            writes.push(path);
            if (fail.upload === path) return { error: { message: 'exceeded the maximum allowed size' } };
            expect(options.upsert).toBe(true);
            content[path] = { size: data.size, type: options.contentType };
            return { error: null };
          },
        };
      },
    },
  };
  return db;
}
const source = () => fakeProject({
  categories: [{ id: 1, name: 'Wedding' }],
  templates: [{ id: 12, filename: `${OLD}/storage/v1/object/public/base-templates/a.html` }, { id: 19, filename: 'hidden.html', enabled: false }],
  settings: [{ id: 1, studio_name: 'WeInviteU', email_notifications: true }],
  inquiries: [{ id: 'i1', client_name: 'Asha' }],
  orders: [{ id: 'o1', template_filename: `${OLD}/storage/v1/object/public/base-templates/a.html`, editor_state: { musicUrl: `${OLD}/x.mp3` }, source_html: '<h1>Hi</h1>' }],
}, { 'base-templates': { 'a.html': { size: 3, type: 'text/html' }, 'posters/a': { size: 2, type: 'image/webp' } }, 'custom-templates': { 'o1.html': { size: 5, type: 'text/html' } } });
const run = (from: ReturnType<typeof fakeProject>, to: ReturnType<typeof fakeProject>, check = false) => migrate({ from, to, oldUrl: OLD, newUrl: NEW, check, log: () => {} });

describe('moving to a new Supabase project', () => {
  it('copies every table and file, and moves the project address', async () => {
    const from = source(), to = fakeProject({});
    expect(await run(from, to)).toEqual([]);
    for (const { name } of TABLES) expect(to.store[name]).toHaveLength(from.store[name].length);
    expect(to.store.templates.find(row => row.id === 12)?.filename).toBe(`${NEW}/storage/v1/object/public/base-templates/a.html`);
    expect(to.store.templates.find(row => row.id === 19)?.enabled).toBe(false);
    expect(to.store.orders[0].template_filename).toContain(NEW);
    expect(to.store.orders[0].editor_state).toEqual({ musicUrl: `${NEW}/x.mp3` });
    expect(to.store.settings[0].email_notifications).toBe(true);
    expect(Object.keys(to.files['base-templates']).sort()).toEqual(['a.html', 'posters/a']);
    expect(to.files['custom-templates']['o1.html'].size).toBe(5);
  });
  it('never writes to the old project', async () => {
    const from = source();
    await run(from, fakeProject({}));
    expect(from.writes).toEqual([]);
    expect(from.store.templates[0].filename).toContain(OLD);
  });
  it('writes nothing in check mode', async () => {
    const to = fakeProject({});
    expect(await run(source(), to, true)).toEqual([]);
    expect(to.writes).toEqual([]);
  });
  it('can run twice without duplicating anything', async () => {
    const from = source(), to = fakeProject({});
    await run(from, to);
    expect(await run(from, to)).toEqual([]);
    expect(to.store.orders).toHaveLength(1);
    expect(to.store.templates).toHaveLength(2);
  });
  it('overwrites rows the setup file already seeded', async () => {
    const to = fakeProject({ templates: [{ id: 19, filename: 'hidden.html', enabled: true }] });
    await run(source(), to);
    expect(to.store.templates.find(row => row.id === 19)?.enabled).toBe(false);
  });
  it('reports a row or file that failed, and keeps going', async () => {
    const orders = await run(source(), fakeProject({}, {}, { upsert: 'orders' }));
    expect(orders.join()).toMatch(/orders o1: column does not exist/);
    expect(orders.join()).toMatch(/orders: 1 of 1 rows missing/);
    const to = fakeProject({}, {}, { upload: 'a.html' });
    const file = await run(source(), to);
    expect(file.join()).toMatch(/base-templates\/a.html: exceeded/);
    expect(to.files['custom-templates']['o1.html']).toBeTruthy();
  });
  it('notices a file that arrived at the wrong size', async () => {
    const from = source(), to = fakeProject({});
    const original = to.storage.from.bind(to.storage);
    to.storage.from = bucket => ({ ...original(bucket), upload: async (path: string) => { to.files[bucket][path] = { size: 1, type: 'x' }; return { error: null }; } });
    expect((await run(from, to)).join()).toMatch(/base-templates: 2 of 2 files missing or a different size/);
  });
  it('reads past one page and walks into folders', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `o${String(i).padStart(2, '0')}` }));
    expect(await readRows(fakeProject({ orders: many }), 'orders', 5)).toHaveLength(12);
    expect((await listFiles(source(), BUCKETS[0])).map((file: { path: string }) => file.path).sort()).toEqual(['a.html', 'posters/a']);
  });
  it('only changes the project address', () => {
    expect(moveAddress({ a: `${OLD}/x`, b: 'https://other.co', n: 1, z: null }, OLD, NEW)).toEqual({ a: `${NEW}/x`, b: 'https://other.co', n: 1, z: null });
  });
});

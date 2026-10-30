// @vitest-environment node
import { beforeEach, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ admin: vi.fn(), from: vi.fn(), upload: vi.fn(), remove: vi.fn(), update: vi.fn(), insert: vi.fn(), lookup: vi.fn(), template: vi.fn(), like: vi.fn() }));
vi.mock('@/lib/admin', async () => ({ ...await vi.importActual<typeof import('../src/lib/admin')>('../src/lib/admin'), requireAdmin: mocks.admin }));
vi.mock('@/lib/template-source', () => ({ readTemplate: vi.fn().mockResolvedValue('<body><h1>Original</h1></body>') }));
import { POST } from '../src/app/api/admin/orders/route';
import { readTemplate } from '../src/lib/template-source';
import { emptyEditor } from '../src/lib/models';
const id = '5bc55f29-7c46-42b2-89d9-f37c0c46cd26';
const request = (client_name = 'Client') => new Request('https://site.test/api/admin/orders', { method: 'POST', body: JSON.stringify({ id, client_name, email: 'client@example.com', template_filename: 'test.html', editor_state: { ...emptyEditor(), texts: { 'body.0.0': 'Saved name' } } }) });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(readTemplate).mockResolvedValue('<body><h1>Original</h1></body>');
  const orders = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: mocks.lookup, update: mocks.update, insert: mocks.insert, like: mocks.like };
  const templates = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: mocks.template };
  mocks.from.mockImplementation(table => table === 'orders' ? orders : templates);
  mocks.lookup.mockResolvedValue({ data: { id, template_filename: 'test.html', source_html: '<body><h1>Original</h1></body>', published_file: 'previous.html' } });
  mocks.template.mockResolvedValue({ data: { title: 'Template' } });
  mocks.like.mockResolvedValue({ data: [], error: null });
  mocks.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }); mocks.insert.mockResolvedValue({ error: null }); mocks.upload.mockResolvedValue({ error: null }); mocks.remove.mockResolvedValue({ error: null });
  mocks.admin.mockResolvedValue({ from: mocks.from, storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) } });
});
it('keeps the order ID and persists editable source and customization', async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ id, status: 'Customizing', source_html: '<body><h1>Original</h1></body>', editor_state: expect.objectContaining({ texts: { 'body.0.0': 'Saved name' } }) }));
  expect(mocks.upload.mock.calls[0][1]).toContain('Saved name');
  expect(mocks.remove).toHaveBeenCalledWith(['previous.html']);
});
it('retains the old published invitation when database saving fails', async () => {
  mocks.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: new Error('database failure') }) });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect((await POST(request())).status).toBe(500);
  expect(mocks.remove).toHaveBeenCalledWith([mocks.upload.mock.calls[0][0]]);
  expect(mocks.remove).not.toHaveBeenCalledWith(['previous.html']);
  vi.restoreAllMocks();
});
it('does not change the order if uploading fails', async () => {
  mocks.upload.mockResolvedValue({ error: new Error('upload failure') });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect((await POST(request())).status).toBe(500);
  expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled();
  vi.restoreAllMocks();
});
it('allows editing a saved draft after its template was removed from the library', async () => {
  mocks.lookup.mockResolvedValue({ data: { id, template_filename: 'test.html', template_name: 'Archived', source_html: '<body><h1>Original</h1></body>' } });
  mocks.template.mockResolvedValue({ data: null });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.update.mock.calls[0][0].template_name).toBe('Archived');
});

it('creates a new draft once when the order does not exist', async () => {
  mocks.lookup.mockResolvedValue({ data: null });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ id }));
  expect(mocks.update).not.toHaveBeenCalled();
});

it('gives a new invitation a link made from the client name', async () => {
  mocks.lookup.mockResolvedValue({ data: null });
  const response = await POST(request('Priya & Rahul'));
  expect(await response.json()).toMatchObject({ slug: 'priya-and-rahul', inviteUrl: '/invite/priya-and-rahul' });
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ slug: 'priya-and-rahul' }));
});
it('never reuses a name link that another client already has', async () => {
  mocks.lookup.mockResolvedValue({ data: null });
  mocks.like.mockResolvedValue({ data: [{ slug: 'priya-and-rahul' }, { slug: 'priya-and-rahul-2' }], error: null });
  expect((await (await POST(request('Priya & Rahul'))).json()).slug).toBe('priya-and-rahul-3');
});
it('retries with the next free link when a simultaneous save takes the same name', async () => {
  mocks.lookup.mockResolvedValue({ data: null });
  mocks.like.mockResolvedValueOnce({ data: [], error: null }).mockResolvedValueOnce({ data: [{ slug: 'asha' }], error: null });
  mocks.insert.mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate key value violates unique constraint "orders_slug_key"' } });
  expect((await (await POST(request('Asha'))).json()).slug).toBe('asha-2');
  expect(mocks.insert).toHaveBeenCalledTimes(2);
});
it('keeps an existing link and delivered status when the invitation is edited after sending', async () => {
  mocks.lookup.mockResolvedValue({ data: { id, slug: 'old-name', status: 'Link Delivered', template_filename: 'test.html', source_html: '<body><h1>Original</h1></body>' } });
  expect((await (await POST(request('New Name'))).json()).slug).toBe('old-name');
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ slug: 'old-name', status: 'Link Delivered' }));
  expect(mocks.like).not.toHaveBeenCalled();
});

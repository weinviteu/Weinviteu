// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ admin: vi.fn(), capture: vi.fn(), upload: vi.fn(), remove: vi.fn(), insert: vi.fn() }));
vi.mock('../src/lib/admin', async importOriginal => ({ ...await importOriginal<object>(), requireAdmin: mocks.admin }));
vi.mock('../src/lib/generate-template-poster', () => ({ generateTemplatePoster: mocks.capture }));
vi.mock('../src/lib/template-analyzer', () => ({ analyzeTemplate: () => ({ items: [] }) }));
import { POST } from '../src/app/api/admin/templates/route';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.capture.mockResolvedValue(Buffer.from('generated-cover'));
  mocks.upload.mockResolvedValue({ error: null });
  mocks.insert.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.admin.mockResolvedValue({
    storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove, getPublicUrl: (name: string) => ({ data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/base-templates/${name}` } }) }) },
    from: (table: string) => table === 'templates' ? { insert: mocks.insert, select: async () => ({ data: [{ slug: 'taken-invitation' }], error: null }) } : { select: () => ({ ilike: () => ({ maybeSingle: async () => ({ data: { id: 1 } }) }) }) },
  });
});

function request(cover?: File) {
  const form = new FormData();
  form.set('title', 'New invitation');
  form.set('category', 'Wedding');
  form.set('badge', 'NEW');
  form.set('file', new File(['<html><body>Front</body></html>'], 'new.html', { type: 'text/html' }));
  if (cover) form.set('poster', cover);
  return new Request('https://site.test/api/admin/templates', { method: 'POST', body: form });
}

it('captures and stores a front image before publishing an upload without a cover', async () => {
  expect((await POST(request())).status).toBe(200);
  expect(mocks.capture).toHaveBeenCalledWith('<html><body>Front</body></html>');
  const [name, cover, options] = mocks.upload.mock.calls[1];
  expect(name).toMatch(/^posters\//);
  expect(await cover.text()).toBe('generated-cover');
  expect(options.contentType).toBe('image/webp');
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ price: '2999', original_price: '', slug: 'new-wedding-invitation' }));
});

it('preserves an explicitly uploaded cover', async () => {
  expect((await POST(request(new File(['manual'], 'cover.png', { type: 'image/png' })))).status).toBe(200);
  expect(mocks.capture).not.toHaveBeenCalled();
  expect(await mocks.upload.mock.calls[1][1].text()).toBe('manual');
});

it.each([
  [100 * 1024 * 1024, 200],
  [100 * 1024 * 1024 + 1, 400],
])('validates a template of %i bytes with status %i', async (size, status) => {
  const req = request();
  const form = await req.formData();
  // Exercise the boundary without allocating a 100 MB fixture.
  Object.defineProperty(form.get('file'), 'size', { value: size });
  vi.spyOn(req, 'formData').mockResolvedValue(form);
  const response = await POST(req);
  expect(response.status).toBe(status);
  if (status === 400) {
    expect((await response.json()).error).toContain('up to 100 MB');
    expect(mocks.upload).not.toHaveBeenCalled();
  } else {
    expect(mocks.insert).toHaveBeenCalledOnce();
  }
});

it('does not publish or upload files if automatic capture fails', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  mocks.capture.mockRejectedValue(new Error('Browser unavailable'));
  const response = await POST(request());
  expect(response.status).toBe(503);
  expect((await response.json()).error).toContain('choose a cover image');
  expect(mocks.upload).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
  log.mockRestore();
});

it('removes the HTML if storing the generated cover fails', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  mocks.upload.mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: new Error('Storage full') });
  expect((await POST(request())).status).toBe(500);
  expect(mocks.remove).toHaveBeenCalledWith([mocks.upload.mock.calls[0][0]]);
  expect(mocks.insert).not.toHaveBeenCalled();
  log.mockRestore();
});

it('explains the Storage limit instead of blaming database setup', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  mocks.upload.mockResolvedValue({ error: { name: 'StorageApiError', message: 'The object exceeded the maximum allowed size', statusCode: '413' } });
  try {
    const response = await POST(request());
    expect(response.status).toBe(413);
    expect((await response.json()).error).toContain('Supabase Storage rejected this file');
    expect(mocks.insert).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});

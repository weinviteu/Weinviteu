// @vitest-environment node
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ admin: vi.fn(), single: vi.fn(), update: vi.fn(), eq: vi.fn(), fetch: vi.fn() }));
vi.mock('@/lib/admin', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/admin')>('../src/lib/admin');
  return { ...actual, requireAdmin: mocks.admin };
});
import { POST } from '../src/app/api/send-email/route';
const id = '5bc55f29-7c46-42b2-89d9-f37c0c46cd26';
const request = () => new Request('https://site.test/api/send-email', { method: 'POST', body: JSON.stringify({ orderId: id }) });
beforeEach(() => {
  vi.resetAllMocks();
  const chain = { select: vi.fn().mockReturnThis(), eq: mocks.eq, single: mocks.single, update: mocks.update };
  mocks.eq.mockReturnValue(chain); mocks.update.mockReturnValue(chain);
  mocks.admin.mockResolvedValue({ from: () => chain });
  mocks.single.mockResolvedValue({ data: { id, client_name: '<script>test</script>', email: 'client@example.com', published_file: `${id}-v1.html`, slug: 'priya-and-rahul', email_sent_count: 0, status: 'Customizing' } });
  vi.stubGlobal('fetch', mocks.fetch);
  vi.stubEnv('RESEND_API_KEY', 'test-key'); vi.stubEnv('EMAIL_FROM', 'hello@example.com'); vi.stubEnv('SITE_URL', 'https://site.test');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it('does not mark delivery when email is unconfigured', async () => {
  vi.stubEnv('RESEND_API_KEY', '');
  expect((await POST(request())).status).toBe(503);
  expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled();
});
it('records the failure but does not mark delivery when the provider rejects the send', async () => {
  mocks.fetch.mockResolvedValue(new Response('{}', { status: 500 }));
  expect((await POST(request())).status).toBe(502);
  expect(mocks.update).toHaveBeenCalledTimes(1);
  expect(mocks.update).toHaveBeenCalledWith({ last_email_error: expect.any(String) });
});
it('marks delivery after provider acceptance and escapes user content', async () => {
  mocks.fetch.mockResolvedValue(new Response('{"id":"message"}', { status: 200 }));
  expect((await POST(request())).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'Link Delivered', email_sent_to: 'client@example.com', email_sent_count: 1, last_email_error: null }));
  const email = JSON.parse(mocks.fetch.mock.calls[0][1].body);
  expect(email.html).toContain('&lt;script&gt;test&lt;/script&gt;');
  expect(email.to).toEqual(['client@example.com']);
  expect(email.html).toContain('https://site.test/invite/priya-and-rahul');
  expect(email.html).not.toContain(id);
});
it('counts resends and keeps a completed order completed', async () => {
  mocks.single.mockResolvedValue({ data: { id, client_name: 'A', email: 'client@example.com', published_file: 'f.html', slug: 'a', email_sent_count: 2, status: 'Completed' } });
  mocks.fetch.mockResolvedValue(new Response('{"id":"message"}', { status: 200 }));
  expect((await POST(request())).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'Completed', email_sent_count: 3 }));
  expect(mocks.fetch.mock.calls[0][1].headers['Idempotency-Key']).toBe('invite-f.html-3');
});

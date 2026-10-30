// @vitest-environment node
import { beforeEach, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ from: vi.fn(), insert: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { from: mocks.from } }));
import { POST } from '../src/app/api/inquiries/route';
const request = () => new Request('https://site.test/api/inquiries', { method: 'POST', body: JSON.stringify({ name: 'QA', email: 'qa@example.com', phone: '123456789', category: 'Wedding', template_name: 'Uploaded invite', message: 'Test' }) });
beforeEach(() => { vi.resetAllMocks(); mocks.from.mockReturnValue({ insert: mocks.insert }); });
it('saves inquiries with insert-only permissions and no private record read', async () => {
  mocks.insert.mockResolvedValue({ error: null });
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ success: true });
  expect(mocks.from).toHaveBeenCalledExactlyOnceWith('inquiries');
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ phone: '123456789', message: 'Test' }));
});
it('falls back only when the inquiries table is missing', async () => {
  mocks.insert.mockResolvedValueOnce({ error: { code: 'PGRST205' } }).mockResolvedValueOnce({ error: null });
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect((await response.json()).fallback).toBe(true);
  expect(mocks.from).toHaveBeenCalledWith('orders');
});
it('does not silently create an order when inquiry permission is denied', async () => {
  mocks.insert.mockResolvedValue({ error: { code: '42501' } });
  expect((await POST(request())).status).toBe(500);
  expect(mocks.from).toHaveBeenCalledTimes(1);
});

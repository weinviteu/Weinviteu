import { beforeEach, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock('../src/lib/client-api', async () => ({ ...await vi.importActual<typeof import('../src/lib/client-api')>('../src/lib/client-api'), api: mocks.api }));
import { finishInquiryConversion } from '../src/lib/inquiry-conversion';
beforeEach(() => vi.resetAllMocks());
it('waits for conversion confirmation before clearing the inquiry parameter', async () => {
  mocks.api.mockResolvedValue({ success: true });
  const result = await finishInquiryConversion('order', 'lead');
  expect(mocks.api).toHaveBeenCalledWith('/api/admin/inquiries', expect.objectContaining({ method: 'PATCH' }));
  expect(result.editorUrl).toBe('/admin/customize?order=order');
});
it('keeps saved invitation and a retry path when conversion fails', async () => {
  mocks.api.mockRejectedValue(new Error('Database unavailable'));
  const result = await finishInquiryConversion('order', 'lead');
  expect(result.editorUrl).toBe('/admin/customize?order=order&inquiry=lead');
  expect(result.message).toContain('Invitation saved, but');
  expect(result.message).toContain('Database unavailable');
  expect(result.message).toContain('Save again to retry');
});
it('does not attempt conversion when saving an ordinary order', async () => {
  await finishInquiryConversion('order', null);
  expect(mocks.api).not.toHaveBeenCalled();
});

// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ get: vi.fn(), getUser: vi.fn(), client: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.get }) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.client }));
import { requireAdmin } from '../src/lib/admin';
beforeEach(() => { vi.resetAllMocks(); mocks.client.mockReturnValue({ auth: { getUser: mocks.getUser } }); });
describe('server authorization', () => {
  it('rejects absent sessions before database access', async () => {
    await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it('rejects forged and expired tokens', async () => {
    mocks.get.mockReturnValue({ value: 'authenticated' });
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid') });
    await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
  });
  it('does not trust user-editable metadata', async () => {
    mocks.get.mockReturnValue({ value: 'token' });
    mocks.getUser.mockResolvedValue({ data: { user: { app_metadata: {}, user_metadata: { role: 'admin' } } } });
    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
  });
  it('allows a verified admin and rejects cross-site writes', async () => {
    mocks.get.mockReturnValue({ value: 'valid' });
    mocks.getUser.mockResolvedValue({ data: { user: { app_metadata: { role: 'admin' } } } });
    await expect(requireAdmin()).resolves.toHaveProperty('auth');
    await expect(requireAdmin(new Request('https://site.test/api/settings', { method: 'PUT', headers: { Origin: 'https://evil.test' } }))).rejects.toMatchObject({ status: 403 });
  });
});

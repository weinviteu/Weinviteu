// @vitest-environment node
import { beforeEach, it, expect, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  single: vi.fn(),
  maybeSingle: vi.fn()
}));

vi.mock('@/lib/admin', async () => ({
  ...await vi.importActual<typeof import('../src/lib/admin')>('../src/lib/admin'),
  requireAdmin: mocks.admin
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mocks.from(...args)
  }
}));

import { GET as publicGET } from '../src/app/api/categories/route';
import { GET as adminGET, POST, PATCH, DELETE } from '../src/app/api/admin/categories/route';

beforeEach(() => {
  vi.resetAllMocks();

  const chain = {
    select: mocks.select.mockReturnThis(),
    insert: mocks.insert.mockReturnThis(),
    update: mocks.update.mockReturnThis(),
    delete: mocks.delete.mockReturnThis(),
    eq: mocks.eq.mockReturnThis(),
    order: mocks.order.mockReturnThis(),
    single: mocks.single,
    maybeSingle: mocks.maybeSingle
  };

  mocks.from.mockReturnValue(chain);
  mocks.admin.mockResolvedValue({ from: mocks.from });
});

it('public GET returns active categories from the database', async () => {
  mocks.order.mockResolvedValue({
    data: [
      { id: 1, name: 'Wedding', slug: 'wedding', badge: 'WEDDING', display_order: 1, is_active: true },
      { id: 2, name: 'Birthday', slug: 'birthday', badge: 'BIRTHDAY', display_order: 2, is_active: true }
    ],
    error: null
  });

  const res = await publicGET();
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThanOrEqual(2);
});

it('admin POST creates a new category', async () => {
  mocks.single.mockResolvedValue({
    data: { id: 7, name: 'Reception', slug: 'reception', badge: 'RECEPTION', display_order: 7, is_active: true },
    error: null
  });

  const res = await POST(new Request('https://site.test/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Reception',
      badge: 'RECEPTION',
      display_order: 7
    })
  }));

  expect(res.status).toBe(200);
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Reception',
    slug: 'reception'
  }));
});

it('admin PATCH updates category properties', async () => {
  mocks.single.mockResolvedValue({
    data: { id: 1, name: 'Royal Wedding', slug: 'royal-wedding', badge: 'ROYAL WEDDING', is_active: true },
    error: null
  });

  const res = await PATCH(new Request('https://site.test/api/admin/categories', {
    method: 'PATCH',
    body: JSON.stringify({
      id: 1,
      name: 'Royal Wedding'
    })
  }));

  expect(res.status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Royal Wedding',
    slug: 'royal-wedding'
  }));
});

it('admin PATCH toggles category is_active status', async () => {
  mocks.single.mockResolvedValue({
    data: { id: 1, name: 'Wedding', is_active: false },
    error: null
  });

  const res = await PATCH(new Request('https://site.test/api/admin/categories', {
    method: 'PATCH',
    body: JSON.stringify({
      id: 1,
      is_active: false
    })
  }));

  expect(res.status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
    is_active: false
  }));
});

it('admin DELETE removes category by ID', async () => {
  mocks.delete.mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null })
  });

  const res = await DELETE(new Request('https://site.test/api/admin/categories?id=1'));
  expect(res.status).toBe(200);
  expect(mocks.delete).toHaveBeenCalled();
});

it('keeps all-disabled categories empty instead of restoring defaults', async () => {
  mocks.order.mockResolvedValue({ data: [], error: null });
  expect(await (await publicGET()).json()).toEqual([]);
  expect(await (await adminGET(new Request('https://site.test/api/admin/categories'))).json()).toEqual([]);
});
it('reports category database errors instead of returning fake active categories', async () => {
  mocks.order.mockResolvedValue({ data: null, error: { code: '42501' } });
  expect((await publicGET()).status).toBe(503);
  expect((await adminGET(new Request('https://site.test/api/admin/categories'))).status).toBe(500);
});

import React from 'react';
import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock('../src/lib/client-api', async () => ({ ...await vi.importActual<typeof import('../src/lib/client-api')>('../src/lib/client-api'), api: mocks.api }));
import InquiriesPage from '../src/app/admin/inquiries/page';
it('shows a retryable error rather than empty leads when the database request fails', async () => {
  mocks.api.mockRejectedValue(new Error('Your session expired. Please sign in again.'));
  render(<InquiriesPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Your session expired');
  expect(screen.getByRole('button', { name: 'Retry loading inquiries' })).toBeInTheDocument();
  expect(screen.queryByText('No inquiries found')).not.toBeInTheDocument();
  expect(screen.queryByText('TOTAL LEADS')).not.toBeInTheDocument();
});

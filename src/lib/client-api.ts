export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const body = await response.json().catch(() => {
    throw new Error(response.status === 413 ? 'This invitation is too large to save. Use smaller photos or a shorter audio file.' : 'The server returned an unreadable response. Please try again.');
  });
  if (!response.ok) throw new Error(body.error || 'Request failed. Please try again.');
  return body as T;
}
export function jsonBody(value: unknown): RequestInit {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) };
}
export function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong.'; }

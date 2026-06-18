import type { PublicMenuResponse } from '../types';

// In development this is http://localhost:3001
// On Vercel this will be your Railway URL set via VITE_API_URL env variable
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// Generic fetch wrapper — throws on non-2xx so callers don't have to check response.ok
async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);

  if (!response.ok) {
    // Try to parse a backend error message, fall back to HTTP status text
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse failure
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ── Public menu — no auth required ───────────────────────────────────────────
export const fetchPublicMenu = (slug: string): Promise<PublicMenuResponse> =>
  apiFetch<PublicMenuResponse>(`/api/menu/${slug}`);

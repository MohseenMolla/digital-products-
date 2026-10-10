const BASE = (process.env.BACKEND_URL ?? 'http://localhost:5000').replace(/\/$/, '');

/** Server-side GET against the Express API. Returns null on any failure so pages can render empty/error states. */
export async function sget<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/api${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

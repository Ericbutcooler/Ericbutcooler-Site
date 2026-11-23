// Small helpers shared by the comments and leaderboard functions.
import { getStore } from '@netlify/blobs';

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const store = (name) => getStore({ name, consistency: 'strong' });

export async function readList(s, key) {
  const v = await s.get(key, { type: 'json' });
  return Array.isArray(v) ? v : [];
}

// Trim, collapse whitespace, strip control characters.
export function clean(str, max) {
  return String(str ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export async function readBody(req) {
  try { return await req.json(); } catch { return null; }
}

// Very light per-IP throttle stored alongside the data.
export async function tooSoon(s, ip, ms) {
  if (!ip) return false;
  const key = 'throttle/' + ip.replace(/[^a-zA-Z0-9.:]/g, '_');
  const last = Number(await s.get(key)) || 0;
  const now = Date.now();
  if (now - last < ms) return true;
  await s.set(key, String(now));
  return false;
}

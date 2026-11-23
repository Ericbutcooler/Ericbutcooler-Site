// Doombutcooler leaderboard. Lower clear time wins.
// GET  /api/leaderboard-doom -> { scores: [{ name, time }] }
// POST /api/leaderboard-doom { name, time }
import { json, store, readList, clean, readBody, tooSoon } from '../lib/shared.mjs';

const KEEP = 50;

export default async (req, context) => {
  const s = store('leaderboard-doom');

  if (req.method === 'GET') {
    return json({ scores: await readList(s, 'all') });
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const name = clean(body?.name, 20);
    const time = Number(body?.time);
    if (!name) return json({ error: 'name required' }, 400);
    if (!Number.isFinite(time) || time < 5 || time > 7200) return json({ error: 'bad time' }, 400);
    if (await tooSoon(s, context.ip, 3000)) return json({ error: 'slow down a sec' }, 429);

    const list = await readList(s, 'all');
    list.push({ name, time: Math.round(time * 100) / 100, ts: Date.now() });
    list.sort((a, b) => a.time - b.time);
    await s.setJSON('all', list.slice(0, KEEP));
    return json({ ok: true });
  }

  return json({ error: 'method not allowed' }, 405);
};

export const config = { path: '/api/leaderboard-doom' };

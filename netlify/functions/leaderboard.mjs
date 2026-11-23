// Showering Roxy leaderboard, one board per difficulty. Lower time wins.
// GET  /api/leaderboard?difficulty=easy -> { scores: [{ name, time, difficulty }] }
// POST /api/leaderboard { name, time, difficulty }
import { json, store, readList, clean, readBody, tooSoon } from '../lib/shared.mjs';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const KEEP = 50;

export default async (req, context) => {
  const s = store('leaderboard-roxy');

  if (req.method === 'GET') {
    const d = new URL(req.url).searchParams.get('difficulty') || 'easy';
    if (!DIFFICULTIES.includes(d)) return json({ error: 'bad difficulty' }, 400);
    return json({ scores: await readList(s, d) });
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const name = clean(body?.name, 20);
    const time = Number(body?.time);
    const difficulty = String(body?.difficulty || '');
    if (!name) return json({ error: 'name required' }, 400);
    if (!DIFFICULTIES.includes(difficulty)) return json({ error: 'bad difficulty' }, 400);
    if (!Number.isFinite(time) || time < 1 || time > 3600) return json({ error: 'bad time' }, 400);
    if (await tooSoon(s, context.ip, 3000)) return json({ error: 'slow down a sec' }, 429);

    const list = await readList(s, difficulty);
    list.push({ name, time: Math.round(time * 100) / 100, difficulty, ts: Date.now() });
    list.sort((a, b) => a.time - b.time);
    await s.setJSON(difficulty, list.slice(0, KEEP));
    return json({ ok: true });
  }

  return json({ error: 'method not allowed' }, 405);
};

export const config = { path: '/api/leaderboard' };

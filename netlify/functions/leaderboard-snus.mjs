// Snus' Luis leaderboard. Most pouches landed in 40 seconds wins.
// GET  /api/leaderboard-snus -> { scores: [{ name, score }] }
// POST /api/leaderboard-snus { name, score }
import { json, store, readList, writeList, clean, readBody, tooSoon } from '../lib/shared.mjs';

const KEEP = 50;

export default async (req, context) => {
  const s = store('ericbutcooler-leaderboard-snus');

  if (req.method === 'GET') {
    return json({ scores: await readList(s, 'all', 'scores') });
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const name = clean(body?.name, 20);
    const score = Number(body?.score);
    if (!name) return json({ error: 'name required' }, 400);
    // One throw every ~0.3s for 40s caps out well under 200.
    if (!Number.isInteger(score) || score < 1 || score > 200) return json({ error: 'bad score' }, 400);
    if (await tooSoon(s, context.ip, 3000)) return json({ error: 'slow down a sec' }, 429);

    const list = await readList(s, 'all', 'scores');
    list.push({ name, score, ts: Date.now() });
    list.sort((a, b) => b.score - a.score || a.ts - b.ts);
    await writeList(s, 'all', 'scores', list.slice(0, KEEP));
    return json({ ok: true });
  }

  return json({ error: 'method not allowed' }, 405);
};

export const config = { path: '/api/leaderboard-snus' };

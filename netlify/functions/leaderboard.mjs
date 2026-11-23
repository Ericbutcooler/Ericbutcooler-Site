// Showering Roxy leaderboard, one board per difficulty. Lower time wins.
// GET  /api/leaderboard?difficulty=easy -> { scores: [{ name, time, difficulty }] }
// POST /api/leaderboard { name, time, difficulty }
import { json, store, readList, writeList, clean, readBody, tooSoon } from '../lib/shared.mjs';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const KEEP = 50;

// Scores posted on 23 Nov 2026, before this was pointed back at the original
// store, went into 'leaderboard-roxy'. Fold them in so nobody's time is lost.
async function readMerged(s, d) {
  const list = await readList(s, d, 'scores');
  const extra = await readList(store('leaderboard-roxy'), d, 'scores');
  const seen = new Set(list.map(x => x.name + '|' + x.time));
  for (const x of extra) if (!seen.has(x.name + '|' + x.time)) list.push(x);
  return list.sort((a, b) => a.time - b.time);
}

export default async (req, context) => {
  const s = store('ericbutcooler-leaderboard'); // original store from the old site

  if (req.method === 'GET') {
    const d = new URL(req.url).searchParams.get('difficulty') || 'easy';
    if (!DIFFICULTIES.includes(d)) return json({ error: 'bad difficulty' }, 400);
    return json({ scores: (await readMerged(s, d)).slice(0, KEEP) });
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

    const list = await readMerged(s, difficulty);
    list.push({ name, time: Math.round(time * 100) / 100, difficulty, ts: Date.now() });
    list.sort((a, b) => a.time - b.time);
    await writeList(s, difficulty, 'scores', list.slice(0, KEEP));
    return json({ ok: true });
  }

  return json({ error: 'method not allowed' }, 405);
};

export const config = { path: '/api/leaderboard' };

// GET  /api/comments  -> { comments: [{ name, text, ts }] }  (oldest first)
// POST /api/comments  { name, text } -> { ok: true, comment }
import { json, store, readList, clean, readBody, tooSoon } from '../lib/shared.mjs';

const MAX_KEPT = 500;

export default async (req, context) => {
  const s = store('comments');

  if (req.method === 'GET') {
    return json({ comments: await readList(s, 'all') });
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const name = clean(body?.name, 30);
    const text = clean(body?.text, 200);
    if (!name || !text) return json({ error: 'name and comment required' }, 400);
    if (await tooSoon(s, context.ip, 4000)) return json({ error: 'slow down a sec' }, 429);

    const list = await readList(s, 'all');
    let ts = Date.now();
    if (list.length && list[list.length - 1].ts >= ts) ts = list[list.length - 1].ts + 1;
    const comment = { name, text, ts };
    list.push(comment);
    await s.setJSON('all', list.slice(-MAX_KEPT));
    return json({ ok: true, comment });
  }

  return json({ error: 'method not allowed' }, 405);
};

export const config = { path: '/api/comments' };

// TEMPORARY: lists Netlify Blobs stores and their keys so old comments and
// scores can be located. Shows names, counts and field names only — never
// the text people wrote. Remove once the data has been reconnected.
import { listStores, getStore } from '@netlify/blobs';

function shape(v) {
  if (Array.isArray(v)) {
    return { type: 'array', length: v.length, fields: v[0] && typeof v[0] === 'object' ? Object.keys(v[0]) : typeof v[0] };
  }
  if (v && typeof v === 'object') {
    const out = { type: 'object', keys: Object.keys(v).slice(0, 20) };
    for (const [k, val] of Object.entries(v).slice(0, 10)) {
      if (Array.isArray(val)) out['len:' + k] = val.length;
    }
    return out;
  }
  return { type: typeof v };
}

export default async () => {
  const result = { stores: [] };
  let names = [];
  try { names = (await listStores()).stores; } catch (e) { result.listStoresError = String(e); }
  for (const name of names) {
    const entry = { name, keys: [] };
    try {
      const s = getStore({ name, consistency: 'strong' });
      const { blobs, directories } = await s.list({ directories: false });
      entry.keyCount = blobs.length;
      entry.directories = directories;
      for (const b of blobs.slice(0, 40)) {
        let info;
        try {
          const v = await s.get(b.key, { type: 'json' });
          info = shape(v);
        } catch {
          const raw = await s.get(b.key);
          info = { type: 'text', length: raw ? raw.length : 0 };
        }
        entry.keys.push({ key: b.key.startsWith('throttle/') ? 'throttle/*' : b.key, ...info });
      }
    } catch (e) { entry.error = String(e); }
    result.stores.push(entry);
  }
  return new Response(JSON.stringify(result, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};

export const config = { path: '/api/inspect-ddd7f98c3f6c8fdd13d2a74d' };

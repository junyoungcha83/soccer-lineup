// 축구 포지션 API — 팀 하나의 라인업을 여러 폰이 함께 쓴다. Cloudflare Worker + KV(키 'lineup').
//  GET /api/lineup   읽기(공개)
//  PUT /api/lineup   쓰기(X-Edit-Token = 게임월드와 같은 동기화 비밀번호). 덮어쓰지 않고 서버 값과 병합해 돌려준다.
// 병합 규칙: 현재 화면(board)은 boardAt 이 늦은 쪽, 저장함은 칸마다 at 이 늦은 쪽(지운 칸은 {del, at} 로 남긴다).
const ALLOWED_ORIGINS = ['https://junyoungcha83.github.io', 'http://localhost:8765'];
const MAX_BYTES = 1024 * 1024;
const SLOT_MAX = 20;

function cors(req) {
  const o = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Edit-Token',
    'Access-Control-Max-Age': '86400', 'Vary': 'Origin',
  };
}
const json = (obj, status, h) => new Response(JSON.stringify(obj), {
  status, headers: { ...h, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
const authed = (req, env) => !!env.EDIT_TOKEN && (req.headers.get('X-Edit-Token') || '') === env.EDIT_TOKEN;
const EMPTY = { board: null, boardAt: 0, slots: [] };

function valid(d) {
  return d && typeof d === 'object' && (d.board === null || typeof d.board === 'object') && typeof d.boardAt === 'number'
    && Array.isArray(d.slots) && d.slots.length <= SLOT_MAX
    && d.slots.every(s => s === null || (typeof s === 'object' && typeof s.at === 'number'));
}
function merge(sv, inc) {
  const boardNewer = inc.boardAt > sv.boardAt;
  const n = Math.max(sv.slots.length, inc.slots.length);
  return {
    board: boardNewer ? inc.board : sv.board,
    boardAt: boardNewer ? inc.boardAt : sv.boardAt,
    slots: Array.from({ length: n }, (_, i) => {
      const a = sv.slots[i] || null, b = inc.slots[i] || null;
      return (b?.at || 0) > (a?.at || 0) ? b : a;
    }),
  };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const h = cors(req);
    if (req.method === 'OPTIONS') return new Response(null, { headers: h });

    if (url.pathname === '/api/lineup') {
      let stored = EMPTY;
      try { stored = JSON.parse(await env.LINEUP.get('lineup')) || EMPTY; } catch {}
      if (req.method === 'GET') return json(stored, 200, h);
      if (req.method === 'PUT') {
        if (!authed(req, env)) return json({ error: 'unauthorized' }, 401, h);
        const body = await req.text();
        if (body.length > MAX_BYTES) return json({ error: 'too_large' }, 413, h);
        let inc; try { inc = JSON.parse(body); } catch { return json({ error: 'invalid_json' }, 400, h); }
        if (!valid(inc)) return json({ error: 'invalid_shape' }, 400, h);
        const merged = merge(stored, inc);
        await env.LINEUP.put('lineup', JSON.stringify(merged));
        return json(merged, 200, h);   // 병합 결과를 돌려줘 다른 폰에서 바뀐 것도 같이 받게 한다
      }
      return json({ error: 'method_not_allowed' }, 405, h);
    }
    if (url.pathname === '/' || url.pathname === '/api/health') return json({ ok: true, service: 'soccer-lineup-api' }, 200, h);
    return new Response('Not Found', { status: 404, headers: h });
  },
};

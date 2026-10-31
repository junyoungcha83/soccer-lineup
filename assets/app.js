// 축구 포지션 — 선발(경기장)·후보(아래 리스트) 배치. 드래그로 교체, 탭으로 번호/이름 수정. 상태는 localStorage.
'use strict';

// 좌표는 공격 방향이 위인 기준(x 왼→오, y 상대 골대→우리 골대)으로 적고, 화면에는 골키퍼가 위로 오게 뒤집어 그린다.
const BACK4 = [['LB', 13, 74], ['CB', 37, 74], ['CB', 63, 74], ['RB', 87, 74]];
const BACK3 = [['CB', 22, 74], ['CB', 50, 74], ['CB', 78, 74]];
const FORMATIONS = {
  '4-4-2': [...BACK4, ['LM', 15, 46], ['CM', 38, 50], ['CM', 62, 50], ['RM', 85, 46], ['ST', 36, 20], ['ST', 64, 20]],
  '4-3-3': [...BACK4, ['CM', 27, 50], ['CM', 50, 55], ['CM', 73, 50], ['LW', 18, 23], ['ST', 50, 17], ['RW', 82, 23]],
  '4-2-3-1': [...BACK4, ['DM', 36, 58], ['DM', 64, 58], ['LM', 17, 37], ['AM', 50, 38], ['RM', 83, 37], ['ST', 50, 15]],
  '4-1-4-1': [...BACK4, ['DM', 50, 60], ['LM', 15, 41], ['CM', 37, 43], ['CM', 63, 43], ['RM', 85, 41], ['ST', 50, 17]],
  '3-5-2': [...BACK3, ['LWB', 12, 47], ['CM', 33, 51], ['DM', 50, 58], ['CM', 67, 51], ['RWB', 88, 47], ['ST', 36, 20], ['ST', 64, 20]],
  '3-4-3': [...BACK3, ['LM', 15, 48], ['CM', 38, 52], ['CM', 62, 52], ['RM', 85, 48], ['LW', 20, 23], ['ST', 50, 17], ['RW', 80, 23]],
  '5-3-2': [['LWB', 10, 66], ['CB', 30, 74], ['CB', 50, 74], ['CB', 70, 74], ['RWB', 90, 66], ['CM', 28, 46], ['CM', 50, 50], ['CM', 72, 46], ['ST', 36, 20], ['ST', 64, 20]],
  '8인제 3-3-1': [['CB', 22, 72], ['CB', 50, 75], ['CB', 78, 72], ['LM', 20, 46], ['CM', 50, 50], ['RM', 80, 46], ['ST', 50, 20]],
  '8인제 2-3-2': [['CB', 33, 73], ['CB', 67, 73], ['LM', 18, 48], ['CM', 50, 52], ['RM', 82, 48], ['ST', 35, 21], ['ST', 65, 21]],
  '풋살 1-2-1': [['FIXO', 50, 70], ['ALA', 20, 46], ['ALA', 80, 46], ['PIVO', 50, 20]],
};
const GK = ['GK', 50, 92];
// 필드 선수는 세로로 28~86% 범위에 펼쳐 줄 간격을 넓힌다.
const toScreen = (x, y, gk) => [100 - x, gk ? 100 - y : 28 + (74 - y) * 58 / 59];
const slotsOf = f => [GK, ...FORMATIONS[f]].map(([p, x, y], i) => [p, ...toScreen(x, y, !i)]);

// 포지션 목록. 좌표가 있으면 고를 때 그 자리로 옮기고, 없으면(전술 역할·옛 포지션) 이름만 바꾼다.
const POS_GROUPS = [
  ['골키퍼', [['GK', '골키퍼', '골문을 지키는 유일하게 손을 쓰는 선수', 50, 92]]],
  ['수비수', [
    ['SW', '스위퍼 · 리베로', '센터백 뒤에서 뒷공간을 쓸어내는 최후방 수비', 50, 79],
    ['CB', '센터백', '수비 중앙', 50, 74], ['LCB', '왼쪽 센터백', '', 34, 74], ['RCB', '오른쪽 센터백', '', 66, 74],
    ['LB', '레프트백', '왼쪽 풀백', 13, 72], ['RB', '라이트백', '오른쪽 풀백', 87, 72],
    ['LWB', '레프트 윙백', '공격 가담이 많은 왼쪽 측면 수비', 10, 60], ['RWB', '라이트 윙백', '공격 가담이 많은 오른쪽 측면 수비', 90, 60]]],
  ['미드필더', [
    ['DM', '수비형 미드필더', 'CDM · 수비 라인 바로 앞', 50, 60], ['LDM', '왼쪽 수비형 미드', '', 35, 60], ['RDM', '오른쪽 수비형 미드', '', 65, 60],
    ['CM', '중앙 미드필더', '', 50, 50], ['LCM', '왼쪽 중앙 미드', '', 32, 50], ['RCM', '오른쪽 중앙 미드', '', 68, 50],
    ['LM', '레프트 미드필더', '왼쪽 측면 미드', 14, 46], ['RM', '라이트 미드필더', '오른쪽 측면 미드', 86, 46],
    ['AM', '공격형 미드필더', 'CAM · 10번 자리', 50, 36], ['LAM', '왼쪽 공격형 미드', '', 28, 36], ['RAM', '오른쪽 공격형 미드', '', 72, 36]]],
  ['공격수', [
    ['LW', '레프트 윙어', '왼쪽 측면 공격', 16, 23], ['RW', '라이트 윙어', '오른쪽 측면 공격', 84, 23],
    ['SS', '섀도 스트라이커', '최전방 공격수 바로 뒤', 50, 28], ['F9', '폴스 나인', '내려와서 연결하는 가짜 9번', 50, 24],
    ['LF', '레프트 포워드', '', 30, 20], ['RF', '라이트 포워드', '', 70, 20],
    ['CF', '센터 포워드', '최전방 중앙', 50, 18], ['ST', '스트라이커', '최전방 득점 담당', 50, 15],
    ['LS', '왼쪽 스트라이커', '투톱의 왼쪽', 36, 17], ['RS', '오른쪽 스트라이커', '투톱의 오른쪽', 64, 17]]],
  ['풋살', [
    ['FIXO', '픽소', '풋살 최후방 수비', 50, 70], ['ALA', '아라', '풋살 측면', 20, 46], ['PIVO', '피보', '풋살 최전방 기둥', 50, 20],
    ['유니버설', '유니버설', '풋살 전 포지션 소화']]],
  ['전술 역할 (이름만 바뀜)', [
    ['스위퍼키퍼', '스위퍼 키퍼', '박스 밖까지 나와 뒷공간을 막는 골키퍼'],
    ['스토퍼', '스토퍼', '상대 공격수를 앞으로 나가 막는 센터백'],
    ['볼플레잉CB', '볼 플레잉 디펜더', '후방 빌드업을 맡는 센터백'],
    ['인버티드FB', '인버티드 풀백', '공격 시 중앙으로 좁혀 들어오는 풀백'],
    ['앵커', '앵커', '수비 라인 앞을 지키는 홀딩 미드'], ['볼란치', '볼란치', '수비형 미드필더(브라질·일본식 표현)'],
    ['레지스타', '레지스타', '후방에서 경기를 조율하는 플레이메이커'], ['딥라잉PM', '딥라잉 플레이메이커', '깊은 위치의 패스 공급자'],
    ['박스투박스', '박스 투 박스', '양쪽 페널티박스를 오가는 미드'], ['메짤라', '메짤라', '측면 공간으로 침투하는 중앙 미드'],
    ['엔간체', '엔간체', '움직임은 적고 패스로 창조하는 10번'], ['트레콰르티스타', '트레콰르티스타', '미드와 공격 사이의 창조적 10번'],
    ['라움도이터', '라움도이터', '공간을 찾아 들어가는 공격수'], ['인사이드FW', '인사이드 포워드', '측면에서 안으로 파고드는 공격수'],
    ['인버티드윙어', '인버티드 윙어', '주발 반대쪽 측면에서 안으로 꺾는 윙어'],
    ['타깃맨', '타깃맨', '롱볼을 받아 버텨주는 장신 공격수'], ['포처', '포처', '박스 안 마무리 전문 공격수'],
    ['프레싱FW', '프레싱 포워드', '앞에서부터 압박하는 공격수']]],
  ['옛 포지션 (2-3-5 시절)', [
    ['FB', '풀백', '2-3-5의 수비수 2명'], ['CH', '센터하프', '2-3-5의 중앙 하프'], ['WH', '윙하프', '2-3-5의 측면 하프'],
    ['IL', '인사이드 레프트', '왼쪽 안쪽 공격수'], ['IR', '인사이드 라이트', '오른쪽 안쪽 공격수'],
    ['OL', '아웃사이드 레프트', '왼쪽 바깥 공격수'], ['OR', '아웃사이드 라이트', '오른쪽 바깥 공격수']]],
];
const POS = Object.fromEntries(POS_GROUPS.flatMap(([, list]) => list.map(([code, , , x, y]) => [code, { x, y }])));
const placed = code => POS[code]?.x != null;

// 슬롯별 [포지션 이름, 화면 x, 화면 y]. 목록에서 고른 포지션은 그 자리로, 같은 포지션이 여럿이면 좌우로 벌린다.
function layout() {
  const out = slotsOf(S.formation).map(([p, x, y], i) => {
    const code = S.pos[i];
    return placed(code) ? [code, ...toScreen(POS[code].x, POS[code].y, code === 'GK')] : [code || p, x, y];
  });
  const groups = {};
  out.forEach(([code], i) => { if (placed(S.pos[i])) (groups[code] ||= []).push(i); });
  for (const ids of Object.values(groups)) {
    if (ids.length < 2) continue;
    const x0 = out[ids[0]][1];
    ids.forEach((i, k) => {
      out[i][1] = Math.abs(x0 - 50) < 5
        ? 50 + (k - (ids.length - 1) / 2) * 24
        : (k % 2 ? 100 - x0 : x0) + Math.floor(k / 2) * (x0 < 50 ? 12 : -12) * (k % 2 ? -1 : 1);
    });
  }
  return out;
}

const KEY = 'soccer-lineup-v1';
const $ = id => document.getElementById(id);
let S = load();

function blank() {
  return { title: '', formation: '4-4-2', players: {}, starters: Array(11).fill(null), pos: Array(11).fill(null), bench: [] };
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && FORMATIONS[s.formation]) return s; } catch {}
  return blank();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
const uid = () => Math.random().toString(36).slice(2, 9);
const posName = i => S.pos[i] || slotsOf(S.formation)[i][0];

// 포메이션 변경: 인원이 줄면 넘치는 선발은 후보로, 늘면 빈 자리.
function setFormation(f) {
  const n = slotsOf(f).length;
  const extra = S.starters.slice(n).filter(Boolean);
  S.starters = Array.from({ length: n }, (_, i) => S.starters[i] ?? null);
  S.pos = Array(n).fill(null);
  S.bench.unshift(...extra);
  S.formation = f;
  save(); render();
  if (extra.length) toast(`${extra.length}명이 후보로 이동했어요`);
}

/* ---------- 렌더 ---------- */
function render() {
  $('title').value = S.title;
  $('formation').value = S.formation;
  $('slots').innerHTML = layout().map(([label, x, y], i) => {
    const p = S.players[S.starters[i]];
    return `<div class="slot${p ? '' : ' empty'}" data-slot="${i}" style="left:${x}%;top:${y}%">
      ${shirt(p ? p.num : '+', i === 0)}
      <div class="name">${p ? esc(p.name || '이름없음') : '빈 자리'}</div>
      <div class="pos">${esc(label)}</div></div>`;
  }).join('');
  $('benchCount').textContent = S.bench.length;
  $('benchList').innerHTML = S.bench.length ? S.bench.map((id, k) => {
    const p = S.players[id];
    return `<li class="bench-item" data-bench="${k}">
      ${shirt(p.num, false)}<div class="name">${esc(p.name || '이름없음')}</div>
      <div class="handle" aria-label="끌어서 교체">☰</div></li>`;
  }).join('') : '<li class="empty-bench">후보가 없어요. 경기장 선수를 여기로 끌어오거나 + 선수 추가</li>';
}
const SHIRT = 'M13 2 4 7 0 17l7 3 2-4v22h22V16l2 4 7-3-4-10-9-5c-1 3-4 5-7 5s-6-2-7-5z';
function shirt(num, gk) {
  const body = gk ? '#16181b' : '#e0362c', trim = gk ? '#5fb4e8' : '#c42a22';
  return `<div class="shirt"><svg viewBox="0 0 40 40"><path d="${SHIRT}" fill="${body}"/>` +
    `<path d="M4 7 0 17l7 3 2-4V10z M36 7l4 10-7 3-2-4V10z" fill="${trim}"/></svg><b>${esc(num)}</b></div>`;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- 드래그 (마우스·터치 공용 Pointer Events) ---------- */
// 경기장 선수와 후보의 ☰는 바로 드래그, 후보 줄의 나머지 부분은 길게 눌러 드래그(짧게 누르면 스크롤·탭).
let drag = null;

function srcOf(el) {
  const s = el.closest('[data-slot]'); if (s) return { type: 'slot', i: +s.dataset.slot, el: s };
  const b = el.closest('[data-bench]'); if (b) return { type: 'bench', i: +b.dataset.bench, el: b };
  return null;
}
function targetAt(x, y) {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  return srcOf(el) || (el.closest('[data-bench-zone]') ? { type: 'zone', el: $('benchList') } : null);
}

document.addEventListener('pointerdown', e => {
  if (e.button > 0 || drag) return;
  const src = srcOf(e.target);
  if (!src) return;
  const instant = src.type === 'slot' || e.target.closest('.handle') || e.pointerType === 'mouse';
  drag = { src, x0: e.clientX, y0: e.clientY, active: false, id: e.pointerId, target: null, timer: null };
  if (!instant) drag.timer = setTimeout(() => drag && startDrag(drag.x0, drag.y0), 350);
});

window.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const moved = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6;
  if (!drag.active) {
    if (!moved) return;
    if (drag.timer) { cancelDrag(); return; } // 길게 누르기 전에 움직이면 스크롤로 본다
    startDrag(e.clientX, e.clientY);
  }
  drag.ghost.style.left = e.clientX + 'px';
  drag.ghost.style.top = e.clientY + 'px';
  const t = targetAt(e.clientX, e.clientY);
  const valid = t && !(t.type === drag.src.type && t.i === drag.src.i) ? t : null;
  if (drag.target?.el !== valid?.el) {
    drag.target?.el.classList.remove('target', 'over');
    valid?.el.classList.add(valid.type === 'zone' ? 'over' : 'target');
  }
  drag.target = valid;
});

// 드래그 중 터치 스크롤 막기 (pointercancel 방지)
document.addEventListener('touchmove', e => { if (drag?.active) e.preventDefault(); }, { passive: false });

window.addEventListener('pointerup', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const { src, active, target } = drag;
  cancelDrag();
  if (!active) openEdit(src);
  else if (target) drop(src, target);
});
window.addEventListener('pointercancel', () => cancelDrag());

function startDrag(x, y) {
  clearTimeout(drag.timer); drag.timer = null; drag.active = true;
  const { type, i } = drag.src;
  const p = S.players[type === 'slot' ? S.starters[i] : S.bench[i]];
  if (!p) { cancelDrag(); return; } // 빈 자리는 끌 수 없음
  const g = document.createElement('div');
  g.className = 'ghost-drag'; g.innerHTML = shirt(p.num, type === 'slot' && i === 0);
  g.style.left = x + 'px'; g.style.top = y + 'px';
  document.body.appendChild(g);
  drag.ghost = g;
  drag.src.el.classList.add('dragging-src');
  navigator.vibrate?.(15);
}
function cancelDrag() {
  if (!drag) return;
  clearTimeout(drag.timer);
  drag.ghost?.remove();
  drag.src.el.classList.remove('dragging-src');
  drag.target?.el.classList.remove('target', 'over');
  drag = null;
}

function drop(src, t) {
  const st = S.starters, bn = S.bench;
  if (src.type === 'slot' && t.type === 'slot') {
    [st[src.i], st[t.i]] = [st[t.i], st[src.i]];
  } else if (src.type === 'slot' && t.type === 'bench') {
    [st[src.i], bn[t.i]] = [bn[t.i], st[src.i]];
    toast('교체 완료');
  } else if (src.type === 'slot' && t.type === 'zone') {
    bn.push(st[src.i]); st[src.i] = null;
  } else if (src.type === 'bench' && t.type === 'slot') {
    const out = st[t.i];
    st[t.i] = bn[src.i];
    if (out) bn[src.i] = out; else bn.splice(src.i, 1);
    toast(out ? '교체 완료' : '선발 투입');
  } else if (src.type === 'bench' && t.type === 'bench') {
    const [id] = bn.splice(src.i, 1); bn.splice(t.i, 0, id);
  } else return;
  save(); render();
}

/* ---------- 편집 ---------- */
let editing = null;
function openEdit(src) {
  editing = src;
  const isSlot = src.type === 'slot';
  const id = isSlot ? S.starters[src.i] : S.bench[src.i];
  const p = S.players[id];
  $('editTitle').textContent = isSlot ? (p ? '선발 선수' : '빈 자리에 선수 넣기') : '후보 선수';
  $('posRow').hidden = !isSlot;
  $('fPos').value = isSlot ? posName(src.i) : '';
  $('fNum').value = p?.num || '';
  $('fName').value = p?.name || '';
  $('fBench').hidden = !(isSlot && p);
  $('fDelete').hidden = !p;
  $('editDlg').showModal();
  if (!p) $('fNum').focus();
}
function addPlayer() { editing = { type: 'new' }; openNew(); }
function openNew() {
  $('editTitle').textContent = '후보 추가';
  $('posRow').hidden = true;
  $('fNum').value = ''; $('fName').value = '';
  $('fBench').hidden = $('fDelete').hidden = true;
  $('editDlg').showModal(); $('fNum').focus();
}

$('editForm').addEventListener('submit', e => {
  if (e.submitter?.value !== 'ok' || !editing) return;
  const num = $('fNum').value.trim(), name = $('fName').value.trim();
  const isSlot = editing.type === 'slot';
  let id = isSlot ? S.starters[editing.i] : editing.type === 'bench' ? S.bench[editing.i] : null;
  if (isSlot) {
    const def = slotsOf(S.formation)[editing.i][0], v = $('fPos').value.trim().toUpperCase();
    S.pos[editing.i] = v && v !== def ? v : null;
  }
  if (num || name) {
    if (num && Object.entries(S.players).some(([k, p]) => k !== id && p.num === num)) toast(`백넘버 ${num}번이 이미 있어요`);
    if (!id) {
      id = uid();
      if (isSlot) S.starters[editing.i] = id; else S.bench.push(id);
    }
    S.players[id] = { num, name };
  }
  save(); render();
});
// 입력칸에서 엔터 = 저장 (기본 동작은 첫 번째 제출 버튼인 '취소'가 눌린다)
$('editForm').addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !e.isComposing) { e.preventDefault(); $('fOk').click(); }
});
$('fBench').onclick = () => {
  S.bench.push(S.starters[editing.i]); S.starters[editing.i] = null;
  $('editDlg').close(); save(); render();
};
$('fDelete').onclick = () => {
  const isSlot = editing.type === 'slot';
  const id = isSlot ? S.starters[editing.i] : S.bench[editing.i];
  if (!confirm(`${S.players[id].name || '이 선수'}를 삭제할까요?`)) return;
  if (isSlot) S.starters[editing.i] = null; else S.bench.splice(editing.i, 1);
  delete S.players[id];
  $('editDlg').close(); save(); render();
};

/* ---------- 포지션 목록 ---------- */
$('posList').innerHTML = POS_GROUPS.map(([group, list]) => `<h4>${esc(group)}</h4>` + list.map(([code, name, desc, x]) =>
  `<button type="button" class="pos-item" data-code="${esc(code)}"><b>${esc(code)}</b><span>${esc(name)}` +
  `${desc ? `<small>${esc(desc)}</small>` : ''}</span>${x != null ? '<i>📍</i>' : ''}</button>`).join('')).join('');
$('posListBtn').onclick = () => {
  const cur = $('fPos').value.trim().toUpperCase();
  $('posList').querySelectorAll('.pos-item').forEach(b => b.classList.toggle('on', b.dataset.code === cur));
  $('posDlg').showModal();
  $('posList').querySelector('.on')?.scrollIntoView({ block: 'center' });
};
$('posList').onclick = e => {
  const b = e.target.closest('.pos-item'); if (!b) return;
  $('fPos').value = b.dataset.code; $('posDlg').close();
};
$('posClose').onclick = () => $('posDlg').close();

/* ---------- 상단·메뉴 ---------- */
$('formation').innerHTML = Object.keys(FORMATIONS).map(f => `<option>${f}</option>`).join('');
$('formation').onchange = e => setFormation(e.target.value);
$('title').oninput = e => { S.title = e.target.value; save(); };
$('addBtn').onclick = addPlayer;
$('menuBtn').onclick = () => $('menuDlg').showModal();
$('resetPos').onclick = () => { S.pos = S.pos.map(() => null); save(); render(); $('menuDlg').close(); };
$('clearAll').onclick = () => {
  if (!confirm('선수와 배치를 모두 지울까요?')) return;
  S = blank(); save(); render(); $('menuDlg').close();
};

$('shareBtn').onclick = async () => {
  const line = id => { const p = S.players[id]; return `${p.num ? p.num + '번 ' : ''}${p.name || '이름없음'}`; };
  const starters = S.starters.map((id, i) => `${posName(i)} ${id ? line(id) : '(비어있음)'}`);
  const text = [S.title || '라인업', `포메이션 ${S.formation}`, '', '[선발]', ...starters, '', `[후보 ${S.bench.length}]`,
    ...(S.bench.length ? S.bench.map(line) : ['없음'])].join('\n');
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); toast('라인업을 복사했어요'); }
  } catch (err) {
    if (err.name !== 'AbortError') { await navigator.clipboard?.writeText(text).catch(() => {}); toast('라인업을 복사했어요'); }
  }
};

let toastT;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1600);
}

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

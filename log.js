// PLS_LOG (web) – gửi số liệu về Apps Script PLS_anim_collector.gs giống plugin: bảng ANH (Cần vẽ) qua kind 'sync',
// sự kiện image / lint / layout qua kind 'events'. Hàng đợi giữ trong trình duyệt khi mất mạng, tự gửi lại.
(function (root) {
  'use strict';
  const CFG = root.PLS_CONFIG || {};
  const QK = 'pls_web_log_q';
  const T = { anh: { head: ['#', 'Ngày', 'File / người', 'Brand · Bài', 'Khung', 'Ô', 'Nghĩa cần hình', 'Nguồn ảnh', 'Hash', 'Link Drive', 'Trạng thái', 'Ghi chú'], keys: ['id', 'ngay', 'nguoi', 'bai', 'khung', 'o', 'nghia', 'nguon', 'hash', 'link', 'trangthai', 'ghichu'] } };
  const load = () => { try { return JSON.parse(localStorage.getItem(QK)) || { rows: [], events: [] }; } catch (e) { return { rows: [], events: [] }; } };
  const save = q => { try { localStorage.setItem(QK, JSON.stringify({ rows: q.rows.slice(-2000), events: q.events.slice(-5000) })); } catch (e) { console.warn('[PLS_LOG] không lưu được hàng đợi'); } };
  const today = () => { const d = new Date(); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear(); };
  const newId = () => 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const FILE = 'PLS Studio (web)';
  async function post(body) {   // Apps Script không trả CORS → gửi "no-cors", không đọc được kết quả; coi như đã gửi nếu fetch không lỗi mạng
    if (!CFG.logUrl) return false;
    try { await fetch(CFG.logUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }); return true; } catch (e) { console.warn('[PLS_LOG] gửi lỗi', e); return false; }
  }
  async function flush() {
    const q = load(); if (!q.rows.length && !q.events.length) return { sent: 0 };
    let ok = true;
    if (q.rows.length) { const by = {}; q.rows.forEach(it => (by[it.table] = by[it.table] || []).push(it.row)); ok = await post({ kind: 'sync', v: 'web', t: new Date().toISOString(), file: FILE, fileKey: 'web', tables: Object.keys(by).map(k => ({ table: k, head: T[k].head, rows: by[k] })) }); if (ok) q.rows = []; }
    if (q.events.length) { const ok2 = await post({ kind: 'events', file: FILE, fileKey: 'web', events: q.events }); if (ok2) q.events = []; ok = ok && ok2; }
    save(q); return { ok, left: q.rows.length + q.events.length };
  }
  function add(table, o) {
    const t = T[table]; const cells = t.keys.map(k => o[k] == null ? '' : String(o[k])); cells[0] = cells[0] || newId(); cells[1] = cells[1] || today();
    const q = load(); q.rows.push({ table, row: { no: cells[0], cells } }); save(q); flush(); return cells[0];
  }
  function events(list) { const q = load(); const t = new Date().toISOString(); q.events.push(...list.map(e => Object.assign({ t }, e))); save(q); return flush(); }
  root.PLS_LOG = { add, events, flush, queued: () => { const q = load(); return q.rows.length + q.events.length; } };
  setTimeout(flush, 3000);
})(window);

// BẢNG DỮ LIỆU GỐC (người dùng 29/10): dưới slide, xem S5 / S6 của buổi như trang Excel – tô ĐÚNG ô đã tạo ra slide đang chọn
// (import-excel ghi lại ô nào bị đọc khi dựng → flow.cells, không dò chữ). Sửa ô ngay trong bảng → slide, sách, "Tải S5-S6 đã sửa" theo.
// Sai nối dữ liệu → chỉ định bằng cột điều khiển (tô tím): S5 "Nguồn S6" (bước lấy sheet nào), S6 "Bước S5" (dòng thuộc bước nào), "Buổi", "Lên PPT".
(function (root) {
  const I = () => root.PLS && root.PLS._int, $ = q => document.querySelector(q);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = v => v == null ? '' : String(v).trim();
  const bNum = v => { const m = String(v == null ? '' : v).replace(/,/g, '.').match(/\d+(?:\.\d+)?/); return m ? +m[0] : NaN; };
  const short = k => String(k).replace(/^S6-/, '');
  const GUIDE = /Hướng dẫn giảng dạy/;
  const ctrlOf = (kind, sh) => kind === 's5' ? (GUIDE.test(sh) ? ['Nguồn S6'] : []) : ['Bước S5', 'Buổi', 'Lên PPT'];
  const HOW = { nguon: ['ok', 'chỉ định: Nguồn S6'], buoc: ['ok', 'chỉ định: Bước S5'], doan: ['warn', 'tự đoán theo tên hoạt động – nên điền Nguồn S6 / Bước S5'] };
  let tabSel = null, lastSel = null, info = null, all = false;   // all: hiện cả sheet / dòng khác của buổi (để chỉ định lại) – mặc định chỉ chỗ slide đang lấy

  // sửa ô: ghi vào dữ liệu đang mở + danh sách chờ ghi file (book.cellEdits) → dựng lại, giữ mọi chỉnh sửa khác
  function applyEdits(book) { (book.cellEdits || []).forEach(e => { const rows = book[e.kind] && book[e.kind][e.sh]; const row = rows && rows.find(x => x.__r === e.r); if (row) row[e.key] = e.val; }); return book; }
  async function commit(kind, sh, r, key, val) {
    const st = I().state, book = st.book, rows = book[kind] && book[kind][sh], row = rows && rows.find(x => x.__r === r); if (!row) return;
    if (S(row[key]) === S(val)) { render(); return; }
    row[key] = val; book.cellEdits = (book.cellEdits || []).filter(e => !(e.kind === kind && e.sh === sh && e.r === r && e.key === key)).concat({ kind, sh, r, key, val });
    if (root.PLS_QC) root.PLS_QC.refresh();
    try { const names = [st.srcFiles && st.srcFiles.s6, st.srcFiles && st.srcFiles.s5].filter(Boolean).map(x => x.name); if (I().saveRecent && names.length) await I().saveRecent(book, names, st.srcFiles); } catch (e) { /* bỏ qua */ }
    I().setStatus && I().setStatus(`Đã sửa ${short(sh)} · dòng ${r} · ${key} → dựng lại slide`);
    await I().rebuildKeep(); render();
  }

  function sheetsOf(st, buoi) {
    const out = [];
    for (const kind of ['s5', 's6']) for (const [sh, rows] of Object.entries((st.book || {})[kind] || {})) {
      if (!Array.isArray(rows) || !rows.length || !rows.some(r => 'Buổi' in r) || /Thông tin|Nhật ký/.test(sh)) continue;
      const mine = rows.filter(r => bNum(r['Buổi']) === buoi); if (mine.length) out.push({ kind, sh, rows: mine });
    }
    return out;
  }
  function ctx() {
    const st = (I() || {}).state, r = st && st.slides && st.slides[st.sel]; if (!r || !st.book || !st.flow) return null;
    const f = st.flow, si = (f.slideStep || [])[r.src], step = si >= 0 ? f.steps[si] : null, cells = (f.cells || [])[r.src] || [];
    const hit = new Map(), nt = new Map(); cells.forEach(([kind, sh, row, keys, nk]) => { hit.set(kind + '|' + sh + '|' + row, keys); nt.set(kind + '|' + sh + '|' + row, nk || []); });
    const usedRows = new Set(); (f.cells || []).forEach(cs => (cs || []).forEach(x => usedRows.add(x[0] + '|' + x[1] + '|' + x[2])));
    return { st, r, f, step, cells, hit, nt, usedRows, buoi: f.buoi };
  }
  const slidesOfRow = (c, kind, sh, row) => { const sp = new Set(); (c.f.cells || []).forEach((cs, i) => { if (cs && cs.some(x => x[0] === kind && x[1] === sh && x[2] === row)) sp.add(i); });
    return (c.st.slides || []).map((x, i) => sp.has(x.src) ? i : -1).filter(i => i >= 0); };

  function render() {
    const c = ctx(); let box = $('#srcBox');
    if (!c) { if (box) box.remove(); return; }
    if (box && box.contains(document.activeElement) && /TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;   // đang sửa ô → không vẽ lại
    if (!box) { box = document.createElement('details'); box.id = 'srcBox'; $('#canvas').after(box);   /* ngay dưới slide, trên Ghi chú giảng */
      try { box.open = !!localStorage.getItem('pls_srcbox_open'); } catch (e) { /* */ }
      box.addEventListener('toggle', () => { try { localStorage.setItem('pls_srcbox_open', box.open ? '1' : ''); } catch (e) { /* */ } render(); }); }
    const selKey = c.st.sel + '|' + c.r.src; if (selKey !== lastSel) { tabSel = null; info = null; all = false; lastSel = selKey; }
    const sheets0 = sheetsOf(c.st, c.buoi), cnt = s => s.rows.reduce((a, r) => { const k = s.kind + '|' + s.sh + '|' + r.__r; return a + (c.hit.get(k) || []).length - (c.nt.get(k) || []).length; }, 0), any = s => s.rows.some(r => c.hit.has(s.kind + '|' + s.sh + '|' + r.__r));   // số trên tab = ô hiện trên slide
    const nNote = c.cells.reduce((a, x) => a + (x[4] || []).length, 0), nCell = c.cells.reduce((a, x) => a + x[3].length, 0) - nNote, used = [...new Set(c.cells.map(x => short(x[1])))];
    const isStepSheet = s => c.step && c.step.g5 && s.kind === 's5' && c.step.g5.sheet === s.sh;
    const sheets = all ? sheets0 : sheets0.filter(s => any(s) || isStepSheet(s)).map(s => Object.assign({}, s, { rows: s.rows.filter(r => c.hit.has(s.kind + '|' + s.sh + '|' + r.__r) || (isStepSheet(s) && c.step.g5.r === r.__r)) }));
    const how = c.step ? HOW[c.step.how] || HOW.doan : null;
    const head = `<summary><b>Dữ liệu gốc Excel</b> · ${c.step ? `Bước ${c.step.stt != null && !isNaN(c.step.stt) ? c.step.stt + '. ' : ''}${esc(c.step.name)} ${how && how[0] === 'ok' ? `<span class="sb-how ok">${esc(how[1])}</span>` : ''}` : 'Phần đầu buổi'} · ${nCell || nNote ? `${nCell} ô trên slide${nNote ? ` · ${nNote} ô vào ghi chú giảng` : ''} · ${esc(used.join(', '))}` : 'không lấy ô nào'}</summary>`;
    if (!box.open) { box.innerHTML = head; return; }
    let cur = sheets.find(s => s.kind + '|' + s.sh === tabSel);
    if (!cur) cur = sheets.slice().sort((a, b) => cnt(b) - cnt(a))[0];
    const more = `<button type="button" class="btn sb-all">${all ? 'Chỉ hiện chỗ slide này lấy' : 'Hiện cả sheet / dòng khác của buổi (để chỉ định lại)'}</button>`;
    if (!cur) { box.innerHTML = head + `<p class="muted">Slide này không lấy ô nào từ S5 / S6 (tiêu đề, chuyển mục…).</p>${more}`; box.querySelector('.sb-all').onclick = () => { all = !all; tabSel = null; render(); }; return; }
    const ctrl = ctrlOf(cur.kind, cur.sh), keys = [...ctrl];
    cur.rows.forEach(r => Object.keys(r).forEach(k => { if (!keys.includes(k)) keys.push(k); }));
    const stepOpts = c.f.steps.filter(x => x.stt != null && !isNaN(x.stt)).map(x => `${x.stt} · ${x.name}`);
    const s6Opts = Object.keys(c.st.book.s6 || {}).filter(k => /^S6-/.test(k) && !/Thông tin|Khoá|Khóa|Nhật ký/.test(k));
    const optsOf = k => k === 'Bước S5' ? stepOpts : k === 'Nguồn S6' ? s6Opts : k === 'Lên PPT' ? ['Có', 'Không'] : null;
    const isStepRow = r => c.step && c.step.g5 && cur.kind === 's5' && c.step.g5.sheet === cur.sh && c.step.g5.r === r.__r;
    const same = (k, x, sv) => x === sv || (k === 'Bước S5' && /^\d/.test(sv) && bNum(x) === bNum(sv));
    const cellHtml = (r, k) => { const v = r[k], on = (c.hit.get(cur.kind + '|' + cur.sh + '|' + r.__r) || []).includes(k), o = optsOf(k), isNote = on && (c.nt.get(cur.kind + '|' + cur.sh + '|' + r.__r) || []).includes(k), cls = [ctrl.includes(k) ? 'ct' : '', on ? (isNote ? 'nt' : 'on') : ''].filter(Boolean).join(' ');
      if (o) { const sv = S(v), has = !sv || o.some(x => same(k, x, sv));
        return `<td class="${cls}"><select data-k="${esc(k)}" data-r="${r.__r}"><option value=""></option>${has ? '' : `<option selected>${esc(sv)}</option>`}${o.map(x => `<option${sv && same(k, x, sv) ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></td>`; }
      return `<td class="${cls}" data-k="${esc(k)}" data-r="${r.__r}" title="${esc(S(v))}">${esc(S(v).slice(0, 160))}</td>`; };
    const tabs = sheets.map(s => { const n = cnt(s); return `<button type="button" class="sb-tab${s === cur ? ' on' : ''}" data-t="${esc(s.kind + '|' + s.sh)}">${s.kind === 's5' ? 'S5 · ' : ''}${esc(short(s.sh))}${n ? ` <i>${n}</i>` : ''}</button>`; }).join('');
    box.innerHTML = head + `<div class="sb-tabs">${tabs}${more}</div>
      <div class="sb-help">Vàng = ô hiện trên slide này · xanh lá = ô chỉ vào ghi chú giảng (không chiếu) · xanh = dòng S5 của bước · số dòng gạch = chưa lên slide nào · cột tím = chỉ định nối dữ liệu (chọn trong danh sách) · bấm ô để sửa · bấm số dòng để xem dòng đó lên slide nào</div>
      ${info ? `<div class="sb-info">${info}</div>` : ''}
      <div class="sb-grid"><table><thead><tr><th class="rn">Dòng</th>${keys.map(k => `<th class="${ctrl.includes(k) ? 'ct' : ''}">${esc(k)}</th>`).join('')}</tr></thead><tbody>
      ${cur.rows.map(r => `<tr class="${c.hit.has(cur.kind + '|' + cur.sh + '|' + r.__r) ? 'hl' : ''}${isStepRow(r) ? ' step' : ''}"><th class="rn${c.usedRows.has(cur.kind + '|' + cur.sh + '|' + r.__r) ? '' : ' nu'}" data-r="${r.__r}" title="${c.usedRows.has(cur.kind + '|' + cur.sh + '|' + r.__r) ? 'Bấm: dòng này lên slide nào' : 'Dòng này chưa lên slide nào của buổi'}">${r.__r || ''}</th>${keys.map(k => cellHtml(r, k)).join('')}</tr>`).join('')}
      </tbody></table></div>`;
    box.querySelector('.sb-all').onclick = () => { all = !all; tabSel = null; info = null; render(); };
    box.querySelectorAll('.sb-tab').forEach(b => b.onclick = () => { tabSel = b.dataset.t; info = null; render(); });
    box.querySelectorAll('select[data-k]').forEach(s => s.onchange = () => { s.blur(); commit(cur.kind, cur.sh, +s.dataset.r, s.dataset.k, s.value); });
    box.querySelectorAll('th.rn[data-r]').forEach(th => th.onclick = () => { const row = +th.dataset.r, ns = slidesOfRow(c, cur.kind, cur.sh, row);
      tabSel = cur.kind + '|' + cur.sh; info = `Dòng ${row} (${esc(short(cur.sh))}) → ${ns.length ? ns.map(i => `<button type="button" class="btn sb-go" data-i="${i}">slide ${i + 1}</button>`).join(' ') : 'không lên slide nào'}`; render(); });
    box.querySelectorAll('.sb-go').forEach(b => b.onclick = () => I().select(+b.dataset.i));
    box.querySelectorAll('td[data-k]').forEach(td => td.onclick = () => { if (td.querySelector('textarea')) return; const row = cur.rows.find(x => x.__r === +td.dataset.r), k = td.dataset.k, v0 = S(row && row[k]);
      const ta = document.createElement('textarea'); ta.value = v0; ta.rows = Math.min(6, Math.max(1, Math.ceil(v0.length / 40))); td.textContent = ''; td.appendChild(ta); td.classList.add('ed'); ta.focus();
      let done = false; const fin = ok => { if (done) return; done = true; const v = ta.value; ta.blur(); tabSel = cur.kind + '|' + cur.sh; if (ok && v !== v0) commit(cur.kind, cur.sh, +td.dataset.r, k, v); else render(); };
      ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); fin(true); } else if (e.key === 'Escape') { e.preventDefault(); fin(false); } };
      ta.onblur = () => fin(true); });
    const first = box.querySelector('tr.hl, tr.step'), g = box.querySelector('.sb-grid'); if (first && g) g.scrollTop = Math.max(0, first.offsetTop - 40);
  }

  const css = document.createElement('style'); css.textContent = `#srcBox{margin-top:10px;border:1px solid var(--ui-line,#ddd);border-radius:6px;padding:8px 14px;background:var(--ui-panel,#fff)}#srcBox summary{cursor:pointer}#srcBox summary b{font-weight:600}
  .sb-how{font-size:11.5px;border-radius:4px;padding:1px 6px;margin-left:4px}.sb-how.ok{background:#E3F4E6;color:#1B5E20}.sb-how.warn{background:#FFE9C7;color:#8A4B00}
  .sb-tabs{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px}.sb-tab{border:1px solid var(--ui-line,#ddd);background:var(--ui-bg,#f6f6f6);border-radius:5px 5px 0 0;padding:3px 9px;font-size:12px;cursor:pointer}
  .sb-all{margin-left:auto;padding:2px 10px;font-size:12px}.sb-tab.on{background:#fff;border-bottom-color:#fff;font-weight:600}.sb-tab i{font-style:normal;background:#FFE58A;border-radius:8px;padding:0 5px;font-size:11px}
  .sb-help{font-size:11.5px;color:#888;margin:4px 0}.sb-info{font-size:12.5px;margin:4px 0}.sb-go{padding:1px 8px;font-size:12px}
  .sb-grid{max-height:300px;overflow:auto;border:1px solid var(--ui-line,#ddd)}.sb-grid table{border-collapse:collapse;font-size:12px}
  .sb-grid th,.sb-grid td{border:1px solid #e4e4e4;padding:2px 6px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;vertical-align:middle;line-height:18px}
  .sb-grid thead th{position:sticky;top:0;background:#F3F3F3;z-index:3;font-weight:600}.sb-grid th.rn{background:#F3F3F3;color:#666;cursor:pointer;position:sticky;left:0;z-index:2;text-align:right}
  .sb-grid th.rn.nu{color:#bbb;text-decoration:line-through}.sb-grid td{cursor:text}.sb-grid tr.hl td{background:#FFFBEA}.sb-grid td.on{background:#FFE58A!important}.sb-grid td.nt{background:#E4F3E6!important;color:#3D5A43}.sb-grid tr.step td,.sb-grid tr.step th.rn{background:#DDEBFF}
  .sb-grid thead th.ct{background:#E9E0FF}.sb-grid td.ct{background:#F5F1FF}.sb-grid select{min-height:0;box-shadow:none;width:auto;font-size:12px;max-width:180px;height:20px;padding:0 2px;margin:0;border:0;background:transparent;line-height:18px}.sb-grid td.ct,.sb-grid th.ct{min-width:64px}.sb-grid td:has(select){padding:0 4px}
  .sb-grid td.ed{max-width:none;overflow:visible;padding:0}.sb-grid td.ed textarea{min-width:260px;font:inherit;padding:3px 5px}`;
  document.head.appendChild(css);
  let tm; const mo = new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(render, 60); });
  function init() { const c = $('#canvas'); if (c) mo.observe(c, { childList: true }); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  root.PLS_DATASRC = { render, applyEdits, commit };
})(window);

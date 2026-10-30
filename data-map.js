// SƠ ĐỒ DỮ LIỆU (người dùng 29/10: "hình thái hoá cách lấy / nối dữ liệu cho trực quan, hạn chế sai")
// Mỗi buổi: hoạt động trong timeline S5 → sheet S6 đã đọc (số dòng của buổi) → slide dựng ra. Đỏ = hoạt động không ra slide;
// cuối bảng: sheet S6 có dòng của buổi mà KHÔNG hoạt động nào dùng (nội dung bị sót). Tải Excel để QC đối chiếu.
(function (root) {
  const P = root.PLS, I = () => P && P._int; const $ = q => document.querySelector(q);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const short = k => String(k).replace(/^S6-/, '');
  function rows() {
    const st = (I() || {}).state || {}, f = st.flow; if (!f) return null;
    const sl = st.slides || [], num = (a, b) => { const ns = sl.map((r, i) => r.src >= a && r.src < b ? i + 1 : 0).filter(Boolean); return ns.length ? (ns.length > 1 ? `${ns[0]}–${ns[ns.length - 1]}` : String(ns[0])) + ` (${ns.length})` : ''; };
    return { f, steps: f.steps.map(x => Object.assign({}, x, { slides: num(x.from, x.to) })), unused: f.sheets.filter(x => !x.used && x.ppt) };
  }
  function show() {
    const R = rows(); if (!R) { alert('Chưa nhập Excel S5 + S6.'); return; }
    let ov = $('#dmap'); if (ov) ov.remove(); ov = document.createElement('div'); ov.id = 'dmap'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Sơ đồ dữ liệu');
    ov.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(20,20,30,.45);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:32px 16px';
    const ok = R.steps.filter(x => x.slides).length, bad = R.steps.length - ok;
    const row = x => { const red = !x.slides, sh = x.sheets.length ? x.sheets.map(s => s.rows == null ? `<span class="dm-chip dm-s5">${esc(s.sheet)}</span>` : `<span class="dm-chip">${esc(short(s.sheet))} · ${s.rows} dòng</span>`).join('') : (x.slides ? '<span class="dm-none dm-soft">chỉ dùng tên hoạt động S5 (không có dữ liệu S6)</span>' : '<span class="dm-none">không đọc sheet S6 nào</span>');
      return `<div class="dm-row${red ? ' dm-red' : ''}"><div class="dm-c1"><b>${esc(x.name)}</b>${x.min != null ? `<small>${x.min} phút</small>` : ''}${x.src ? `<small>Nguồn S6: ${esc(x.src)}</small>` : ''}</div><div class="dm-ar">→</div><div class="dm-c2">${sh}</div><div class="dm-ar">→</div><div class="dm-c3">${x.slides ? 'Slide ' + esc(x.slides) : '<b>không ra slide</b>'}</div></div>`; };
    ov.innerHTML = `<div class="dm-box"><div class="dm-head"><h2>Sơ đồ dữ liệu · Buổi ${esc(R.f.buoi)}</h2><span class="dm-sum">${ok} hoạt động ra slide${bad ? ` · <b class="dm-r">${bad} không ra slide</b>` : ''}${R.unused.length ? ` · <b class="dm-r">${R.unused.length} sheet S6 bị sót</b>` : ''}</span>
      <button type="button" class="btn" id="dmXlsx">Tải Excel</button><button type="button" class="btn" id="dmClose" aria-label="Đóng">Đóng</button></div>
      <div class="dm-legend"><span>Timeline S5 (thứ tự hoạt động)</span><span>Sheet S6 đã đọc · số dòng của buổi (Lên PPT)</span><span>Slide dựng ra</span></div>
      ${R.steps.map(row).join('')}
      <h3>Dữ liệu S6 của buổi chưa lên slide</h3>
      ${R.unused.length ? R.unused.map(x => `<div class="dm-row dm-red"><div class="dm-c1"><b>${esc(x.sheet)}</b></div><div class="dm-ar"></div><div class="dm-c2">${x.ppt} dòng của buổi ${esc(R.f.buoi)} không có hoạt động nào trong timeline S5 lấy</div><div class="dm-ar"></div><div class="dm-c3">Thêm hoạt động vào S5 hoặc ghi cột "Nguồn S6"</div></div>`).join('') : '<p class="dm-okp">Không sót – mọi sheet S6 có dữ liệu của buổi đều đã được dùng.</p>'}
      <p class="dm-note">Cách nối: lấy dòng có cột <b>Buổi</b> = buổi đang mở và <b>Lên PPT</b> ≠ Không · tên hoạt động S5 quyết định sheet (từ vựng → Từ vựng, nghe → Nghe…) · muốn chỉ định thẳng: thêm cột <b>"Nguồn S6"</b> vào sheet "Hướng dẫn giảng dạy" của S5 (vd <i>S6-Nghe</i>).</p></div>`;
    document.body.appendChild(ov);
    const close = () => ov.remove(); ov.onclick = e => { if (e.target === ov) close(); }; $('#dmClose').onclick = close; document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
    $('#dmXlsx').onclick = () => { const X = root.XLSX; if (!X) return alert('Chưa tải được thư viện Excel.');
      const a = R.steps.map((x, i) => ({ 'STT': i + 1, 'Hoạt động S5': x.name, 'Phút': x.min, 'Nguồn S6 (ghi tay)': x.src, 'Sheet S6 đã đọc': x.sheets.map(s => s.rows == null ? s.sheet : `${s.sheet} (${s.rows})`).join('; '), 'Slide': x.slides || 'KHÔNG RA SLIDE' }));
      const b = R.f.sheets.map(x => ({ 'Sheet S6': x.sheet, 'Dòng của buổi': x.rows, 'Lên PPT': x.ppt, 'Đã dùng': x.used ? 'Có' : 'CHƯA' }));
      const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.json_to_sheet(a), 'S5 → S6 → Slide'); X.utils.book_append_sheet(wb, X.utils.json_to_sheet(b), 'Sheet S6 của buổi');
      X.writeFile(wb, `So-do-du-lieu_Buoi-${R.f.buoi}.xlsx`); };
  }
  const css = document.createElement('style'); css.textContent = `.dm-box{background:var(--bg,#fff);color:var(--ink,#222);border-radius:14px;max-width:1180px;width:100%;padding:20px 24px;box-shadow:0 10px 40px rgba(0,0,0,.25);font-size:14px}
  .dm-head{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.dm-head h2{margin:0;font-size:20px;flex:0 0 auto}.dm-sum{flex:1 1 auto;color:#555}.dm-r{color:#C62828}
  .dm-legend,.dm-row{display:grid;grid-template-columns:minmax(180px,1.1fr) 24px 2fr 24px minmax(120px,.8fr);gap:8px;align-items:center}
  .dm-legend{font-size:12px;color:#777;padding:4px 10px;border-bottom:1px solid #eee}.dm-legend span:nth-child(2){grid-column:3}.dm-legend span:nth-child(3){grid-column:5}
  .dm-row{padding:8px 10px;border-bottom:1px solid #f0f0f0}.dm-row small{display:block;color:#888;font-size:12px}.dm-ar{color:#bbb;text-align:center}
  .dm-chip{display:inline-block;background:#FFF3E0;color:#B23A12;border-radius:999px;padding:2px 10px;margin:2px 4px 2px 0;font-size:12.5px}
  .dm-none{color:#C62828;font-size:12.5px}.dm-soft{color:#999}.dm-s5{background:#E8F0FE;color:#1A4FA0}.dm-red{background:#FDECEA}.dm-c3{font-weight:600}.dm-red .dm-c3{color:#C62828}
  .dm-box h3{margin:16px 0 6px;font-size:15px}.dm-okp{color:#2E7D32;margin:4px 10px}.dm-note{color:#666;font-size:12.5px;margin-top:14px;line-height:1.5}
  @media (max-width:760px){.dm-legend{display:none}.dm-row{grid-template-columns:1fr}.dm-ar{display:none}}`;
  document.head.appendChild(css);
  function init() { const ref = $('#btnQcXlsx'); if (!ref || $('#btnMap')) return; const b = document.createElement('button'); b.id = 'btnMap'; b.type = 'button'; b.className = 'btn'; b.textContent = 'Sơ đồ dữ liệu';
    b.title = 'Xem hoạt động S5 nào lấy dữ liệu từ sheet S6 nào, ra slide nào – và dữ liệu S6 bị sót'; b.onclick = show; ref.parentNode.insertBefore(b, ref); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  root.PLS_DATAMAP = { show, rows };
})(window);

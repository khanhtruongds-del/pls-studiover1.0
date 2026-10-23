// Giao diện PLS Studio (bản sơ lược): danh sách slide · canvas · soát lỗi / phương án / dữ liệu.
// window.PLS là cổng lệnh cho Claude (qua Claude in Chrome) – giữ tên gần với fit_js.
(function () {
  'use strict';
  const E = window.PLS_ENGINE;
  const $ = s => document.querySelector(s);
  const state = { tr: { style: 'NONE', duration: 0.5, scope: 'all' }, fx: { on: true, pace: 'vừa', hideAnswer: true }, fxStep: null, fxp: {}, notesOv: {}, fontMode: 'safe', hier: true, device: 'win', spec: null, brand: 'Betreux', slides: [], sel: 0, overrides: {}, imgOv: {}, choice: {}, building: false };
  const BRANDS = ['Betreux', 'Creative English', 'Créatis', 'Saechang', 'Sakumi', 'Đắc Nhân'];

  // ---------- dựng cả bài ----------
  // MÀN HÌNH CHƯA CÓ BÀI (người dùng chốt 23/10: bỏ bài mẫu Betreux lúc mở trang) – lời chào + 3 bước + việc app làm giúp
  function showEmpty() {
    document.body.classList.add('empty'); state.slides = [];
    const w = $('#welcome'); if (!w || w.dataset.done) return; w.dataset.done = '1';
    const svg = { c1: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><rect x="22" y="18" width="70" height="88" rx="3"/><path d="M34 40h46M34 52h46M34 64h30M34 76h38"/><path d="M70 86l10 10 22-26" stroke-width="3"/></svg>',
      c2: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><circle cx="64" cy="64" r="44"/><ellipse cx="64" cy="64" rx="18" ry="44"/><path d="M20 64h88M28 42h72M28 86h72"/></svg>',
      c3: '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><rect x="16" y="30" width="62" height="44" rx="2"/><rect x="44" y="52" width="62" height="44" rx="2" fill="currentColor" fill-opacity=".15"/><path d="M58 70h34M58 80h22"/></svg>' };
    const h = new Date().getHours(), hi = h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    w.innerHTML = `<section class="w-hero"><div><p class="hi">${hi}</p><h1>Dựng slide và sách của một buổi học trong vài phút</h1>
        <div class="acts"><button type="button" class="btn primary" id="wImport">Nhập Excel S5 + S6</button><span class="muted">Chọn cùng lúc 2 file .xlsx</span></div></div>
      <div class="w-cards"><div class="w-card c1"><span class="n">01</span><b>Nhập<br>Excel</b><p>File S6 (nội dung) và S5 (khung buổi, dặn dò)</p>${svg.c1}</div>
        <div class="w-card c2"><span class="n">02</span><b>Chọn buổi<br>& brand</b><p>Máy tự chọn mẫu, co chữ, soát 29 luật chuẩn</p>${svg.c2}</div>
        <div class="w-card c3"><span class="n">03</span><b>Xuất PPTX<br>+ PDF</b><p>Một lần bấm: slide có hiệu ứng, ghi chú giảng và sách in</p>${svg.c3}</div></div></section>
      <div class="w-low"><section><p class="muted" style="margin:0 0 2px;font-size:12px">Quy trình</p><h2>Từ Excel tới lớp học</h2><p class="sub">Mọi bước dưới đây chạy tự động sau khi nhập Excel – bạn chỉ xem và sửa chỗ cần.</p>
        <ol class="w-steps">
          <li><span class="ic">⇪</span><b>Đọc giáo trình</b><span>Lấy từ vựng, ngữ pháp, phát âm, mẫu câu, bài nghe – đọc, BTVN của buổi</span></li>
          <li><span class="ic">▦</span><b>Chọn mẫu slide</b><span>Thử nhiều phương án, giữ phương án ít lỗi, chữ to và đủ nội dung</span></li>
          <li><span class="ic">✓</span><b>Soát lỗi chuẩn v2.0</b><span>Tràn chữ, thiếu ảnh, sai font, tên file – báo đỏ / vàng để sửa</span></li>
          <li class="dark"><span class="ic">▶</span><b>Hiệu ứng & ghi chú</b><span>Bộ hiệu ứng nhanh (khoanh đáp án, nối dây) và ghi chú giảng dưới slide</span></li>
          <li class="dark"><span class="ic">▤</span><b>Sách A4 / 19×27</b><span>Dàn trang, đáp án theo bài kèm giải thích, xuất PDF</span></li>
        </ol></section>
        <section class="w-side"><p class="muted" style="margin:0 0 2px;font-size:12px">Cần chuẩn bị</p><h2>Trước khi nhập</h2><p class="sub">Để máy dựng đúng ngay lần đầu.</p>
          <div class="item"><b>File S6 có các tab "S6-…"</b><span class="muted">Cột "Lên PPT" / "Lên PDF" = Không sẽ được bỏ qua</span><span class="tag" style="--c:var(--ui-accent)">Bắt buộc</span></div>
          <div class="item"><b>File S5 có timeline buổi</b><span class="muted">"1. Mở đầu: 5p…" để xếp thứ tự slide và số phút</span><span class="tag" style="--c:var(--ui-yellow)">Nên có</span></div>
          <div class="item"><b>Cột "Giải thích" của câu hỏi</b><span class="muted">Đi vào đáp án sách và ghi chú giảng</span><span class="tag" style="--c:#2f8a55">Tốt hơn</span></div></section></div>`;
    $('#wImport').onclick = () => $('#xlsx').click();
  }
  async function build() {
    if (!state.spec) { showEmpty(); return; }
    document.body.classList.remove('empty');
    if (state.building) return; state.building = true; setStatus('Đang dựng…'); drawDeviceSel();
    const t0 = performance.now();
    const stage = $('#stage'); stage.innerHTML = ''; state.deck = { count: {} };
    const out = [];
    const spec = state.spec;
    for (let i = 0; i < spec.slides.length; i++) {
      const s = spec.slides[i];
      if (s.auto) {
        const plans = E.expand(s, spec.common);
        const scored = [];
        for (let pi = 0; pi < plans.length; pi++) {
          const trial = { count: Object.assign({}, state.deck.count) };   // dựng thử: bộ đếm ảnh riêng
          const rs = plans[pi].slides.map((ps, k) => renderOne(ps, stage, i, k, trial));
          const iss = rs.flatMap(r => r.issues);
          const P = plans[pi];   // điểm = soát lỗi TB − số slide − ô trống (fill) − nội dung bị bỏ (cover)
          const sc = Math.round(rs.reduce((a, r) => a + r.score, 0) / rs.length - (rs.length - 1) * 3 - (1 - P.fill) * (P.fillW || 15) - (1 - (P.cover == null ? 1 : P.cover)) * 40);
          scored.push({ label: plans[pi].label, score: sc, rs });
        }
        scored.sort((a, b) => b.score - a.score || a.rs.length - b.rs.length);   // bằng điểm → ít slide hơn
        const pick = state.choice[i] != null ? scored.find(x => x.label === state.choice[i]) || scored[0] : scored[0];
        scored.forEach(p => { if (p !== pick) p.rs.forEach(r => r.host.remove()); });
        pick.rs.forEach(r => (r.images || []).forEach(im => { if (im.id) state.deck.count[im.id] = (state.deck.count[im.id] || 0) + 1; }));
        pick.rs.forEach((r, k) => out.push(Object.assign(r, { src: i, part: k, plans: scored.map(p => ({ label: p.label, score: p.score, active: p === pick })) })));
      } else out.push(Object.assign(renderOne(s, stage, i, 0), { src: i, part: 0 }));
    }
    state.slides = out;
    // kiểm chuẩn v2.0 cả bài (29 luật) – lỗi theo slide gộp vào danh sách lỗi của slide
    if (window.PLS_STD) {
      state.std = window.PLS_STD.check(out, stdCtx());
      const engineCodes = /^(spill|overlap|noSlot|vietFont|minFont|smallFont|safeArea|words|noImage)$/;
      for (const rule of state.std) for (const it of rule.list || []) {
        const r = out[it.slide - 1]; if (!r || (r.issues || []).some(x => x.msg === it.msg)) continue;
        if (rule.id === 'RB-CH-04' || rule.id === 'RB-CH-06' || rule.id === 'RB-PPT-02' || rule.id === 'RB-PPT-03') continue;   // đã có từ engine
        r.issues.push({ lv: rule.level === 'xam' ? 'vang' : rule.level, code: 'std', rule: rule.id, msg: `${rule.id}: ${it.msg}`, src: 'Chuẩn v2.0' });
      }
    }
    if (state.sel >= out.length) state.sel = 0;
    drawList(); drawMain(); drawPanel();
    const ms = Math.round(performance.now() - t0);
    setStatus(`Đã dựng ${out.length} slide trong ${ms} ms`);
    state.building = false;
    return { slides: out.length, ms, issues: out.reduce((a, r) => a + r.issues.length, 0) };
  }
  function renderOne(s, stage, srcIdx, part, trialDeck) {
    const ov = Object.assign({}, state.overrides[srcIdx] || {}, state.overrides[srcIdx + '/' + (part || 0) + '/' + s.comp] || {});   // sửa tay trên slide tự chọn mẫu: theo phần + mẫu
    const spec = Object.assign({}, s, { common: state.spec.common, data: Object.assign({}, s.data, ov, state.imgOv[srcIdx + '/' + (part || 0)] || {}) });
    const r = E.render(spec, state.brand);
    stage.appendChild(r.host);
    // mặc định xem bằng ĐÚNG font sẽ có trong file (font có sẵn trên máy) → thấy gì xuất nấy, không phụ thuộc font tải từ mạng
    if (state.fontMode === 'safe') { const dv = curDevice(); E.applyExportFonts(r.host, state.brand, dv.font ? dv : null); }
    // phương án dựng thử dùng bản sao bộ đếm ảnh; chỉ phương án được chọn mới ghi vào bộ đếm cả bài
    const deck = trialDeck || state.deck;
    r.images = window.PLS_IMAGES ? window.PLS_IMAGES.fill(r.host, state.brand, spec.data, deck) : []; r.deckLocal = deck;
    if (state.hier) E.hierarchy(r);
    r.typo = E.typoLayout(r);
    r.fitLog = E.fitText(r);
    r.typo = r.typo.concat(E.typoSpread(r));
    r.issues = E.audit(r);
    r.score = E.score(r.issues, r.fitLog);
    E.planFx(r, state.fx);   // hiệu ứng theo vai trò lớp (FX của fit_js, chuẩn v2.0: chỉ Appear)
    r.spec = spec;
    const pk = srcIdx + '/' + (part || 0);   // bộ hiệu ứng nhanh người dùng chọn cho slide này (fx-presets.js) → ghi đè cách tự gắn
    if (state.fxp[pk] && window.PLS_FXP) window.PLS_FXP.apply(r, state.fxp[pk]);
    return r;
  }

  // ---------- vẽ giao diện ----------
  function scaled(host, width) {
    const k = width / parseFloat(host.style.width);
    const wrap = document.createElement('div'); wrap.className = 'scaled';
    wrap.style.width = width + 'px'; wrap.style.height = parseFloat(host.style.height) * k + 'px';
    const c = host.cloneNode(true); c.style.transform = `scale(${k})`; c.style.transformOrigin = '0 0';
    wrap.appendChild(c); return { wrap, clone: c };
  }
  function lvOf(r) { return r.issues.some(i => i.lv === 'do') ? 'do' : r.issues.some(i => i.lv === 'vang') ? 'vang' : 'ok'; }
  function drawList() {
    const ul = $('#slides'); ul.innerHTML = '';
    $('#slideCount').textContent = state.slides.length + ' slide';
    const need = state.slides.filter(r => lvOf(r) !== 'ok').length;
    $('#needCount').textContent = need ? need + ' cần xem' : 'đều đạt';
    state.slides.forEach((r, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button'); b.className = 'thumb' + (i === state.sel ? ' sel' : ''); b.type = 'button';
      b.setAttribute('aria-label', `Slide ${i + 1}: ${r.host.dataset.comp}`);
      const { wrap } = scaled(r.host, 168);
      const cap = document.createElement('span'); cap.className = 'cap';
      cap.innerHTML = `<i class="dot ${lvOf(r)}"></i><b>${i + 1}</b> ${r.host.dataset.comp.replace(/^Slide\//, '')}`;
      b.append(wrap, cap); b.onclick = () => { state.sel = i; state.fxStep = null; drawList(); drawMain(); drawPanel(); };
      li.appendChild(b); ul.appendChild(li);
    });
  }
  function drawMain() {
    const r = state.slides[state.sel]; const box = $('#canvas'); box.innerHTML = '';
    drawNotes(r); if (!r) return;
    $('#selTitle').textContent = `Slide ${state.sel + 1} · ${r.host.dataset.comp.replace(/^Slide\//, '')}`;
    $('#selMeta').textContent = `Điểm ${r.score}/100 · ${r.fitLog.length ? r.fitLog.length + ' ô đã co chữ' : 'không phải co chữ'}` + (r.plans ? ` · ${r.plans.find(p => p.active).label}` : '');
    const w = Math.min(box.clientWidth - 32, 1100);
    const { wrap, clone } = scaled(r.host, Math.max(320, w));
    box.appendChild(wrap);
    // sửa trực tiếp: ghi đè theo slide nguồn
    clone.querySelectorAll('[data-filled]').forEach(el => {
      const target = el.querySelector('[data-t]') || el;
      target.contentEditable = 'true'; target.spellcheck = false;
      target.addEventListener('blur', () => {
        const slot = el.dataset.filled; const v = target.textContent;
        if (v === r.spec.data[slot]) return;
        setSlot(r, slot, v); build();
      });
    });
    // bấm vào ô ảnh trên slide → mở tab Ảnh, nhảy tới đúng ô đó
    clone.querySelectorAll('[data-img-key]').forEach(el => {
      el.classList.add('pls-imgpick'); el.title = 'Bấm để chọn ảnh'; el.setAttribute('role', 'button'); el.tabIndex = 0;
      const go = ev => { ev.stopPropagation(); openImageTab(el.dataset.imgKey); };
      el.addEventListener('click', go); el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(ev); } });
    });
    // xem thử hiệu ứng: ẩn các khối có thứ tự lần bấm > bước đang xem
    if (state.fxStep != null) {
      const clickOf = {}; let c = 0; (r.fx || []).forEach(a => { if (a.when === 'click') c++; clickOf[a.order] = c; });
      clone.querySelectorAll('[data-fx-order]').forEach(el => { if (clickOf[el.dataset.fxOrder] > state.fxStep) el.style.visibility = 'hidden'; });
    }
    // tô ô có lỗi
    r.issues.filter(i => i.slot).forEach(i => { const el = clone.querySelector(`[data-filled="${CSS.escape(i.slot)}"]`); if (el) el.classList.add(i.lv === 'do' ? 'bad' : 'warn'); });
  }
  function openImageTab(key) {
    document.querySelectorAll('[role=tab]').forEach(x => x.setAttribute('aria-selected', x.dataset.tab === 'images'));
    state.focusImg = key; drawPanel();
    const box = document.querySelector(`#panel [data-key="${CSS.escape(key)}"]`);
    if (box) { box.scrollIntoView({ block: 'center', behavior: 'smooth' }); box.classList.add('focus'); const q = box.querySelector('input[type=search]'); if (q) q.focus({ preventScroll: true }); }
  }
  // ghi 1 ô của slide đang hiện (r): slide tự chia (từ vựng) ghi vào danh sách mục nguồn, slide thường ghi đè theo slide nguồn
  function setSlot(r, slot, v) {
    if (r.plans) { const src = state.spec.slides[r.src]; const m = slot.match(/^vocab_(\d+)\.(de|vi)$/); if (m) { const before = state.slides.filter(x => x.src === r.src && x.part < r.part).reduce((a, x) => a + Object.keys(x.spec.data).filter(k => /^vocab_\d+\.de$/.test(k)).length, 0); src.items[before + (+m[1]) - 1][m[2]] = v; return; } }
    const k = r.plans ? r.src + '/' + r.part + '/' + r.spec.comp : r.src;
    (state.overrides[k] = state.overrides[k] || {})[slot] = v;
  }
  function drawPanel() {
    const tab = document.querySelector('[role=tab][aria-selected=true]').dataset.tab;
    const p = $('#panel'); p.innerHTML = '';
    const all = state.slides.flatMap((r, i) => r.issues.map(x => Object.assign({ i }, x)));
    const cnt = lv => all.filter(x => x.lv === lv).length;
    $('#tabIssues').textContent = `Soát lỗi · ${cnt('do') + cnt('vang')}`;
    if (tab === 'issues') {
      if (state.std) {
        const fail = lv => state.std.filter(x => x.status === 'loi' && x.level === lv).length;
        const sum = document.createElement('details'); sum.className = 'std'; sum.open = !!state.stdOpen; sum.ontoggle = () => { state.stdOpen = sum.open; };
        const ok = state.std.filter(x => x.status === 'dat').length, tay = state.std.filter(x => x.status === 'tay').length, na = state.std.filter(x => x.status === 'khongap').length;
        sum.innerHTML = `<summary><b>Chuẩn v2.0 · 29 luật</b> <span class="pill do">${fail('do')} đỏ</span> <span class="pill vang">${fail('vang')} vàng</span> <span class="pill">${fail('xam')} xám</span><br><span class="muted">${ok} đạt · ${tay} người kiểm · ${na} chỉ áp dụng cho PDF</span></summary>`;
        const ST = { dat: '✓', loi: '✗', tay: '👁', khongap: '–' };
        state.std.filter(x => x.status !== 'khongap').sort((a, b) => (a.status === 'loi' ? 0 : a.status === 'tay' ? 1 : 2) - (b.status === 'loi' ? 0 : b.status === 'tay' ? 1 : 2)).forEach(x => {
          const d = document.createElement('div'); d.className = 'stdrow ' + x.status + ' ' + x.level;
          d.innerHTML = `<span class="st" aria-label="${x.status}">${x.status === 'loi' ? '✗' : x.status === 'dat' ? '✓' : '?'}</span><div><b>${x.id}</b> ${escapeHtml(x.title)} <span class="pill ${x.level}">${{ do: 'bắt buộc', vang: 'nên đạt', xam: 'tham khảo' }[x.level]}</span><div class="muted">${escapeHtml(x.status === 'loi' ? x.list.slice(0, 3).map(i => (i.slide ? 'Slide ' + i.slide + ': ' : '') + i.msg).join(' · ') + (x.list.length > 3 ? ` · +${x.list.length - 3}` : '') : x.note || '')}</div></div>`;
          sum.appendChild(d);
        });
        p.appendChild(sum);
      }
      p.insertAdjacentHTML('beforeend', `<div class="tiles"><div class="tile do"><b>${cnt('do')}</b>phải sửa</div><div class="tile vang"><b>${cnt('vang')}</b>cần xem</div><div class="tile ok"><b>${state.slides.filter(r => lvOf(r) === 'ok').length}</b>slide đạt</div></div>`);
      (state.exportWarns || []).forEach(w => p.insertAdjacentHTML('beforeend', `<div class="issue"><div class="row"><span class="pill do">Bản xuất</span></div><span>${escapeHtml(w)}</span></div>`));
      (state.importWarns || []).forEach(w => p.insertAdjacentHTML('beforeend', `<div class="issue"><div class="row"><span class="pill vang">Nhập Excel</span></div><span>${escapeHtml(w)}</span></div>`));
      if (!all.length) p.insertAdjacentHTML('beforeend', '<p class="muted">Không có lỗi theo chuẩn v2.0.</p>');
      all.sort((a, b) => (a.lv === 'do' ? 0 : 1) - (b.lv === 'do' ? 0 : 1)).forEach(x => {
        const d = document.createElement('div'); d.className = 'issue';
        d.innerHTML = `<div class="row"><span class="pill ${x.lv}">${x.lv === 'do' ? 'Phải sửa' : 'Cần xem'}</span><span class="muted">Nguồn: ${x.src}</span></div><b>Slide ${x.i + 1}</b><span>${escapeHtml(x.msg)}</span>`;
        const go = document.createElement('button'); go.type = 'button'; go.textContent = 'Đi tới slide'; go.onclick = () => { state.sel = x.i; drawList(); drawMain(); };
        d.appendChild(go); p.appendChild(d);
      });
    } else if (tab === 'plans') {
      const r = state.slides[state.sel];
      if (!r || !r.plans) { p.innerHTML = '<p class="muted">Slide này dựng thẳng từ một mẫu. Slide từ vựng, ngữ pháp và bài tập có nhiều phương án máy đã dựng thử – chọn các slide đó để so.</p>'; return; }
      p.insertAdjacentHTML('beforeend', `<p class="muted">Máy dựng thử từng phương án, đo thật rồi chấm điểm (tràn, chồng lấn, chữ nhỏ, số slide).</p>`);
      r.plans.forEach(pl => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'plan' + (pl.active ? ' active' : '');
        b.innerHTML = `<span>${pl.label}</span><span class="bar"><i style="width:${pl.score}%"></i></span><b>${pl.score}</b>`;
        b.onclick = () => { state.choice[r.src] = pl.label; build(); };
        p.appendChild(b);
      });
    } else if (tab === 'fx') {
      const r = state.slides[state.sel]; const fx = (r && r.fx) || []; const steps = E.fxSteps(fx);
      p.innerHTML = `<p class="muted">Theo chuẩn v2.0 (RB-PPT-08): chỉ hiệu ứng <b>Appear</b>, chỉ cho nội dung cần ẩn – câu hỏi, lựa chọn, mục (từ, ví dụ, dòng), đáp án. Tiêu đề, hướng dẫn, hình, khối hiện sẵn. Không chuyển cảnh.</p>`;
      // BỘ HIỆU ỨNG NHANH: máy nhận diện dạng slide → vài bộ dựng sẵn, bấm 1 lần là gắn (chỉ Appear)
      if (r && window.PLS_FXP) {
        const dt = window.PLS_FXP.detect(r), pk = r.src + '/' + r.part, cur = state.fxp[pk] || 'auto';
        const bx = document.createElement('div'); bx.className = 'issue fxquick';
        bx.innerHTML = `<b>Bộ hiệu ứng nhanh</b><span class="muted">${dt.type ? 'Máy nhận diện: <b>' + dt.label + '</b>' : 'Slide này không có bộ riêng'} · chỉ Appear, bấm 1 lần là gắn</span>`;
        const set = (ids, id) => { ids.forEach(k => { if (id === 'auto') delete state.fxp[k]; else state.fxp[k] = id; }); state.fxStep = null; build(); };
        dt.presets.forEach(pr => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (pr.id === cur ? ' primary' : ''); b.textContent = pr.label; b.title = pr.desc; b.setAttribute('aria-pressed', pr.id === cur);
          b.onclick = () => set([pk], pr.id); bx.appendChild(b); });
        if (dt.type && cur !== 'auto') { const same = state.slides.filter(x => window.PLS_FXP.detect(x).type === dt.type).map(x => x.src + '/' + x.part);
          const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = `Áp bộ này cho mọi slide ${dt.label.toLowerCase()} (${same.length})`; b.onclick = () => set(same, cur); bx.appendChild(b); }
        const pd = dt.presets.find(x => x.id === cur); if (pd) bx.insertAdjacentHTML('beforeend', `<span class="muted">Đang dùng: ${pd.label} – ${pd.desc}</span>`);
        p.appendChild(bx);
      }
      const row = (label, el) => { const d = document.createElement('label'); d.className = 'fxrow'; d.append(el, document.createTextNode(' ' + label)); p.appendChild(d); return el; };
      const on = row('Tự gắn hiệu ứng cho cả bài', Object.assign(document.createElement('input'), { type: 'checkbox', checked: state.fx.on }));
      on.onchange = () => { state.fx.on = on.checked; state.fxStep = null; build(); };
      const ha = row('Ẩn đáp án (bấm mới hiện)', Object.assign(document.createElement('input'), { type: 'checkbox', checked: state.fx.hideAnswer }));
      ha.onchange = () => { state.fx.hideAnswer = ha.checked; build(); };
      const pace = document.createElement('select'); pace.id = 'fxPace'; ['nhanh', 'vừa', 'chậm'].forEach(v => pace.add(new Option('Nhịp ' + v + (v === 'nhanh' ? ' (≤ 3 lần bấm / nhóm)' : v === 'vừa' ? ' (≤ 6)' : ' (≤ 8)'), v))); pace.value = state.fx.pace;
      pace.onchange = () => { state.fx.pace = pace.value; build(); }; p.appendChild(pace);
      // chuyển cảnh slide
      const trBox = document.createElement('div'); trBox.className = 'issue';
      trBox.innerHTML = `<b>Chuyển cảnh slide</b><span class="muted">Chuẩn v2.0 (RB-PPT-08) yêu cầu <b>không chuyển cảnh</b>. Bật lên sẽ bị báo vàng ở Soát lỗi.</span>`;
      const trSel = document.createElement('select'); trSel.id = 'trStyle'; trSel.setAttribute('aria-label', 'Kiểu chuyển cảnh');
      [['NONE', 'Không chuyển cảnh (đúng chuẩn)'], ['DISSOLVE', 'Mờ dần'], ['PUSH_FROM_RIGHT', 'Đẩy sang trái'], ['SLIDE_FROM_RIGHT', 'Trượt vào từ phải']].forEach(([v, t]) => trSel.add(new Option(t, v)));
      trSel.value = state.tr.style;
      const scSel = document.createElement('select'); scSel.id = 'trScope'; scSel.setAttribute('aria-label', 'Áp dụng cho');
      [['all', 'Mọi slide'], ['section', 'Chỉ bìa, chuyển mục, kết thúc']].forEach(([v, t]) => scSel.add(new Option(t, v))); scSel.value = state.tr.scope; scSel.disabled = state.tr.style === 'NONE';
      const durSel = document.createElement('select'); durSel.id = 'trDur'; durSel.setAttribute('aria-label', 'Thời lượng');
      [[0.3, 'Nhanh (0,3 giây)'], [0.5, 'Vừa (0,5 giây)'], [0.8, 'Chậm (0,8 giây)']].forEach(([v, t]) => durSel.add(new Option(t, v))); durSel.value = state.tr.duration; durSel.disabled = state.tr.style === 'NONE';
      trSel.onchange = () => { state.tr.style = trSel.value; build(); }; scSel.onchange = () => { state.tr.scope = scSel.value; build(); }; durSel.onchange = () => { state.tr.duration = +durSel.value; };
      trBox.append(trSel, scSel, durSel); p.appendChild(trBox);
      const total = state.slides.reduce((a, s) => a + ((s.fx || []).length ? 1 : 0), 0);
      p.insertAdjacentHTML('beforeend', `<p class="muted">${total}/${state.slides.length} slide có hiệu ứng. Slide này: ${fx.length} khối, ${steps} lần bấm.</p>`);
      if (fx.length) {
        const ol = document.createElement('ol'); ol.className = 'fxlist';
        fx.forEach(a => { const li = document.createElement('li'); li.textContent = `${a.when === 'click' ? 'Bấm' : 'Cùng lúc'} · ${a.n} (${{ question: 'câu hỏi', option: 'lựa chọn', item: 'mục', answer: 'đáp án', line: 'dây nối' }[a.role]})`; ol.appendChild(li); });
        p.appendChild(ol);
        const ctl = document.createElement('div'); ctl.className = 'row';
        const mk = (t, f) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = t; b.onclick = f; ctl.appendChild(b); };
        mk('Xem từ đầu', () => { state.fxStep = 0; drawMain(); drawPanel(); });
        mk('Bấm tiếp ▶', () => { state.fxStep = Math.min(steps, (state.fxStep == null ? 0 : state.fxStep) + 1); drawMain(); drawPanel(); });
        mk('Hiện hết', () => { state.fxStep = null; drawMain(); drawPanel(); });
        p.appendChild(ctl);
        if (state.fxStep != null) p.insertAdjacentHTML('beforeend', `<p class="muted">Đang xem: lần bấm ${state.fxStep}/${steps}</p>`);
      }
    } else if (tab === 'images') {
      const r = state.slides[state.sel]; const imgs = (r && r.images) || [];
      const st = window.PLS_IMAGES ? window.PLS_IMAGES.stats() : {};
      p.insertAdjacentHTML('beforeend', `<p class="muted">Kho: Châu Âu ${st.eu ? st.eu.count : '?'} ảnh · Châu Á ${st.as ? st.as.count : '?'} ảnh (${st.eu ? st.eu.from : ''}). Tự gắn khi khớp đúng nghĩa, biến thể hoặc từ đồng nghĩa đã duyệt; không tự gắn ảnh gần nghĩa.</p>`);
      const rf = document.createElement('button'); rf.type = 'button'; rf.className = 'btn'; rf.textContent = 'Cập nhật danh sách ảnh từ Drive';
      rf.onclick = async () => { rf.disabled = true; rf.textContent = 'Đang cập nhật…'; try { const o = await window.PLS_IMAGES.refresh(); rf.textContent = 'Đã cập nhật: ' + Object.entries(o).map(([k, v]) => k + ' ' + v).join(', '); build(); } catch (e) { rf.textContent = 'Lỗi: ' + e.message; } };
      p.appendChild(rf);
      if (window.PLS_REVIEW) window.PLS_REVIEW.panel(p, () => build());   // ảnh người dùng gửi lên chờ duyệt → Duyệt vào kho / Bỏ
      if (!imgs.length) { p.insertAdjacentHTML('beforeend', '<p class="muted">Slide này không có ô ảnh nội dung.</p>'); return; }
      const HOW = { exact: 'Khớp đúng', variant: 'Biến thể', synonym: 'Đồng nghĩa', user: 'Người chọn', none: 'Thiếu hình', removed: 'Đã bỏ ảnh', empty: 'Để trống (gõ từ để thêm ảnh)' };
      imgs.forEach(im => {
        const d = document.createElement('div'); d.className = 'issue' + (state.focusImg === im.key ? ' focus' : ''); d.dataset.key = im.key;
        const lv = im.type === 'none' ? 'vang' : '';
        d.innerHTML = `<div class="row"><b>${escapeHtml(im.word || im.slot)}</b><span class="pill ${lv}">${HOW[im.type] || im.type}</span></div>` + (im.id ? `<img class="imgnow" alt="${escapeHtml(im.label || '')}" src="${window.PLS_IMAGES.url(im.id, 240)}"><span class="muted">${escapeHtml(im.label || '')}</span>` : '');
        const key = 'img:' + im.key;
        const setOv = v => { const k = r.src + '/' + r.part; const o = (state.imgOv[k] = state.imgOv[k] || {}); if (v == null) delete o[key]; else o[key] = v; build(); };
        // ảnh tải lên: dùng ngay trong bài + gửi Drive "Ảnh chờ duyệt" (từ đã có ảnh trong kho → đánh dấu đề xuất thay ảnh cũ)
        const upload = (f, note) => { if (!f) return; const rd = new FileReader(); rd.onload = () => { setOv(rd.result);
          if (!window.PLS_REVIEW) return; const vi = (r.spec.data[im.key.replace(/(^|\.)img$/, '$1vi')] || '');
          window.PLS_REVIEW.submit(rd.result, { word: im.word || vi, vi, brand: state.brand, lesson: state.spec.lesson, slide: state.sel + 1, comp: r.host.dataset.comp, slot: im.key, replace: im.id && /exact|variant|synonym|user/.test(im.type) ? { id: im.id, label: im.label || '' } : null })
            .then(x => setStatus(x.dup ? 'Ảnh này đã gửi duyệt trước đó.' : `Đã gửi ảnh "${im.word || vi}" lên Drive chờ duyệt.`)).catch(e => setStatus('Chưa gửi được ảnh lên Drive (sẽ tự gửi lại): ' + e.message)); };
          rd.readAsDataURL(f); };
        const cands = im.cands && im.cands.length ? im.cands : (im.word ? window.PLS_IMAGES.search(im.word, window.PLS_IMAGES.srcOfBrand(state.brand), 6) : []);
        if (cands.length) {
          const g = document.createElement('div'); g.className = 'cands';
          cands.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.title = c.label + (c.prev ? ' – ảnh từng dùng cho nghĩa này' : ''); b.innerHTML = `<img alt="" src="${window.PLS_IMAGES.url(c.id, 160)}"><span>${escapeHtml(c.label)}</span>`; b.onclick = () => setOv('id:' + c.id); g.appendChild(b); });
          d.insertAdjacentHTML('beforeend', '<span class="muted">Gợi ý gần nghĩa (bấm để chọn):</span>'); d.appendChild(g);
        }
        const row = document.createElement('div'); row.className = 'row';
        const q = document.createElement('input'); q.type = 'search'; q.placeholder = 'Tìm ảnh khác…'; q.setAttribute('aria-label', 'Tìm ảnh trong kho');
        q.onchange = () => { if (q.value.trim()) setOv(q.value.trim()); };
        const rm = document.createElement('button'); rm.type = 'button'; rm.textContent = im.type === 'removed' ? 'Tự gắn lại' : 'Bỏ ảnh'; rm.onclick = () => setOv(im.type === 'removed' ? undefined : '-');
        const upl = document.createElement('label'); upl.className = 'btn file'; upl.textContent = im.id ? 'Tải ảnh khác' : 'Tải ảnh lên'; upl.title = im.id ? 'Dùng cho bài này và gửi duyệt: đề xuất thay ảnh cũ trong kho' : 'Dùng cho bài này và gửi duyệt vào kho';
        const ufi = document.createElement('input'); ufi.type = 'file'; ufi.accept = 'image/png,image/jpeg,image/webp'; ufi.onchange = () => upload(ufi.files[0]); upl.appendChild(ufi);
        row.append(q, rm, upl); d.appendChild(row);
        if (im.why || im.soat) d.insertAdjacentHTML('beforeend', `<span class="muted">${escapeHtml(im.why || ('Cần soát: ' + im.soat))}</span>`);
        if (im.type === 'none' || im.type === 'empty') {
          // GÓI TẠO ẢNH: prompt + ảnh mẫu phong cách của kho + ảnh gần nghĩa → tạo bằng công cụ AI rồi tải lên ô
          const slotEl = r.host.querySelector(`[data-img-key="${CSS.escape(im.key)}"]`);
          const sb = slotEl ? slotEl.getBoundingClientRect() : null;
          const word = im.word || '';
          const pk = window.PLS_IMAGES.stylePack(word || '…', state.brand, { bai: state.spec.lesson, level: (state.spec.meta || {}).level, w: sb && sb.width, h: sb && sb.height });
          const g = document.createElement('details'); g.className = 'pack';
          g.innerHTML = `<summary>Gói tạo ảnh (${pk.kho}, khung ${pk.ratio})</summary>`;
          const ta = document.createElement('textarea'); ta.className = 'prompt'; ta.value = pk.prompt; ta.setAttribute('aria-label', 'Prompt tạo ảnh');
          const cp = document.createElement('button'); cp.type = 'button'; cp.className = 'btn'; cp.textContent = 'Sao chép prompt';
          cp.onclick = async () => { try { await navigator.clipboard.writeText(ta.value); cp.textContent = 'Đã sao chép'; } catch (e) { ta.select(); cp.textContent = 'Bấm Ctrl+C để sao chép'; } };
          const refs = document.createElement('div'); refs.className = 'cands';
          pk.refs.forEach(x => { const a2 = document.createElement('a'); a2.href = x.url; a2.target = '_blank'; a2.rel = 'noopener'; a2.innerHTML = `<img alt="" src="${window.PLS_IMAGES.url(x.id, 160)}"><span>Mẫu: ${escapeHtml(x.label)}</span>`; refs.appendChild(a2); });
          if (pk.near) { const a3 = document.createElement('a'); a3.href = pk.near.url; a3.target = '_blank'; a3.rel = 'noopener'; a3.innerHTML = `<img alt="" src="${window.PLS_IMAGES.url(pk.near.id, 160)}"><span>Gần nghĩa: ${escapeHtml(pk.near.label)}</span>`; refs.appendChild(a3); }
          const up = document.createElement('label'); up.className = 'btn file'; up.textContent = 'Tải ảnh đã tạo lên';
          const fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/png,image/jpeg,image/webp'; up.appendChild(fi);
          fi.onchange = () => upload(fi.files[0]);
          const acts = document.createElement('div'); acts.className = 'acts'; acts.append(cp, up);
          g.append(ta, acts, refs);
          g.insertAdjacentHTML('beforeend', '<span class="muted">Tải ảnh mẫu (bấm vào ảnh) đính kèm cùng prompt vào công cụ tạo ảnh. Ảnh tải lên dùng ngay trong bài và tự gửi lên Drive chờ duyệt; duyệt xong ảnh vào kho cho các bài sau.</span>');
          d.appendChild(g);
        }
        p.appendChild(d);
      });
    } else if (tab === 'data') {
      const ta = document.createElement('textarea'); ta.id = 'specJson'; ta.value = JSON.stringify(state.spec, null, 1); ta.setAttribute('aria-label', 'Dữ liệu bài (JSON)');
      const b = document.createElement('button'); b.type = 'button'; b.className = 'primary'; b.textContent = 'Áp dụng và dựng lại';
      const msg = document.createElement('p'); msg.className = 'muted';
      b.onclick = () => { try { state.spec = JSON.parse(ta.value); state.overrides = {}; build(); msg.textContent = 'Đã áp dụng.'; } catch (e) { msg.textContent = 'JSON lỗi: ' + e.message; } };
      p.append(ta, b, msg);
    } else if (tab === 'claude') {
      if (window.PLS_CLAUDE) window.PLS_CLAUDE.panel(p);
    }
  }
  const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function setStatus(t) { $('#status').textContent = t; }

  // ---------- xuất PPTX ----------
  // Dựng bản xuất: cùng nội dung + ghi đè, đổi sang font an toàn theo thiết bị, co chữ lại, soát lại
  function exportView(device) {
    const xs = $('#xstage'); xs.innerHTML = '';
    return state.slides.map((r, i) => {
      const x = E.render(r.spec, state.brand); xs.appendChild(x.host);
      if (window.PLS_IMAGES) window.PLS_IMAGES.fill(x.host, state.brand, r.spec.data);
      E.applyExportFonts(x.host, state.brand, device);
      if (state.hier) E.hierarchy(x);
      E.typoLayout(x);
      x.fitLog = E.fitText(x); E.typoSpread(x); x.issues = E.audit(x).filter(i => i.code !== 'noImage'); x.slide = i + 1;
      E.planFx(x, state.fx);
      x.spec = r.spec; { const pk = r.src + '/' + r.part; if (state.fxp[pk] && window.PLS_FXP) window.PLS_FXP.apply(x, state.fxp[pk]); }   // bộ hiệu ứng nhanh cũng vào file xuất
      return x;
    });
  }
  // GHI CHÚ GIẢNG (Notes dưới slide): máy soạn từ Excel (import-excel.js / auto.js), người dùng sửa được; bản sửa giữ theo slide (nguồn/phần)
  const notesKey = r => r.src + '/' + r.part;
  function notesOf(r) { const k = notesKey(r); return k in state.notesOv ? state.notesOv[k] : ((r.spec && r.spec.notes) || ''); }
  function drawNotes(r) {
    let box = $('#notesBox'); if (!box) { box = document.createElement('details'); box.id = 'notesBox'; box.open = true; $('#canvas').after(box); }
    if (!r) { box.hidden = true; return; } box.hidden = false;
    const k = notesKey(r), edited = k in state.notesOv;
    box.innerHTML = `<summary><b>Ghi chú giảng</b> <span class="muted">· ẩn dưới slide (Notes trong PowerPoint / Google Slides)${edited ? ' · đã sửa tay' : ''}</span></summary>`;
    const ta = document.createElement('textarea'); ta.id = 'notesText'; ta.rows = 7; ta.value = notesOf(r); ta.setAttribute('aria-label', 'Ghi chú giảng của slide');
    ta.placeholder = 'GIẢNG\n• …\n\nLƯU Ý\n• …';
    ta.oninput = () => { state.notesOv[k] = ta.value; };
    box.appendChild(ta);
    if (edited) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = 'Về ghi chú máy soạn'; b.onclick = () => { delete state.notesOv[k]; drawNotes(r); }; box.appendChild(b); }
  }
  function stdCtx() { const m = (state.spec && state.spec.meta) || {}; return { transition: state.tr, brand: state.brand, level: m.level || '', no: m.no || 1, sessionType: m.sessionType || '', title: m.title || (state.spec && state.spec.lesson) || 'Bai' }; }
  function curDevice() { const devs = E.devicesOf(state.brand); return devs.find(d => d.key === state.device) || devs[0]; }
  function drawDeviceSel() {
    const devs = E.devicesOf(state.brand); const s = $('#device'); s.innerHTML = '';
    devs.forEach(d => s.add(new Option(d.font ? `Mở trên ${d.tag}` : 'Mở trên mọi máy', d.key)));
    s.value = curDevice().key; s.disabled = devs.length === 1;
  }
  async function exportPptx(deviceKey) {
    const devs = E.devicesOf(state.brand);
    const device = devs.find(d => d.key === (deviceKey || state.device)) || devs[0];
    setStatus(`Đang xuất PPTX (${device.tag})…`);
    const xs = exportView(device.font ? device : null);
    const bad = xs.flatMap(x => x.issues.filter(i => i.lv === 'do').map(i => `slide ${x.slide}: ${i.msg}`));
    const model = await E.toModel(xs.map(x => x.host), { transition: state.tr });
    model.slides.forEach((m, i) => { if (state.slides[i]) m.notes = notesOf(state.slides[i]); });   // ghi chú giảng → Notes của từng slide
    const bytes = window.PPTX.build(model);
    $('#xstage').innerHTML = '';
    let name = window.PLS_STD ? window.PLS_STD.fileName(stdCtx(), 'pptx') : `${(state.spec.lesson || 'bai').replace(/[^\p{L}\p{N}]+/gu, '_')}.pptx`;   // RB-CH-02
    if (devs.length > 1) name = name.replace(/\.pptx$/, '_' + ({ win: 'Win', mac: 'Mac', and: 'Android' }[device.key] || device.key) + '.pptx');
    if (bad.length) console.warn('[PLS] lỗi sau khi đổi font xuất:', bad);
    if (window.PLS_LOG) {   // số liệu cho vòng tự học (tab images / lint / layout trên Sheet)
      const kho = window.PLS_IMAGES ? window.PLS_IMAGES.srcOfBrand(state.brand) : '';
      const ev = [];
      state.slides.forEach((r, i) => {
        (r.images || []).forEach(im => { if (im.word || im.id) ev.push({ type: 'image', brand: state.brand, kho, word: im.word || '', how: im.type === 'none' ? 'missing' : im.type, img: im.label || im.id || '', via: im.via || '' }); });
        const by = {}; r.issues.forEach(x => (by[x.code] = by[x.code] || []).push(x.msg)); Object.entries(by).forEach(([k, v]) => ev.push({ type: 'lint', slide: i + 1, tpl: r.host.dataset.comp, kind: k, n: v.length, msg: v.join(' | ') }));
        if (r.plans && r.part === 0) ev.push({ type: 'layout', prefix: 'vocab', n: (state.spec.slides[r.src].items || []).length, chosen: r.plans.find(p => p.active).label, ranking: r.plans.map(p => p.label + ' ' + p.score) });
      });
      window.PLS_LOG.events(ev);
    }
    state.exportWarns = bad;
    let saved = false;
    try { const dl = window.claude && await window.claude.use('downloads'); if (dl) { await dl.save({ filename: name, data: new Blob([bytes]) }); saved = true; } } catch (e) { console.warn('[PLS] downloads:', e && e.code); }
    if (!saved) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    setStatus(`Đã xuất ${name} (${Math.round(bytes.length / 1024)} KB)` + (bad.length ? ` · ${bad.length} lỗi sau khi đổi font – xem tab Soát lỗi` : ''));
    drawPanel();
    return { name, bytes: bytes.length, device: device.tag, issues: bad };
  }

  function fromExcel() {
    const r = window.PLS_IMPORT.buildSpec(state.book.s6, state.book.s5, +$('#buoi').value, state.brand);
    state.importWarns = r.warns; $('#lessonName').textContent = r.spec.lesson;
    state.spec = r.spec; state.overrides = {}; state.imgOv = {}; state.choice = {}; state.sel = 0;
    return build();
  }

  // ---------- cổng lệnh cho Claude ----------
  window.PLS = {
    loadExcelBooks(books, buoi) { state.book = books; const s = $('#buoi'); s.innerHTML = ''; window.PLS_IMPORT.sessions(books.s6).forEach(x => s.add(new Option('Buổi ' + x.buoi, x.buoi))); s.value = buoi; s.hidden = false; return fromExcel(); },
    load(spec) { state.spec = spec; state.brand = spec.brand || state.brand; state.overrides = {}; state.choice = {}; $('#brand').value = state.brand; return build(); },
    build, exportPptx, devices: () => E.devicesOf(state.brand), standard: () => state.std,
    device(k) { state.device = k; return build(); }, fontMode(m) { state.fontMode = m; $('#fontMode').value = m; return build(); }, hier(on) { state.hier = !!on; $('#hier').value = on ? '1' : '0'; return build(); },
    issues() { return state.slides.map((r, i) => ({ slide: i + 1, comp: r.host.dataset.comp, score: r.score, issues: r.issues })); },
    typo() { return state.slides.map((r, i) => ({ slide: i + 1, comp: r.host.dataset.comp, typo: r.typo || [] })).filter(x => x.typo.length); },
    set(slide, slot, text) { const r = state.slides[slide - 1]; if (!r) throw new Error('Không có slide ' + slide); setSlot(r, slot, text); return build(); },
    notes(slide) { const r = state.slides[slide - 1]; return r ? notesOf(r) : null; },
    setNotes(slide, text) { const r = state.slides[slide - 1]; if (!r) throw new Error('Không có slide ' + slide); if (text == null) delete state.notesOv[notesKey(r)]; else state.notesOv[notesKey(r)] = String(text); if (state.sel === slide - 1) drawNotes(r); return notesOf(r); },
    fxDetect(slide) { const r = state.slides[slide - 1]; return r && window.PLS_FXP ? window.PLS_FXP.detect(r) : null; },
    fxPreset(slide, id, all) { const r = state.slides[slide - 1]; if (!r) throw new Error('Không có slide ' + slide); const t = window.PLS_FXP.detect(r).type; const ks = all && t ? state.slides.filter(x => window.PLS_FXP.detect(x).type === t).map(x => x.src + '/' + x.part) : [r.src + '/' + r.part]; ks.forEach(k => { if (id === 'auto') delete state.fxp[k]; else state.fxp[k] = id; }); return build(); },
    choose(slide, label) { const r = state.slides[slide - 1]; state.choice[r.src] = label; return build(); },
    brand(b) { state.brand = b; $('#brand').value = b; return build(); },
    images() { return state.slides.map((r, i) => ({ slide: i + 1, images: r.images })); },
    setImage(slide, slotKey, value) { const r = state.slides[slide - 1]; const k = r.src + '/' + r.part; (state.imgOv[k] = state.imgOv[k] || {})['img:' + slotKey] = value; return build(); },
    get spec() { return state.spec; },
    _modelForTest: () => E.toModel(state.slides.map(r => r.host), {}),
    _int: { state, setSlot, build, curDevice, stdCtx, select(i) { state.sel = i; state.fxStep = null; drawList(); drawMain(); drawPanel(); }, redraw() { drawPanel(); }, setStatus }
  };

  // ---------- khởi động ----------
  function init() {
    const sel = $('#brand'); BRANDS.forEach(b => sel.add(new Option(b, b)));
    sel.onchange = () => { state.brand = sel.value; if (state.book) fromExcel(); else build(); };
    // Excel giáo trình: S6 (nội dung) bắt buộc, S5 (khung buổi: timeline, dặn dò) nên có
    $('#xlsx').onchange = async ev => {
      try {
        if (!window.XLSX) throw new Error('chưa tải được thư viện đọc Excel');
        const books = {};
        for (const f of ev.target.files) { const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }); const b = window.PLS_IMPORT.readWorkbook(wb, XLSX); if (Object.keys(b).some(k => /^S6-/.test(k))) books.s6 = b; else if (b['S5']) books.s5 = b; }
        if (!books.s6) throw new Error('không thấy file S6 (các tab "S6-…")');
        state.book = books;
        const bs = window.PLS_IMPORT.sessions(books.s6); const bsel = $('#buoi'); bsel.innerHTML = '';
        bs.forEach(s => bsel.add(new Option(`Buổi ${s.buoi} · ${s.name.replace(/^Bài\s*\d+\s*[–-]\s*/, '')}`, s.buoi)));
        bsel.hidden = $('#buoiLabel').hidden = false; bsel.onchange = () => fromExcel();
        const firstLesson = bs.find(s => /học/i.test(s.type)) || bs[0]; bsel.value = firstLesson.buoi;
        if (state.brand === 'Betreux' && /toeic|english|ielts/i.test(ev.target.files[0].name)) { state.brand = 'Creative English'; sel.value = state.brand; }
        fromExcel();
      } catch (e) { setStatus('Không đọc được Excel: ' + e.message); }
    };
    $('#btnBuild').onclick = () => build();
    $('#device').onchange = () => { state.device = $('#device').value; build(); };
    $('#fontMode').onchange = () => { state.fontMode = $('#fontMode').value; build(); };
    $('#hier').onchange = () => { state.hier = $('#hier').value === '1'; build(); };
    $('#btnPptx').onclick = () => {
      const devs = E.devicesOf(state.brand);
      if (devs.length === 1 || state.fontMode === 'safe') return exportPptx(curDevice().key).catch(e => setStatus('Xuất lỗi: ' + e.message));
      const m = $('#devMenu'); m.innerHTML = ''; m.hidden = !m.hidden;
      devs.forEach(d => { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Bản ' + d.tag + ' (' + d.font + ')'; b.onclick = () => { m.hidden = true; exportPptx(d.key).catch(e => setStatus('Xuất lỗi: ' + e.message)); }; m.appendChild(b); });
    };
    document.querySelectorAll('[role=tab]').forEach(t => t.onclick = () => { document.querySelectorAll('[role=tab]').forEach(x => x.setAttribute('aria-selected', x === t)); drawPanel(); });
    if ($('#file')) $('#file').onchange = async ev => { const f = ev.target.files[0]; if (!f) return; try { const spec = JSON.parse(await f.text()); window.PLS.load(spec); } catch (e) { setStatus('File không đọc được: ' + e.message); } };
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawMain, 150); });
    state.spec = null; sel.value = state.brand;   // mở trang: chưa có bài → màn hình bắt đầu (không dựng bài mẫu)
    // nạp sẵn font brand trước khi đo (font web chỉ tải khi được dùng → đo sớm sẽ sai)
    const FONTS = ['900 40px "Zalando Sans Expanded"', '400 40px Montserrat', '600 40px Montserrat', '700 40px Montserrat', '900 40px Montserrat', '600 40px "Barlow Condensed"', '700 40px Lexend', '400 40px Inter', '700 40px Inter', '400 20px "Source Sans 3"', '700 20px "Source Sans 3"', '400 40px "Gothic A1"', '700 40px "Gothic A1"', '400 40px "Noto Sans JP"', '400 20px "Noto Serif KR"'];
    Promise.race([Promise.allSettled(FONTS.map(f => document.fonts.load(f, 'Aaăâđêôơư'))), new Promise(r => setTimeout(r, 4000))]).then(() => build())
      .then(() => window.PLS_IMAGES && window.PLS_IMAGES.autoRefresh(r => { setStatus('Đã cập nhật danh sách ảnh: ' + Object.entries(r).map(([k, v]) => k + ' ' + v).join(', ')); build(); }));
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();

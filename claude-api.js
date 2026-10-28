// CỔNG CHO CLAUDE (thay PLS Bridge của Figma): Claude điều khiển trang qua Claude in Chrome / trình duyệt của Claude
// bằng lệnh JS window.PLS.*. Lệnh trả về chữ/JSON gọn để tiết kiệm token; mọi thao tác ghi nhật ký + hiện huy hiệu,
// có hoàn tác; người dùng gửi "nhờ Claude sửa" từng slide → Claude đọc bằng PLS.inbox().
(function (root) {
  const P = root.PLS; if (!P || !P._int) return;
  const I = P._int, S = I.state;
  const LS = 'pls.claude.v1';
  const store = (() => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } })();
  store.notes = store.notes || []; store.log = store.log || [];
  const save = () => { try { localStorage.setItem(LS, JSON.stringify({ notes: store.notes, log: store.log.slice(-80) })); } catch (e) {} };
  const undo = [];
  const keyOf = r => r.src + '/' + r.part;
  const slideNo = key => S.slides.findIndex(r => keyOf(r) === key) + 1;
  const short = v => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s && s.length > 60 ? s.slice(0, 57) + '…' : s; };

  // huy hiệu "Claude đang thao tác" trên thanh đầu
  let badge = null, tm = 0;
  function flash(txt) {
    if (!badge) { badge = document.createElement('span'); badge.id = 'claudeBadge'; badge.setAttribute('role', 'status'); badge.style.cssText = 'position:fixed;top:6px;left:50%;transform:translateX(-50%);z-index:1000;padding:3px 12px;box-shadow:0 2px 8px rgba(0,0,0,.2);border-radius:999px;background:#d97757;color:#fff;font-size:12px;white-space:nowrap;max-width:320px;overflow:hidden;text-overflow:ellipsis'; document.body.appendChild(badge); }
    badge.textContent = 'Claude: ' + txt; badge.hidden = false; clearTimeout(tm); tm = setTimeout(() => { badge.hidden = true; }, 6000);
  }
  function log(cmd, args) { store.log.push({ t: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), cmd, args: (args || []).map(short).join(', ') }); save(); flash(cmd + (args && args.length ? ' ' + short(args[0]) : '')); refresh(); }
  function snap() { undo.push(JSON.stringify({ spec: S.spec, overrides: S.overrides, imgOv: S.imgOv, choice: S.choice, brand: S.brand })); if (undo.length > 30) undo.shift(); }
  function refresh() { const t = document.querySelector('[role=tab][aria-selected=true]'); if (t && t.dataset.tab === 'claude') I.redraw(); }

  // người dùng 25/10: bấm "Xuất bài" / đổi buổi… là thao tác của NGƯỜI DÙNG → không hiện huy hiệu "Claude: …" (chỉ hiện khi Claude điều khiển qua lệnh)
  const userAct = () => !!(navigator.userActivation && navigator.userActivation.isActive) || !!(window.event && window.event.isTrusted);
  // bọc các lệnh có sẵn: ghi nhật ký; lệnh sửa → chụp trạng thái để hoàn tác
  const MUT = ['load', 'loadExcelBooks', 'set', 'choose', 'brand', 'setImage', 'device', 'fontMode', 'hier'];
  for (const k of MUT.concat(['build', 'exportPptx'])) { const f = P[k]; if (typeof f !== 'function') continue; P[k] = function (...a) { if (MUT.includes(k)) snap(); if (!userAct()) log(k, a); return f.apply(this, a); }; }

  const issuesOf = r => (r.issues || []).filter(x => x.lv === 'do' || x.lv === 'vang');
  Object.assign(P, {
    help() {
      return [
        'PLS Studio – lệnh cho Claude (mọi lệnh sửa đều dựng lại slide, ghi nhật ký, PLS.undo() để hoàn tác):',
        'XEM  PLS.summary() tóm tắt cả bài · PLS.slide(n) ô + chữ + lỗi + phương án của slide n · PLS.find("chữ") tìm ô chứa chữ',
        '     PLS.issues() lỗi chi tiết · PLS.standard() 29 luật v2.0 · PLS.images() ảnh từng ô · PLS.typo() luật chữ đặc biệt đã áp',
        'SỬA  PLS.set(n,"ô","chữ") · PLS.setMany([[n,"ô","chữ"],…]) · PLS.choose(n,"phương án") · PLS.setImage(n,"ô","id:<driveId>"|"-"|"từ khoá")',
        '     PLS.brand("Créatis") · PLS.device("win|mac|and") · PLS.hier(true|false) · PLS.load(spec) · PLS.loadExcelBooks(books,buoi)',
        '     PLS.loadDrive(idS6, idS5, buoi) đọc Excel S5/S6 trên Drive (file chia sẻ công khai theo link)',
        'ĐIỀU HƯỚNG  PLS.select(n) cho người dùng thấy slide đang sửa',
        'YÊU CẦU  PLS.inbox() việc người dùng nhờ · PLS.reply(id,"đã sửa…") trả lời + đóng việc',
        'XUẤT  PLS.exportPptx(device?) tải file .pptx (hỏi người dùng trước khi tải)',
        'AI TRÊN MÁY  await PLS.localFix(n,"yêu cầu") – model Slide (Ollama) sửa slide n bằng set/choose',
        'KHÁC  PLS.undo() · PLS.journal() nhật ký thao tác'
      ].join('\n');
    },
    summary() {
      const all = S.slides.flatMap(r => r.issues || []); const red = all.filter(x => x.lv === 'do').length, yel = all.filter(x => x.lv === 'vang').length;
      const std = (S.std || []).filter(x => x.status === 'loi').map(x => x.id);
      const open = store.notes.filter(n => !n.done).length;
      const head = `${S.brand} · ${(S.spec && S.spec.lesson) || ''} · ${S.slides.length} slide · đỏ ${red} vàng ${yel}` + (std.length ? ` · luật chưa đạt: ${std.join(' ')}` : '') + (open ? ` · ${open} việc nhờ Claude (PLS.inbox())` : '') + ` · đang xem slide ${S.sel + 1}`;
      return head + '\n' + S.slides.map((r, i) => { const is = issuesOf(r); const codes = [...new Set(is.map(x => (x.lv === 'do' ? '!' : '') + (x.code || x.rule || '')))].join(' '); return `${i + 1} ${r.host.dataset.comp.replace('Slide/', '')} ${r.score}${codes ? ' ' + codes : ''}`; }).join('\n');
    },
    slide(n) {
      const r = S.slides[n - 1]; if (!r) throw new Error('Không có slide ' + n);
      const data = {}; for (const [k, v] of Object.entries(r.spec.data || {})) if (!/^img:/.test(k)) data[k] = v;
      return { slide: n, comp: r.host.dataset.comp, score: r.score, data, issues: issuesOf(r).map(x => (x.lv === 'do' ? 'ĐỎ ' : 'vàng ') + x.msg),
        plans: r.plans ? r.plans.map(p => p.label + (p.active ? ' (đang dùng)' : '') + ' ' + p.score) : undefined,
        images: (r.images || []).map(x => `${x.key}: ${x.word || ''} → ${x.type}${x.label ? ' ' + x.label : ''}${x.why ? ' (' + x.why + ')' : ''}`), typo: r.typo && r.typo.length ? r.typo : undefined,
        notes: store.notes.filter(x => !x.done && x.key === keyOf(r)).map(x => x.text) };
    },
    find(text) { const q = String(text).toLowerCase(); const out = []; S.slides.forEach((r, i) => { for (const [k, v] of Object.entries(r.spec.data || {})) if (typeof v === 'string' && v.toLowerCase().includes(q)) out.push(`${i + 1} ${k}: ${short(v)}`); }); return out.join('\n') || 'không thấy'; },
    setMany(list) { snap(); log('setMany', [list.length + ' ô']); for (const [n, slot, text] of list) { const r = S.slides[n - 1]; if (!r) throw new Error('Không có slide ' + n); I.setSlot(r, slot, text); } return I.build(); },
    select(n) { if (!S.slides[n - 1]) throw new Error('Không có slide ' + n); I.select(n - 1); log('select', [n]); const el = document.querySelector('#slides .thumb.sel'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); return n; },
    undo() { const s = undo.pop(); if (!s) return 'Không còn gì để hoàn tác'; const o = JSON.parse(s); Object.assign(S, { spec: o.spec, overrides: o.overrides, imgOv: o.imgOv, choice: o.choice, brand: o.brand }); const b = document.querySelector('#brand'); if (b) b.value = o.brand; log('undo', []); return I.build().then(() => 'Đã hoàn tác'); },
    journal() { return store.log.slice(-30).map(x => `${x.t} ${x.cmd} ${x.args}`).join('\n'); },
    inbox() { const open = store.notes.filter(x => !x.done); return open.length ? open.map(x => ({ id: x.id, slide: slideNo(x.key) || null, comp: x.comp, note: x.text, at: x.at })) : 'Không có việc nào'; },
    reply(id, msg) { const x = store.notes.find(n => n.id === id); if (!x) throw new Error('Không có việc ' + id); x.done = true; x.reply = String(msg || 'Đã xử lý'); save(); log('reply', [id, msg]); return 'Đã trả lời việc ' + id; },
    // AI TRÊN MÁY sửa slide (người dùng chốt 28/10): model Slide (mặc định pls-tools) đọc dữ liệu slide + yêu cầu → trả danh sách lệnh;
    // trang chỉ cho chạy 2 lệnh an toàn (set ô có sẵn, choose phương án có sẵn), chụp trạng thái trước để PLS.undo() được.
    async localFix(n, text) {
      const LA = root.PLS_LOCAL_AI; if (!LA) throw new Error('Thiếu pls-local-ai.js – tải lại trang');
      if (!(await LA.ready('slide'))) throw new Error('AI trên máy chưa sẵn sàng – bấm nút "AI trên máy" ở góc dưới để kiểm tra kết nối');
      const r = S.slides[n - 1]; if (!r) throw new Error('Không có slide ' + n);
      const info = P.slide(n), slots = Object.keys(info.data), plans = (r.plans || []).map(p => p.label);
      const sys = 'Bạn là công cụ sửa slide bài giảng ngoại ngữ của PLS Studio. Bạn chỉ có 2 lệnh:\n' +
        '{"cmd":"set","slot":"<tên ô, đúng một khoá trong data>","text":"<chữ mới cho cả ô>"}\n' + (plans.length ? '{"cmd":"choose","plan":"<đúng một tên trong: ' + plans.join(' | ') + '>"}\n' : '') +
        'Trả về đúng MỘT JSON: {"actions":[…],"reply":"<1 câu tiếng Việt nói đã sửa gì>"}. Chỉ sửa ô liên quan yêu cầu, giữ nguyên định dạng (xuống dòng, dấu, ký hiệu) của ô; ngôn ngữ đích đúng chính tả và đúng trình độ. Yêu cầu không làm được bằng các lệnh trên thì "actions":[] và giải thích trong reply.';
      const user = 'SLIDE ' + n + ' (' + info.comp + '):\n' + JSON.stringify({ data: info.data, issues: info.issues, plans: info.plans }) + '\n\nYÊU CẦU: ' + String(text || 'Sửa các lỗi đỏ và vàng của slide này');
      const out = await LA.ask('slide', [{ role: 'system', content: sys }, { role: 'user', content: user }], { json: true, maxTokens: 1500 });
      let d; try { d = JSON.parse(out.text); } catch (e) { throw new Error('AI trên máy trả về không đúng dạng – thử lại hoặc gửi Claude'); }
      const acts = (Array.isArray(d.actions) ? d.actions : []).filter(a => a && ((a.cmd === 'set' && slots.includes(a.slot) && typeof a.text === 'string') || (a.cmd === 'choose' && plans.includes(a.plan))));
      const skipped = (Array.isArray(d.actions) ? d.actions.length : 0) - acts.length;
      if (acts.length) { snap(); log('AI trên máy sửa', [n]);
        for (const a of acts) { if (a.cmd === 'set') I.setSlot(r, a.slot, a.text); else S.choice[r.src] = a.plan; }
        await I.build(); }
      return { slide: n, model: out.model, applied: acts.length, skipped, reply: String(d.reply || (acts.length ? 'Đã sửa ' + acts.length + ' chỗ' : 'Không sửa gì')) + (skipped ? ` (bỏ ${skipped} lệnh không hợp lệ)` : ''), actions: acts };
    },
    async loadDrive(idS6, idS5, buoi) {
      const key = (root.PLS_CONFIG || {}).driveKey; if (!key) throw new Error('Chưa có key Drive (config.js)'); if (!root.XLSX) throw new Error('Chưa tải thư viện đọc Excel');
      const get = async id => { const res = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?alt=media&key=' + encodeURIComponent(key)); if (!res.ok) throw new Error('Drive ' + res.status + ' – file phải chia sẻ "Bất kỳ ai có đường liên kết"'); return root.PLS_IMPORT.readWorkbook(root.XLSX.read(await res.arrayBuffer(), { type: 'array' }), root.XLSX); };
      const books = { s6: await get(idS6) }; if (idS5) books.s5 = await get(idS5);
      const ss = root.PLS_IMPORT.sessions(books.s6); return P.loadExcelBooks(books, buoi || (ss[0] && ss[0].buoi) || 1);
    }
  });

  // ---------- tab "Cho Claude": cách kết nối + nhờ sửa slide + nhật ký ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function panel(p) {
    const r = S.slides[S.sel]; const n = S.sel + 1;
    const box = document.createElement('div');
    box.innerHTML = `<p class="muted">Claude điều khiển trang này từ khung chat (thay PLS Bridge của Figma). Mở Claude, bật tiện ích <b>Claude in Chrome</b> rồi nhắn ví dụ: <i>"Mở tab PLS Studio, soát bài và sửa các lỗi đỏ"</i>. Mở file từ máy (file://) thì bật "Cho phép truy cập URL tệp" trong chi tiết tiện ích.</p>
      <h3 style="margin:12px 0 4px;font-size:14px">Nhờ Claude sửa slide ${n}${r ? ' · ' + esc(r.host.dataset.comp.replace('Slide/', '')) : ''}</h3>
      <textarea id="claudeNote" rows="3" style="height:88px;min-height:0;flex:none;width:100%;box-sizing:border-box" aria-label="Việc nhờ Claude" placeholder="VD: đổi ví dụ 2 cho dễ hơn, tiêu đề ngắn lại"></textarea>
      <button type="button" class="primary" id="claudeSend">Gửi cho Claude</button> <button type="button" id="localFix">Sửa ngay bằng AI trên máy</button>
      <p class="muted" style="font-size:12px" id="localFixMsg">Sau khi gửi, nhắn Claude: <i>"xem việc trong PLS Studio"</i>. Hoặc bấm <b>Sửa ngay bằng AI trên máy</b> (Ollama, không cần Claude; để trống ô thì sửa lỗi đỏ/vàng; PLS.undo() để hoàn tác).</p>`;
    p.appendChild(box);
    box.querySelector('#localFix').onclick = async e => { const btn = e.currentTarget, ta = box.querySelector('#claudeNote'), msg = box.querySelector('#localFixMsg'), t = ta.value.trim(); if (!r) return;
      btn.disabled = true; btn.textContent = 'AI trên máy đang sửa…';
      try { const res = await P.localFix(n, t); store.notes.push({ id: 'v' + Date.now().toString(36), key: keyOf(r), comp: r.host.dataset.comp, text: t || 'Sửa lỗi đỏ/vàng', at: new Date().toLocaleString('vi-VN'), done: true, reply: 'AI trên máy (' + res.model + '): ' + res.reply }); save(); ta.value = ''; I.redraw(); }
      catch (err) { btn.disabled = false; btn.textContent = 'Sửa ngay bằng AI trên máy'; msg.textContent = 'Lỗi: ' + err.message; } };
    box.querySelector('#claudeSend').onclick = () => { const ta = box.querySelector('#claudeNote'); const t = ta.value.trim(); if (!t || !r) return; store.notes.push({ id: 'v' + Date.now().toString(36), key: keyOf(r), comp: r.host.dataset.comp, text: t, at: new Date().toLocaleString('vi-VN') }); save(); ta.value = ''; I.redraw(); };
    const notes = store.notes.slice(-12).reverse();
    if (notes.length) { const ul = document.createElement('ul'); ul.style.cssText = 'list-style:none;padding:0;margin:8px 0'; ul.innerHTML = notes.map(x => `<li style="padding:6px 0;border-bottom:1px solid var(--line,#ddd)"><b>${x.done ? '✓' : '•'} Slide ${slideNo(x.key) || '?'}</b> ${esc(x.text)}${x.reply ? `<br><span class="muted">Claude: ${esc(x.reply)}</span>` : ''}</li>`).join(''); const h = document.createElement('h3'); h.style.cssText = 'margin:12px 0 4px;font-size:14px'; h.textContent = 'Việc đã nhờ'; p.append(h, ul); }
    const lg = store.log.slice(-15).reverse();
    const h2 = document.createElement('h3'); h2.style.cssText = 'margin:12px 0 4px;font-size:14px'; h2.textContent = 'Nhật ký thao tác của Claude';
    const pre = document.createElement('pre'); pre.style.cssText = 'white-space:pre-wrap;font-size:12px;max-height:220px;overflow:auto'; pre.textContent = lg.length ? lg.map(x => `${x.t} ${x.cmd} ${x.args}`).join('\n') : 'Chưa có thao tác nào.';
    const clr = document.createElement('button'); clr.type = 'button'; clr.textContent = 'Xoá nhật ký'; clr.onclick = () => { store.log = []; store.notes = store.notes.filter(x => !x.done); save(); I.redraw(); };
    const help = document.createElement('details'); help.innerHTML = `<summary>Danh sách lệnh</summary><pre style="white-space:pre-wrap;font-size:12px">${esc(P.help())}</pre>`;
    p.append(h2, pre, clr, help);
  }
  root.PLS_CLAUDE = { panel };
})(typeof window !== 'undefined' ? window : globalThis);

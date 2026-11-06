// DUYỆT ẢNH (thay F.submit / pending / approve / reject của plugin): ảnh người dùng tải lên ô → dùng ngay trong bài
// + gửi Apps Script (kind 'img') vào Drive "PLS – Ảnh chờ duyệt" + ghi bảng ANH "Chờ duyệt". Người duyệt xem danh sách
// (imgList), Duyệt (imgApprove: đổi tên theo từ + chuyển vào kho Châu Âu / Châu Á) hoặc Bỏ (imgReject → "Đã bỏ").
// Từ ĐÃ có ảnh trong kho mà vẫn tải ảnh khác → vẫn gửi, đánh dấu "đề xuất thay ảnh cũ"; duyệt thì có thể bỏ luôn ảnh cũ.
(function (root) {
  const CFG = root.PLS_CONFIG || {};
  const LS = 'pls.review.v1';
  const st = (() => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } })();
  st.sent = st.sent || {}; st.queue = st.queue || [];
  const save = () => { try { localStorage.setItem(LS, JSON.stringify({ sent: st.sent, queue: st.queue.slice(-20) })); } catch (e) {} };
  const FOLDER = { eu: '18NPo1g5Im4qEEPjXYUAmY3fOMumLLiG-', as: '1FDKFL7Ojk86lZFngF5EhXHXy23Ah2H8X' };   // = SOURCES của plugin (code.img_index.js)
  const REGION = b => /Saechang|Sakumi|Đắc Nhân/.test(b) ? 'as' : 'eu';
  const code = () => Date.now().toString(36).slice(-5).toUpperCase();
  const clean = s => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

  async function call(body) {   // Apps Script trả JSON đọc được (POST text/plain, không preflight)
    if (!CFG.logUrl) throw new Error('chưa có link Apps Script (⚙ Cài đặt)');
    const res = await fetch(CFG.logUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    const t = await res.text(); let j; try { j = JSON.parse(t); } catch (e) { throw new Error('Apps Script trả: ' + t.slice(0, 120)); }
    if (j.error) throw new Error(j.error); return j;
  }
  // ảnh bất kỳ (data URL) → PNG, cạnh dài ≤ 1600
  async function toPng(dataUrl) {
    const im = new Image(); im.src = dataUrl; await im.decode();
    const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
    const cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k);
    cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); return cv.toDataURL('image/png');
  }
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i += 97) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length.toString(36); };

  // gửi 1 ảnh: meta = { word, vi, brand, lesson, slide, comp, slot, replace: {id, label} | null }
  async function submit(dataUrl, meta) {
    const hk = hash(dataUrl); if (st.sent[hk]) return Object.assign({ dup: true }, st.sent[hk]);
    const word = clean(meta.word || meta.vi || 'anh'); const name = `${word} - ${code()}@2x.png`;
    const info = { app: 'PLS Studio (web)', word, vi: meta.vi || '', brand: meta.brand || '', src: REGION(meta.brand || ''), lesson: meta.lesson || '', slide: meta.slide || '', comp: meta.comp || '', slot: meta.slot || '', replace: meta.replace || null };
    let r;
    try {
      const png = await toPng(dataUrl);
      r = await call({ kind: 'img', name, b64: png.split(',')[1], file: 'PLS Studio (web)', nghia: meta.vi || word, bai: JSON.stringify(info) });
    } catch (e) { st.queue.push({ dataUrl: dataUrl.length < 3e6 ? dataUrl : null, meta, err: e.message, t: Date.now() }); save(); throw e; }
    st.sent[hk] = { id: r.id, name, t: Date.now() }; save();
    try { root.PLS_LOG && root.PLS_LOG.add('anh', { nguoi: 'PLS Studio (web)', bai: (meta.brand || '') + ' · ' + (meta.lesson || ''), khung: (meta.comp || '') + (meta.slide ? ' #' + meta.slide : ''), o: meta.slot || '', nghia: meta.vi || word, nguon: meta.replace ? 'tải lên – đề xuất thay ảnh cũ' : 'tải lên', link: r.url || ('https://drive.google.com/file/d/' + r.id), trangthai: 'Chờ duyệt', ghichu: meta.replace ? 'Ảnh cũ: ' + (meta.replace.label || meta.replace.id) : '' }); } catch (e) {}
    return { id: r.id, name, url: r.url };
  }
  async function retry() { const q = st.queue.splice(0); save(); let ok = 0; for (const x of q) { if (!x.dataUrl) continue; try { await submit(x.dataUrl, x.meta); ok++; } catch (e) {} } return ok; }

  // danh sách chờ duyệt (desc = JSON {file, nghia, bai(JSON info), t})
  async function list() {
    const r = await call({ kind: 'imgList', limit: 300 });
    return (r.files || []).map(f => { let d = {}, info = {}; try { d = JSON.parse(f.desc || '{}'); } catch (e) {} try { info = JSON.parse(d.bai || '{}'); } catch (e) { info = { lesson: d.bai || '' }; }
      return { id: f.id, name: f.name, t: f.t, size: f.size, word: info.word || String(f.name).replace(/ - [A-Z0-9]{4,6}(@\dx)?\.\w+$/, ''), vi: info.vi || d.nghia || '', brand: info.brand || '', src: info.src || REGION(info.brand || ''), lesson: info.lesson || '', slide: info.slide || '', replace: info.replace || null, from: info.app || d.file || '' }; });
  }
  async function approve(id, o) {
    const name = `${clean(o.name)} - ${code()}@2x.png`;
    const r = await call({ kind: 'imgApprove', id, name, folder: FOLDER[o.src] || FOLDER.eu, meta: JSON.stringify({ duyet: new Date().toISOString(), tu: o.name, thay: o.dropOld && o.replace ? o.replace.id : '' }) });
    if (o.dropOld && o.replace && o.replace.id) { try { await call({ kind: 'imgReject', id: o.replace.id, lydo: 'thay bằng ' + name }); } catch (e) { r.oldErr = e.message; } }
    try { if (root.PLS_IMAGES && root.PLS_IMAGES.refresh) await root.PLS_IMAGES.refresh(); } catch (e) {}
    return r;
  }
  const reject = (id, lydo) => call({ kind: 'imgReject', id, lydo: lydo || '' });

  // ---------- giao diện: khung "Ảnh chờ duyệt" (gắn vào tab Ảnh) ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function panel(host, onChange) {
    const box = document.createElement('details'); box.className = 'review';
    box.innerHTML = '<summary>Ảnh chờ duyệt</summary><div class="rv-body"><p class="muted">Đang tải…</p></div>';
    const body = box.querySelector('.rv-body');
    const load = async () => {
      body.innerHTML = '<p class="muted">Đang tải…</p>';
      let L; try { L = await list(); } catch (e) { body.innerHTML = `<p class="muted">Không tải được: ${esc(e.message)}</p>`; return; }
      box.querySelector('summary').textContent = `Ảnh chờ duyệt (${L.length})`;
      if (!L.length) { body.innerHTML = '<p class="muted">Không có ảnh nào đang chờ duyệt.</p>'; return; }
      body.innerHTML = '';
      for (const x of L) {
        const it = document.createElement('div'); it.className = 'issue';
        const url = root.PLS_IMAGES ? root.PLS_IMAGES.url(x.id, 240) : '';
        it.innerHTML = `<div class="row"><b>${esc(x.word)}</b><span class="pill">${x.src === 'as' ? 'Châu Á' : 'Châu Âu'}</span>${x.replace ? '<span class="pill vang">Đề xuất thay ảnh cũ</span>' : ''}</div>
          <img class="imgnow" alt="${esc(x.word)}" src="${esc(url)}">
          <span class="muted">${esc([x.vi && x.vi !== x.word ? 'Nghĩa: ' + x.vi : '', x.brand, x.lesson, x.slide ? 'slide ' + x.slide : '', x.t ? new Date(x.t).toLocaleString('vi-VN') : ''].filter(Boolean).join(' · '))}</span>`;
        if (x.replace && x.replace.id && root.PLS_IMAGES) it.insertAdjacentHTML('beforeend', `<span class="muted">Ảnh cũ trong kho: ${esc(x.replace.label || '')}</span><img class="imgnow" alt="Ảnh cũ" src="${esc(root.PLS_IMAGES.url(x.replace.id, 160))}">`);
        const row = document.createElement('div'); row.className = 'row';
        const nm = document.createElement('input'); nm.value = x.word; nm.setAttribute('aria-label', 'Tên ảnh trong kho (theo từ)');
        const sel = document.createElement('select'); sel.setAttribute('aria-label', 'Kho'); sel.innerHTML = '<option value="eu">Châu Âu</option><option value="as">Châu Á</option>'; sel.value = x.src;
        row.append(nm, sel); it.appendChild(row);
        let drop = null;
        if (x.replace && x.replace.id) { const lb = document.createElement('label'); lb.className = 'muted'; drop = document.createElement('input'); drop.type = 'checkbox'; drop.checked = true; lb.append(drop, ' Bỏ ảnh cũ khỏi kho'); it.appendChild(lb); }
        const act = document.createElement('div'); act.className = 'row';
        const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'btn primary'; ok.textContent = 'Duyệt vào kho';
        const no = document.createElement('button'); no.type = 'button'; no.className = 'btn'; no.textContent = 'Bỏ';
        const msg = document.createElement('span'); msg.className = 'muted';
        ok.onclick = async () => { if (!nm.value.trim()) { msg.textContent = 'Nhập tên ảnh'; return; } ok.disabled = no.disabled = true; msg.textContent = 'Đang duyệt…';
          try { await approve(x.id, { name: nm.value.trim(), src: sel.value, replace: x.replace, dropOld: drop && drop.checked }); msg.textContent = 'Đã vào kho.'; it.style.opacity = .5; onChange && onChange(); } catch (e) { msg.textContent = 'Lỗi: ' + e.message; ok.disabled = no.disabled = false; } };
        no.onclick = async () => { ok.disabled = no.disabled = true; msg.textContent = 'Đang bỏ…';
          try { await reject(x.id, 'người duyệt bỏ'); msg.textContent = 'Đã bỏ.'; it.style.opacity = .5; } catch (e) { msg.textContent = 'Lỗi: ' + e.message; ok.disabled = no.disabled = false; } };
        act.append(ok, no, msg); it.appendChild(act); body.appendChild(it);
      }
    };
    box.addEventListener('toggle', () => { if (box.open) load(); });
    host.appendChild(box); return box;
  }

  root.PLS_REVIEW = { submit, retry, list, approve, reject, panel, REGION, queued: () => st.queue.length };
  setTimeout(() => { if (st.queue.length) retry(); }, 5000);
})(typeof window !== 'undefined' ? window : globalThis);

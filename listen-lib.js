// AUDIO BÀI NGHE TẠO SẴN (29/10): tools/listen/gen_listen.py đọc S6-Nghe → web/audio/<khoá>/*.mp3 + index.json
// ({ "buổi|mã bài|tiêu đề đoạn": { file, secs, lines: [{ no, role, start, text }] } }); audio/index.json liệt kê các khoá.
// Máy nào mở bài cũng có audio ngay (không cần WebGPU). Gắn vào thanh phát của slide Listening / Dialogue qua _audio, _audio_len.
(function (root) {
  const BASE = 'audio/';
  let catalog = null; const libs = {}, bytes = {};
  const getJson = (u) => fetch(u, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
  async function lib(meta) {
    catalog = catalog || getJson(BASE + 'index.json');
    const cat = (await catalog) || { courses: [] };
    const c = cat.courses.find(x => (!x.level || x.level === meta.level) && (!x.name || String(meta.course || '').startsWith(x.name)));
    if (!c) return null;
    return (libs[c.dir] = libs[c.dir] || getJson(BASE + c.dir + '/index.json').then(items => items && { dir: c.dir, items }));
  }
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  // spec từ Excel: slide có data._listen (Listening) hoặc auto 'dlg' có listen → điền url + độ dài; trả về số đoạn tìm thấy
  async function apply(spec) {
    const L = await lib(spec.meta || {}); if (!L) return 0;
    let n = 0;
    for (const s of spec.slides || []) {
      const key = (s.data && s.data._listen) || s.listen, it = key && L.items[key];
      if (!it) continue;
      const url = BASE + L.dir + '/' + it.file, len = mmss(it.secs);
      if (s.data && s.data._listen) Object.assign(s.data, { _audio: url, _audio_len: len });
      else {   // lời bài: mốc từng câu để mỗi slide chỉ phát các câu nó hiện (khớp theo thứ tự + chữ của câu)
        const same = it.lines.length === (s.lines || []).length && it.lines.every((x, i) => String(x.text).trim() === String(s.lines[i].de).trim());
        Object.assign(s, { audio: url, audio_len: len, audio_marks: same ? it.lines : null });
      }
      n++;
    }
    return n;
  }
  const frag = (u) => { const m = /#t=([\d.]+),([\d.]+)$/.exec(u || ''); return m ? { base: u.slice(0, m.index), st: +m[1], en: +m[2] } : { base: u, st: 0, en: Infinity }; };
  async function fetchBytes(url) { return (bytes[url] = bytes[url] || fetch(url).then(r => { if (!r.ok) throw new Error('không tải được ' + url); return r.arrayBuffer(); }).then(b => new Uint8Array(b))); }
  // file cho PPTX: cả bài → MP3 gốc; một đoạn (url#t=a,b) → cắt đúng đoạn, ghi WAV 16-bit
  const cuts = {};
  function clipFile(url) {
    const f = frag(url);
    if (f.en === Infinity) return fetchBytes(url).then(b => ({ bytes: b, ext: 'mp3' }));
    return (cuts[url] = cuts[url] || fetchBytes(f.base).then(async b => {
      const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext, buf = await new Ctx(1, 24000, 24000).decodeAudioData(b.slice().buffer);
      const sr = buf.sampleRate, x = buf.getChannelData(0), a = Math.floor(f.st * sr), e = Math.min(x.length, Math.ceil(f.en * sr)), n = Math.max(0, e - a);
      const out = new DataView(new ArrayBuffer(44 + n * 2)), w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
      w(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
      out.setUint32(24, sr, true); out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++) { const v = Math.max(-1, Math.min(1, x[a + i])); out.setInt16(44 + i * 2, v * 32767, true); }
      return { bytes: new Uint8Array(out.buffer), ext: 'wav' };
    }));
  }

  // phát trên web: bấm ▶ / "Nghe lại" / thanh của thanh phát (trong khung slide đang xem); url#t=a,b chỉ phát từ a tới b
  let cur = null;
  function paint(bar, a, f) {
    const len = (Number.isFinite(f.en) ? f.en : a.duration) - f.st, pos = Math.max(0, a.currentTime - f.st), r = len > 0 ? Math.min(1, pos / len) : 0;
    const fill = bar.querySelector('[data-n="bar.fill"]'), dot = bar.querySelector('[data-n="bar.dot"]'), t = bar.querySelector('[data-n="time"]');
    if (fill) fill.style.width = (r * 100).toFixed(1) + '%';
    if (dot) dot.style.left = `calc(${(r * 100).toFixed(1)}% - 12px)`;
    if (t && len > 0) t.textContent = `${mmss(pos)} / ${mmss(len)}`;
  }
  document.addEventListener('click', (e) => {
    const bar = e.target.closest && e.target.closest('[data-n="audio"][data-audio]');
    if (!bar || !e.target.closest('[data-n="play"],[data-n="replay"],[data-n="bar"]')) return;
    e.preventDefault(); e.stopPropagation();
    const url = bar.dataset.audio, f = frag(url), onBar = e.target.closest('[data-n="bar"]'), replay = !!e.target.closest('[data-n="replay"]');
    if (cur && (cur.url !== url || cur.bar !== bar)) { cur.a.pause(); cur = null; }
    if (!cur) {
      const a = new Audio(f.base); cur = { a, url, bar };
      a.ontimeupdate = () => { if (a.currentTime >= f.en) { a.pause(); a.currentTime = f.en; } paint(bar, a, f); };
      a.onended = () => paint(bar, a, f);
    }
    const a = cur.a, end = () => (Number.isFinite(f.en) ? f.en : a.duration);
    if (onBar) { const r = bar.querySelector('[data-n="bar"]').getBoundingClientRect(); a.currentTime = f.st + (end() - f.st) * Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); if (a.paused) a.play(); return; }
    if (replay || a.currentTime < f.st || a.currentTime >= end() - 0.05) a.currentTime = f.st;
    if (replay || a.paused) a.play(); else a.pause();
  }, true);

  root.PLS_LISTEN = { apply, fetchBytes, clipFile, lib };
})(typeof window !== 'undefined' ? window : globalThis);

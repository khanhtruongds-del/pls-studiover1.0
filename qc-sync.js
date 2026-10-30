// QC SỬA TRÊN SLIDE → TẢI S5 / S6 ĐÃ SỬA (người dùng 28/10)
// Mỗi chỗ sửa tay trên slide (app.js · setSlot) được nhớ: chữ gốc → chữ mới. Bấm "Tải S5-S6 đã sửa":
//  1. mở lại đúng file Excel gốc đã nhập (giữ nguyên trong bộ nhớ / File gần đây),
//  2. tìm trong các dòng CỦA BUỔI ĐANG MỞ (cột Buổi) ô chứa chữ gốc → thay bằng chữ mới
//     (trùng cả ô → thay cả ô; nằm trong ô → thay đúng đoạn đó),
//  3. ghi thẳng vào XML của ô trong file .xlsx (không qua thư viện ghi) → giữ nguyên màu, cỡ cột, công thức, tab khác,
//  4. tải về tên cũ + "_QC" (thư mục Tải về của trình duyệt), báo ô nào đã ghi, chỗ nào không tìm thấy để QC tự sửa tay.
(function (root) {
  const S = v => v == null ? '' : String(v);
  const norm = v => S(v).replace(/\s+/g, ' ').trim();
  const bNum = v => { if (v == null || v === '') return NaN; if (typeof v === 'number') return v; const m = String(v).replace(/,/g, '.').match(/\d+(?:\.\d+)?/); return m ? Number(m[0]) : NaN; };
  const esc = t => S(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const unesc = t => S(t).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

  // ---------- zip tối giản (đọc deflate / store, ghi lại; chỉ nén lại file đã sửa) ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  async function pipe(bytes, Stream, kind) { const s = new Blob([bytes]).stream().pipeThrough(new Stream(kind)); return new Uint8Array(await new Response(s).arrayBuffer()); }
  function readZip(buf) {
    const u = new Uint8Array(buf), dv = new DataView(u.buffer, u.byteOffset, u.byteLength);
    let e = u.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--; if (e < 0) throw new Error('file không phải .xlsx');
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const out = [];
    for (let i = 0; i < n; i++) {
      const method = dv.getUint16(p + 10, true), time = dv.getUint16(p + 12, true), date = dv.getUint16(p + 14, true), crc = dv.getUint32(p + 16, true), csz = dv.getUint32(p + 20, true), usz = dv.getUint32(p + 24, true);
      const fl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const nameB = u.slice(p + 46, p + 46 + fl), name = new TextDecoder().decode(nameB);
      const lfl = dv.getUint16(off + 26, true), lxl = dv.getUint16(off + 28, true), ds = off + 30 + lfl + lxl;
      out.push({ name, nameB, method, time, date, crc, csz, usz, raw: u.slice(ds, ds + csz) });
      p += 46 + fl + xl + cl;
    }
    return out;
  }
  async function getText(ent) { const b = ent.method === 0 ? ent.raw : await pipe(ent.raw, DecompressionStream, 'deflate-raw'); return new TextDecoder().decode(b); }
  async function setText(ent, txt) { const b = new TextEncoder().encode(txt); ent.raw = await pipe(b, CompressionStream, 'deflate-raw'); ent.method = 8; ent.crc = crc32(b); ent.csz = ent.raw.length; ent.usz = b.length; }
  function writeZip(ents) {
    const parts = [], cen = []; let off = 0;
    const h = (n, f) => { const b = new Uint8Array(n); f(new DataView(b.buffer)); return b; };
    for (const e of ents) {
      const lh = h(30, d => { d.setUint32(0, 0x04034b50, true); d.setUint16(4, 20, true); d.setUint16(6, 0x0800, true); d.setUint16(8, e.method, true); d.setUint16(10, e.time, true); d.setUint16(12, e.date, true); d.setUint32(14, e.crc, true); d.setUint32(18, e.csz, true); d.setUint32(22, e.usz, true); d.setUint16(26, e.nameB.length, true); });
      parts.push(lh, e.nameB, e.raw);
      cen.push(h(46, d => { d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint16(8, 0x0800, true); d.setUint16(10, e.method, true); d.setUint16(12, e.time, true); d.setUint16(14, e.date, true); d.setUint32(16, e.crc, true); d.setUint32(20, e.csz, true); d.setUint32(24, e.usz, true); d.setUint16(28, e.nameB.length, true); d.setUint32(42, off, true); }), e.nameB);
      off += 30 + e.nameB.length + e.raw.length;
    }
    const csz = cen.reduce((a, b) => a + b.length, 0);
    const end = h(22, d => { d.setUint32(0, 0x06054b50, true); d.setUint16(8, ents.length, true); d.setUint16(10, ents.length, true); d.setUint32(12, csz, true); d.setUint32(16, off, true); });
    return new Blob([...parts, ...cen, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ---------- tìm ô cần thay ----------
  // edits: [{old, new}] · chỉ tab có cột Buổi, chỉ dòng có Buổi = buổi đang mở
  // QUÉT (chưa sửa): mọi ô chữ thuộc buổi đang mở có chứa chữ gốc của từng chỗ sửa → ghi lại loại khớp (trùng nguyên ô / nằm trong ô, số lần)
  function scanCells(wb, XLSX, kind, buoi, edits) {
    const res = [];
    for (const name of wb.SheetNames) {
      if (kind === 's5' ? /^S6-/.test(name) : !/^S6-/.test(name)) continue;   // S5: tab S5 + Hướng dẫn giảng dạy… (tab nào có cột Buổi) · S6: các tab S6-…
      const ws = wb.Sheets[name]; if (!ws || !ws['!ref']) continue;
      const R = XLSX.utils.decode_range(ws['!ref']), at = (r, c) => ws[XLSX.utils.encode_cell({ r, c })];
      const filled = r => { let k = 0; for (let c = R.s.c; c <= R.e.c; c++) { const x = at(r, c); if (x && x.v != null && S(x.v).trim() !== '') k++; } return k; };
      let hr = -1; for (let r = R.s.r; r <= R.e.r; r++) if (filled(r) >= 2) { hr = r; break; } if (hr < 0) continue;
      let bc = -1; for (let c = R.s.c; c <= R.e.c; c++) { const x = at(hr, c); if (x && S(x.v).trim() === 'Buổi') bc = c; } if (bc < 0) continue;
      const head = c => { const x = at(hr, c); return x ? S(x.v).trim() : ''; };
      for (let r = hr + 1; r <= R.e.r; r++) {
        const b = at(r, bc); if (!b || bNum(b.v) !== bNum(buoi)) continue;
        for (let c = R.s.c; c <= R.e.c; c++) {
          if (c === bc) continue; const x = at(r, c); if (!x || x.f || x.t !== 's') continue;   // chỉ ô chữ, không đụng công thức
          const v = S(x.v), m = [];
          for (const e of edits) {
            const o = S(e.old).trim(); if (!o) continue;
            if (v.trim() === o || norm(v) === norm(o)) m.push({ e, kind: 'exact', n: 1 });
            else if (o.length >= 2) { const n = v.split(o).length - 1 || norm(v).split(norm(o)).length - 1; if (n > 0) m.push({ e, kind: 'sub', n }); }
          }
          if (m.length) res.push({ sheet: name, ref: XLSX.utils.encode_cell({ r, c }), col: head(c), before: v, m });
        }
      }
    }
    return res;
  }
  // CHỌN Ô SẼ GHI (người dùng 28/10: sửa 1 nghĩa ngắn từng làm đổi 27 ô): trùng nguyên ô → thay các ô đó; không có thì chỉ thay khi chữ gốc nằm trong
  // đúng 1 ô, 1 lần; còn lại để QC sửa tay (báo số ô). scans: kết quả scanCells của CẢ S5 và S6 → đếm chung.
  function decide(edits, scans) {
    const all = scans.flat();
    for (const e of edits) {
      const ex = all.filter(c => c.m.some(x => x.e === e && x.kind === 'exact')), sub = all.filter(c => c.m.some(x => x.e === e && x.kind === 'sub'));
      const occ = sub.reduce((a, c) => a + c.m.find(x => x.e === e).n, 0);
      e.use = ex.length ? new Set(ex) : sub.length === 1 && occ === 1 ? new Set(sub) : new Set();
      e.why = e.use.size ? '' : sub.length ? `chữ gốc nằm trong ${sub.length} ô (${occ} chỗ) – không tự thay để tránh đổi nhầm, sửa tay` : 'không tìm thấy nguyên văn trong Excel';
    }
  }
  function planCells(scan, XLSX) {
    const res = [];
    for (const c of scan) {
      let v = c.before;
      for (const x of c.m) {
        const e = x.e; if (!e.use || !e.use.has(c)) continue; const o = S(e.old).trim();
        if (x.kind === 'exact') v = e.new; else v = v.includes(o) ? v.split(o).join(e.new) : norm(v).split(norm(o)).join(e.new);
        e.hits.push(c.sheet + '!' + c.ref);
      }
      if (v !== c.before) res.push({ sheet: c.sheet, ref: c.ref, col: c.col, before: c.before, after: v });
    }
    return res;
  }
  // CỘT "Ảnh Drive" (người dùng 28/10): ảnh QC đã chọn cho từng từ → ghi link Drive (hoặc '-' = bỏ ảnh) vào cột riêng của các tab S6 có từ / nghĩa,
  // lần sau Nhập Excel đọc lại cột này (app.js · seedPicks) → giữ đúng ảnh đã chọn. Cột chưa có thì thêm vào cuối bảng.
  const IMG_COL = 'Ảnh Drive';
  // người dùng 29/10: ô ghi LINK Drive đầy đủ (bấm mở được) thay vì mã 'id:…'; '-' = bỏ ảnh. Nhập lại vẫn đọc được cả 2 kiểu (app.js · seedPicks)
  const driveLink = v => { const m = S(v).match(/^id:(\S+)$/); return m ? `https://drive.google.com/file/d/${m[1]}/view` : S(v); };
  function planImgCells(wb, XLSX, buoi, pickedFor) {
    const res = [];
    for (const name of wb.SheetNames) {
      if (!/^S6-/.test(name)) continue;
      const ws = wb.Sheets[name]; if (!ws || !ws['!ref']) continue;
      const R = XLSX.utils.decode_range(ws['!ref']), at = (r, c) => ws[XLSX.utils.encode_cell({ r, c })];
      const filled = r => { let k = 0; for (let c = R.s.c; c <= R.e.c; c++) { const x = at(r, c); if (x && x.v != null && S(x.v).trim() !== '') k++; } return k; };
      let hr = -1; for (let r = R.s.r; r <= R.e.r; r++) if (filled(r) >= 2) { hr = r; break; } if (hr < 0) continue;
      const col = {}; let last = R.s.c; for (let c = R.s.c; c <= R.e.c; c++) { const x = at(hr, c); const h = x ? S(x.v).trim() : ''; if (h) { col[h] = c; last = c; } }
      const words = ['Nghĩa', 'Từ', 'Hán tự', 'Chữ / âm', 'Câu'].filter(h => col[h] != null);
      if (col['Buổi'] == null || !words.length) continue;
      const ic = col[IMG_COL] != null ? col[IMG_COL] : last + 1; let any = false;
      for (let r = hr + 1; r <= R.e.r; r++) {
        const b = at(r, col['Buổi']); if (!b || bNum(b.v) !== bNum(buoi)) continue;
        let v = null; for (const h of words) { const x = at(r, col[h]); const w = x ? norm(x.v) : ''; if (w && (v = pickedFor(w))) break; }
        if (!v) continue; v = driveLink(v); const cur = at(r, ic), before = cur ? S(cur.v) : '';
        if (before.trim() === v) continue;   // ô cũ dạng 'id:…' (cùng ảnh) vẫn ghi lại thành link
        res.push({ sheet: name, ref: XLSX.utils.encode_cell({ r, c: ic }), col: IMG_COL, before, after: v, img: true }); any = true;
      }
      // mọi buổi: ô 'id:…' còn sót từ bản tải trước → đổi sang link Drive (người dùng 29/10: thống nhất một dạng link)
      if (col[IMG_COL] != null) for (let r = hr + 1; r <= R.e.r; r++) { const cur = at(r, ic), before = cur ? S(cur.v).trim() : '', ref = XLSX.utils.encode_cell({ r, c: ic });
        if (/^id:\S+$/.test(before) && !res.some(x => x.sheet === name && x.ref === ref)) { res.push({ sheet: name, ref, col: IMG_COL, before, after: driveLink(before), img: true }); any = true; } }
      if (any && col[IMG_COL] == null) res.push({ sheet: name, ref: XLSX.utils.encode_cell({ r: hr, c: ic }), col: IMG_COL, before: '', after: IMG_COL, img: true });
    }
    return res;
  }
  // ô chưa có trong XML → chèn vào đúng hàng, đúng thứ tự cột
  function insertCell(xml, ref, val) {
    const m = ref.match(/^([A-Z]+)(\d+)$/); if (!m) return null;
    const colN = t => t.split('').reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0), want = colN(m[1]);
    const mk = st => `<c r="${ref}"${st ? ` s="${st}"` : ''} t="inlineStr"><is><t xml:space="preserve">${esc(val)}</t></is></c>`;   // chép kiểu ô (s=) của ô bên trái cùng hàng → cột mới cùng định dạng
    const re = new RegExp('<row\\b[^>]*\\br="' + m[2] + '"[^>]*?(\\/>|>([\\s\\S]*?)<\\/row>)');
    const rm = xml.match(re); if (!rm) return null;
    let row;
    if (rm[1] === '/>') row = rm[0].replace(/\/>$/, '>' + mk('') + '</row>');
    else {
      const open = rm[0].slice(0, rm[0].indexOf('>') + 1), body = rm[2];
      let pos = body.length, st = ''; const cre = /<c\b([^>]*)\br="([A-Z]+)\d+"([^>]*)/g; let x;
      while ((x = cre.exec(body))) { if (colN(x[2]) > want) { pos = x.index; break; } st = ((x[1] + x[3]).match(/\bs="(\d+)"/) || [])[1] || st; }
      row = open + body.slice(0, pos) + mk(st) + body.slice(pos) + '</row>';
    }
    return xml.replace(re, () => row);
  }
  // ghi ô vào XML sheet (chuỗi nội tuyến, giữ style s="…")
  function patchSheetXml(xml, ref, val) {
    const re = new RegExp('<c\\b([^>]*?)\\br="' + ref + '"([^>]*?)(\\/>|>[\\s\\S]*?<\\/c>)');
    const m = xml.match(re); if (!m) return null;
    const attrs = (m[1] + m[2]).replace(/\s*\bt="[^"]*"/g, '').replace(/\s*\/$/, '');
    const cell = `<c r="${ref}"${attrs.replace(/^\s*/, ' ').replace(/^ $/, '')} t="inlineStr"><is><t xml:space="preserve">${esc(val)}</t></is></c>`;
    return xml.replace(re, () => cell);
  }
  async function sheetPaths(ents) {
    const get = n => ents.find(e => e.name === n);
    const wbx = await getText(get('xl/workbook.xml')), rel = await getText(get('xl/_rels/workbook.xml.rels'));
    const rid = {}; rel.replace(/<Relationship\b[^>]*>/g, t => { const id = (t.match(/\bId="([^"]+)"/) || [])[1], tg = (t.match(/\bTarget="([^"]+)"/) || [])[1]; if (id && tg) rid[id] = tg.startsWith('/') ? tg.slice(1) : 'xl/' + tg.replace(/^\.\//, ''); return t; });
    const out = {}; wbx.replace(/<sheet\b[^>]*>/g, t => { const n = (t.match(/\bname="([^"]+)"/) || [])[1], id = (t.match(/\br:id="([^"]+)"/) || t.match(/\bid="([^"]+)"/) || [])[1]; if (n && rid[id]) out[unesc(n)] = rid[id]; return t; });
    return out;
  }
  // ---------- 1 file ----------
  // DANH SÁCH THẢ XUỐNG (người dùng 29/10: "chọn thay vì gõ tay" – giảm sai dữ liệu): cột Lên PPT / Lên App / Lên PDF → Có, Không;
  // cột Loại / Loại từ / Nhóm / Dạng câu → các giá trị đang có trong cột (≤ 30). Chỉ thêm khi sheet chưa có dataValidations; không đụng ô nào.
  function addLists(xml, rows, XLSX) {
    if (/<dataValidations\b/.test(xml) || !rows || !rows.length) return xml;
    const hi = rows.findIndex(r => r.filter(c => c !== null && c !== '').length >= 2); if (hi < 0) return xml;
    const head = rows[hi].map(c => S(c).trim()), last = rows.length + 200, dv = [];
    head.forEach((h, ci) => { let opts = null;
      if (/^Lên (PPT|App|PDF)$/i.test(h)) opts = ['Có', 'Không'];
      else if (/^(Loại|Loại từ|Nhóm|Dạng câu|Kỹ năng|Trên lớp)$/i.test(h)) { const v = [...new Set(rows.slice(hi + 1).map(r => S(r[ci]).trim()).filter(x => x && x.length <= 40 && !/[",]/.test(x)))]; if (v.length >= 2 && v.length <= 30 && v.join(',').length < 250) opts = v; }
      if (!opts) return; const col = XLSX.utils.encode_col(ci), sq = `${col}${hi + 2}:${col}${last}`;
      dv.push(`<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorStyle="warning" errorTitle="Giá trị lạ" error="Nên chọn trong danh sách" sqref="${sq}"><formula1>"${esc(opts.join(','))}"</formula1></dataValidation>`); });
    if (!dv.length) return xml;
    const blk = `<dataValidations count="${dv.length}">${dv.join('')}</dataValidations>`;
    // vị trí theo chuẩn OOXML: sau conditionalFormatting / trước hyperlinks, printOptions, pageMargins…
    const m = xml.match(/<(hyperlinks|printOptions|pageMargins|pageSetup|headerFooter|rowBreaks|colBreaks|customProperties|cellWatches|ignoredErrors|smartTags|drawing|legacyDrawing|picture|oleObjects|controls|webPublishItems|tableParts|extLst)\b/);
    return m ? xml.replace(m[0], blk + m[0]) : xml.replace('</worksheet>', blk + '</worksheet>');
  }
  // Ô SỬA TRONG BẢNG DỮ LIỆU GỐC (data-src.js · book.cellEdits): biết đúng sheet + dòng Excel + tên cột → ghi thẳng ô đó; cột chưa có (Bước S5, Nguồn S6) thêm cuối bảng
  function planCellEdits(wb, XLSX, ce) {
    const res = [], added = {};
    for (const e of ce || []) { const ws = wb.Sheets[e.sh]; if (!ws || !ws['!ref']) continue;
      const R = XLSX.utils.decode_range(ws['!ref']), at = (r, c) => ws[XLSX.utils.encode_cell({ r, c })];
      const filled = r => { let k = 0; for (let c = R.s.c; c <= R.e.c; c++) { const x = at(r, c); if (x && x.v != null && S(x.v).trim() !== '') k++; } return k; };
      let hr = -1; for (let r = R.s.r; r <= R.e.r; r++) if (filled(r) >= 2) { hr = r; break; } if (hr < 0) continue;
      const col = {}; let last = R.s.c; for (let c = R.s.c; c <= R.e.c; c++) { const x = at(hr, c); const h = x ? S(x.v).trim() : ''; if (h) { col[h] = c; last = c; } }
      const A = added[e.sh] = added[e.sh] || {}; let c = col[e.key] != null ? col[e.key] : A[e.key];
      if (c == null) { c = last + 1 + Object.keys(A).length; A[e.key] = c; res.push({ sheet: e.sh, ref: XLSX.utils.encode_cell({ r: hr, c }), col: e.key, before: '', after: e.key, ce: true }); }
      res.push({ sheet: e.sh, ref: XLSX.utils.encode_cell({ r: e.r - 1, c }), col: e.key, before: '', after: S(e.val), ce: true }); }
    return res;
  }
  async function applyFile(file, kind, buoi, edits, XLSX, pickedFor, scan, cellEd) {
    const wb = XLSX.read(file.buf, { type: 'array', cellFormula: true });
    const cells = planCells(scan || [], XLSX).concat(kind === 's6' && pickedFor ? planImgCells(wb, XLSX, buoi, pickedFor) : [], planCellEdits(wb, XLSX, cellEd));
    const ents = readZip(file.buf), paths = await sheetPaths(ents), bad = [];
    for (const [sh, pth] of Object.entries(paths)) { const ent = ents.find(e => e.name === pth); if (!ent || !wb.Sheets[sh]) continue; const x0 = await getText(ent), x1 = addLists(x0, XLSX.utils.sheet_to_json(wb.Sheets[sh], { header: 1, defval: null, raw: true }), XLSX); if (x1 !== x0) await setText(ent, x1); }
    const bySheet = {}; cells.forEach(c => (bySheet[c.sheet] = bySheet[c.sheet] || []).push(c));
    for (const [sh, cs] of Object.entries(bySheet)) {
      const ent = ents.find(e => e.name === paths[sh]); if (!ent) { bad.push(...cs); continue; }
      let xml = await getText(ent);
      for (const c of cs) {
        let x = null;
        if (c.img) {   // cột Ảnh Drive: ô trống có sẵn (kiểu mặc định) bỏ đi rồi chèn lại theo kiểu ô bên trái → cùng định dạng tiêu đề / dữ liệu
          const empty = new RegExp('<c\\b[^>]*\\br="' + c.ref + '"[^>]*?(\\/>|>\\s*<\\/c>)'); const y = xml.replace(empty, '');
          x = insertCell(y, c.ref, c.after);
        }
        if (x == null) x = patchSheetXml(xml, c.ref, c.after);
        if (x == null && c.ce) x = insertCell(xml, c.ref, c.after);
        if (x == null) bad.push(c); else xml = x;
      }
      await setText(ent, xml);
    }
    const ce = ents.find(e => e.name === 'xl/calcChain.xml'); // không đụng công thức → giữ calcChain
    return { cells: cells.filter(c => !bad.includes(c)), bad, blob: writeZip(ents), ce: !!ce };
  }
  const outName = n => S(n).replace(/(_QC)?\.xls[xm]?$/i, '') + '_QC.xlsx';
  function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }

  // ---------- nút + hộp báo ----------
  const I = () => root.PLS && root.PLS._int, st = () => (I() || {}).state || {};
  function list() { return Object.entries(st().qcEdits || {}).map(([id, e]) => Object.assign({ id, hits: [] }, e)); }
  function refresh() { const b = document.getElementById('btnQcXlsx'); if (!b) return; const s = st(), n = list().length + (((s.book || {}).cellEdits || []).length); b.hidden = !s.book; b.textContent = n ? `Tải S5-S6 đã sửa (${n})` : 'Tải S5-S6 đã sửa'; b.disabled = false; b.title = n ? `Ghi ${n} chỗ sửa tay trên slide về đúng ô trong file S5 / S6 gốc của buổi đang mở rồi tải về (thư mục Tải về). Định dạng file giữ nguyên.` : 'Chưa có chỗ sửa tay nào trên slide. Bấm vào chữ trên slide để sửa, rồi bấm nút này để ghi về S5 / S6.'; }
  async function exportQc() {
    const s = st(), X = root.XLSX, setStatus = (I() || {}).setStatus || (() => {});
    const edits = list(), IM = root.PLS_IMAGES, src = IM && IM.srcOfBrand ? IM.srcOfBrand(s.brand) : null;
    // ảnh đang hiện trên slide (tự gắn khi nhập + QC chọn) theo từ → cột "Ảnh Drive"; ảnh QC chọn được ưu tiên (người dùng 28/10: nhập xong là tải được, không phải chờ sửa)
    const nk = w => S(w).normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim(), onSlide = {};
    (s.slides || []).forEach(r => (r.images || []).forEach(im => { if (!im || !im.word) return; const k = nk(im.word); if (im.type === 'removed') onSlide[k] = onSlide[k] || '-'; else if (im.id && !/^(data:|blob:)/.test(im.id) && /exact|variant|synonym|user|near/.test(im.type)) onSlide[k] = onSlide[k] || 'id:' + im.id; }));
    const pickedFor = w => (src && IM.picked && IM.picked(src, w)) || onSlide[nk(w)] || null;
    let files = s.srcFiles || {}, rebuilt = false;
    if (!files.s5 && !files.s6) {   // bài mở từ File gần đây cũ (chưa lưu file gốc): dựng lại S5 / S6 từ dữ liệu đã lưu để vẫn xuất được (mất định dạng màu / độ rộng cột)
      const names = String(s.recentId || '').split(' + '), nm = k => names.find(n => new RegExp('_' + k + '[_.]', 'i').test(n)) || ('Bai_' + k.toUpperCase() + '.xlsx');
      const mk = book => { const wb = X.utils.book_new(); for (const [sh, rows] of Object.entries(book || {})) { if (!rows || !rows.length) continue; X.utils.book_append_sheet(wb, X.utils.json_to_sheet(rows), sh.slice(0, 31)); } return wb.SheetNames.length ? X.write(wb, { type: 'array', bookType: 'xlsx' }) : null; };
      files = {}; for (const k of ['s5', 's6']) { const buf = s.book && mk(s.book[k]); if (buf) files[k] = { name: nm(k), buf }; }
      if (!files.s5 && !files.s6) { setStatus('Không có dữ liệu S5 / S6 để xuất – bấm "Nhập Excel (S5 + S6)" chọn lại 2 file.'); return; }
      s.srcFiles = files; rebuilt = true;
    }
    const buoi = +(document.getElementById('buoi') || {}).value || 1; const rs = [], zipFiles = [];
    setStatus('Đang ghi bản sửa vào S5 / S6…');
    const scans = {}; for (const kind of ['s6', 's5']) if (files[kind]) scans[kind] = scanCells(X.read(files[kind].buf, { type: 'array', cellFormula: true }), X, kind, buoi, edits);
    decide(edits, Object.values(scans));
    for (const kind of ['s6', 's5']) {
      const f = files[kind]; if (!f) continue;
      const orig = f.name, r = await applyFile(f, kind, buoi, edits, X, pickedFor, scans[kind], rebuilt ? [] : ((s.book || {}).cellEdits || []).filter(e => e.kind === kind));   /* dựng lại từ dữ liệu: ô sửa đã nằm sẵn trong dữ liệu */ const out = r.blob ? outName(f.name) : '';
      if (r.blob) {
        zipFiles.push([out, new Uint8Array(await r.blob.arrayBuffer())]);
        // dùng luôn bản mới cho lần tải sau (sửa tiếp / buổi khác cộng dồn)
        const buf = await r.blob.arrayBuffer(); f.buf = buf; f.name = out;
        try { s.book[kind] = root.PLS_IMPORT.readWorkbook(X.read(buf, { type: 'array' }), X); } catch (e) { console.warn('[PLS_QC] đọc lại', e); }
      }
      rs.push({ name: orig, out, cells: r.cells });
    }
    const done = edits.filter(e => e.hits.length), miss = edits.filter(e => !e.hits.length);
    done.forEach(e => delete s.qcEdits[e.id]);
    if (s.book) s.book.cellEdits = [];   // ô sửa trong bảng Dữ liệu gốc đã ghi vào file   // đã ghi → bỏ khỏi danh sách chờ (chữ trên slide vẫn giữ)
    try { const names = [s.srcFiles.s6, s.srcFiles.s5].filter(Boolean).map(x => x.name); if (I().saveRecent) await I().saveRecent(s.book, names, s.srcFiles); } catch (e) { /* bỏ qua */ }
    // người dùng 29/10: tải 1 file .zip gồm S5 + S6 (đúng định dạng file gốc, chỉ thêm cột Ảnh Drive); không hiện danh sách ô đã ghi
    let zipName = '';
    if (zipFiles.length) { const base = zipFiles.map(z => z[0]).find(n => /_S6/i.test(n)) || zipFiles[0][0];
      zipName = base.replace(/_S[56]/i, '_S5-S6').replace(/\.xlsx$/i, '') + '.zip';
      download(new Blob([root.PPTX.zip(zipFiles)], { type: 'application/zip' }), zipName); }
    refresh();
    if (rebuilt) setTimeout(() => setStatus('Lưu ý: bài mở từ File gần đây cũ nên S5 / S6 được dựng lại từ dữ liệu (mất định dạng màu / độ rộng cột). Lần sau Nhập Excel lại để app lưu file gốc.'), 4000);
    setStatus(`Đã ghi ${rs.reduce((a, r) => a + r.cells.length, 0)} ô vào S5 / S6 · tải ${zipName || 'không file nào'}` + (miss.length ? ` · ${miss.length} chỗ không tìm thấy` : ''));
    return { files: rs.map(r => ({ out: r.out, cells: r.cells.length })), missing: miss.length };
  }
  function init() { const b = document.getElementById('btnQcXlsx'); if (b) b.onclick = () => exportQc().catch(e => { console.error(e); ((I() || {}).setStatus || alert)('Tải S5-S6 lỗi: ' + e.message); }); refresh(); }
  root.PLS_QC = { planImgCells, insertCell, exportQc, refresh, planCells, scanCells, decide, patchSheetXml, readZip, writeZip, applyFile, outName };
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init(); }
})(typeof window !== 'undefined' ? window : globalThis);

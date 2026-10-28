// node: {k:'group'|'shape'|'text'|'img', id, name, x,y,w,h, op, kids, shape, segs, ah, av, auto, png}
(function (root) {
  // Theme: bỏ Aptos (không có sẵn trên Mac/Keynote/Google Slides) và danh sách font Windows theo ngôn ngữ (等线, 游ゴシック…) → Keynote không báo thiếu font
  const THEME_SAFE_FN = x => x.replace(/typeface="Aptos( Display)?"( panose="[0-9A-F]+")?/g, 'typeface="Arial"').replace(/<a:font script="[^"]*" typeface="[^"]*"\s*\/>/g, '');
  const THEME_XML = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<a:theme xmlns:a=\"http://schemas.openxmlformats.org/drawingml/2006/main\" name=\"Office Theme\"><a:themeElements><a:clrScheme name=\"Office\"><a:dk1><a:sysClr val=\"windowText\" lastClr=\"000000\"/></a:dk1><a:lt1><a:sysClr val=\"window\" lastClr=\"FFFFFF\"/></a:lt1><a:dk2><a:srgbClr val=\"0E2841\"/></a:dk2><a:lt2><a:srgbClr val=\"E8E8E8\"/></a:lt2><a:accent1><a:srgbClr val=\"156082\"/></a:accent1><a:accent2><a:srgbClr val=\"E97132\"/></a:accent2><a:accent3><a:srgbClr val=\"196B24\"/></a:accent3><a:accent4><a:srgbClr val=\"0F9ED5\"/></a:accent4><a:accent5><a:srgbClr val=\"A02B93\"/></a:accent5><a:accent6><a:srgbClr val=\"4EA72E\"/></a:accent6><a:hlink><a:srgbClr val=\"467886\"/></a:hlink><a:folHlink><a:srgbClr val=\"96607D\"/></a:folHlink></a:clrScheme><a:fontScheme name=\"Office\"><a:majorFont><a:latin typeface=\"Aptos Display\" panose=\"02110004020202020204\"/><a:ea typeface=\"\"/><a:cs typeface=\"\"/><a:font script=\"Jpan\" typeface=\"\u6e38\u30b4\u30b7\u30c3\u30af Light\"/><a:font script=\"Hang\" typeface=\"\ub9d1\uc740 \uace0\ub515\"/><a:font script=\"Hans\" typeface=\"\u7b49\u7ebf Light\"/><a:font script=\"Hant\" typeface=\"\u65b0\u7d30\u660e\u9ad4\"/><a:font script=\"Arab\" typeface=\"Times New Roman\"/><a:font script=\"Hebr\" typeface=\"Times New Roman\"/><a:font script=\"Thai\" typeface=\"Angsana New\"/><a:font script=\"Ethi\" typeface=\"Nyala\"/><a:font script=\"Beng\" typeface=\"Vrinda\"/><a:font script=\"Gujr\" typeface=\"Shruti\"/><a:font script=\"Khmr\" typeface=\"MoolBoran\"/><a:font script=\"Knda\" typeface=\"Tunga\"/><a:font script=\"Guru\" typeface=\"Raavi\"/><a:font script=\"Cans\" typeface=\"Euphemia\"/><a:font script=\"Cher\" typeface=\"Plantagenet Cherokee\"/><a:font script=\"Yiii\" typeface=\"Microsoft Yi Baiti\"/><a:font script=\"Tibt\" typeface=\"Microsoft Himalaya\"/><a:font script=\"Thaa\" typeface=\"MV Boli\"/><a:font script=\"Deva\" typeface=\"Mangal\"/><a:font script=\"Telu\" typeface=\"Gautami\"/><a:font script=\"Taml\" typeface=\"Latha\"/><a:font script=\"Syrc\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Orya\" typeface=\"Kalinga\"/><a:font script=\"Mlym\" typeface=\"Kartika\"/><a:font script=\"Laoo\" typeface=\"DokChampa\"/><a:font script=\"Sinh\" typeface=\"Iskoola Pota\"/><a:font script=\"Mong\" typeface=\"Mongolian Baiti\"/><a:font script=\"Viet\" typeface=\"Times New Roman\"/><a:font script=\"Uigh\" typeface=\"Microsoft Uighur\"/><a:font script=\"Geor\" typeface=\"Sylfaen\"/><a:font script=\"Armn\" typeface=\"Arial\"/><a:font script=\"Bugi\" typeface=\"Leelawadee UI\"/><a:font script=\"Bopo\" typeface=\"Microsoft JhengHei\"/><a:font script=\"Java\" typeface=\"Javanese Text\"/><a:font script=\"Lisu\" typeface=\"Segoe UI\"/><a:font script=\"Mymr\" typeface=\"Myanmar Text\"/><a:font script=\"Nkoo\" typeface=\"Ebrima\"/><a:font script=\"Olck\" typeface=\"Nirmala UI\"/><a:font script=\"Osma\" typeface=\"Ebrima\"/><a:font script=\"Phag\" typeface=\"Phagspa\"/><a:font script=\"Syrn\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Syrj\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Syre\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Sora\" typeface=\"Nirmala UI\"/><a:font script=\"Tale\" typeface=\"Microsoft Tai Le\"/><a:font script=\"Talu\" typeface=\"Microsoft New Tai Lue\"/><a:font script=\"Tfng\" typeface=\"Ebrima\"/></a:majorFont><a:minorFont><a:latin typeface=\"Aptos\" panose=\"02110004020202020204\"/><a:ea typeface=\"\"/><a:cs typeface=\"\"/><a:font script=\"Jpan\" typeface=\"\u6e38\u30b4\u30b7\u30c3\u30af\"/><a:font script=\"Hang\" typeface=\"\ub9d1\uc740 \uace0\ub515\"/><a:font script=\"Hans\" typeface=\"\u7b49\u7ebf\"/><a:font script=\"Hant\" typeface=\"\u65b0\u7d30\u660e\u9ad4\"/><a:font script=\"Arab\" typeface=\"Arial\"/><a:font script=\"Hebr\" typeface=\"Arial\"/><a:font script=\"Thai\" typeface=\"Cordia New\"/><a:font script=\"Ethi\" typeface=\"Nyala\"/><a:font script=\"Beng\" typeface=\"Vrinda\"/><a:font script=\"Gujr\" typeface=\"Shruti\"/><a:font script=\"Khmr\" typeface=\"DaunPenh\"/><a:font script=\"Knda\" typeface=\"Tunga\"/><a:font script=\"Guru\" typeface=\"Raavi\"/><a:font script=\"Cans\" typeface=\"Euphemia\"/><a:font script=\"Cher\" typeface=\"Plantagenet Cherokee\"/><a:font script=\"Yiii\" typeface=\"Microsoft Yi Baiti\"/><a:font script=\"Tibt\" typeface=\"Microsoft Himalaya\"/><a:font script=\"Thaa\" typeface=\"MV Boli\"/><a:font script=\"Deva\" typeface=\"Mangal\"/><a:font script=\"Telu\" typeface=\"Gautami\"/><a:font script=\"Taml\" typeface=\"Latha\"/><a:font script=\"Syrc\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Orya\" typeface=\"Kalinga\"/><a:font script=\"Mlym\" typeface=\"Kartika\"/><a:font script=\"Laoo\" typeface=\"DokChampa\"/><a:font script=\"Sinh\" typeface=\"Iskoola Pota\"/><a:font script=\"Mong\" typeface=\"Mongolian Baiti\"/><a:font script=\"Viet\" typeface=\"Arial\"/><a:font script=\"Uigh\" typeface=\"Microsoft Uighur\"/><a:font script=\"Geor\" typeface=\"Sylfaen\"/><a:font script=\"Armn\" typeface=\"Arial\"/><a:font script=\"Bugi\" typeface=\"Leelawadee UI\"/><a:font script=\"Bopo\" typeface=\"Microsoft JhengHei\"/><a:font script=\"Java\" typeface=\"Javanese Text\"/><a:font script=\"Lisu\" typeface=\"Segoe UI\"/><a:font script=\"Mymr\" typeface=\"Myanmar Text\"/><a:font script=\"Nkoo\" typeface=\"Ebrima\"/><a:font script=\"Olck\" typeface=\"Nirmala UI\"/><a:font script=\"Osma\" typeface=\"Ebrima\"/><a:font script=\"Phag\" typeface=\"Phagspa\"/><a:font script=\"Syrn\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Syrj\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Syre\" typeface=\"Estrangelo Edessa\"/><a:font script=\"Sora\" typeface=\"Nirmala UI\"/><a:font script=\"Tale\" typeface=\"Microsoft Tai Le\"/><a:font script=\"Talu\" typeface=\"Microsoft New Tai Lue\"/><a:font script=\"Tfng\" typeface=\"Ebrima\"/></a:minorFont></a:fontScheme><a:fmtScheme name=\"Office\"><a:fillStyleLst><a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill><a:gradFill rotWithShape=\"1\"><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:lumMod val=\"110000\"/><a:satMod val=\"105000\"/><a:tint val=\"67000\"/></a:schemeClr></a:gs><a:gs pos=\"50000\"><a:schemeClr val=\"phClr\"><a:lumMod val=\"105000\"/><a:satMod val=\"103000\"/><a:tint val=\"73000\"/></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:lumMod val=\"105000\"/><a:satMod val=\"109000\"/><a:tint val=\"81000\"/></a:schemeClr></a:gs></a:gsLst><a:lin ang=\"5400000\" scaled=\"0\"/></a:gradFill><a:gradFill rotWithShape=\"1\"><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:satMod val=\"103000\"/><a:lumMod val=\"102000\"/><a:tint val=\"94000\"/></a:schemeClr></a:gs><a:gs pos=\"50000\"><a:schemeClr val=\"phClr\"><a:satMod val=\"110000\"/><a:lumMod val=\"100000\"/><a:shade val=\"100000\"/></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:lumMod val=\"99000\"/><a:satMod val=\"120000\"/><a:shade val=\"78000\"/></a:schemeClr></a:gs></a:gsLst><a:lin ang=\"5400000\" scaled=\"0\"/></a:gradFill></a:fillStyleLst><a:lnStyleLst><a:ln w=\"12700\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\"><a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill><a:prstDash val=\"solid\"/><a:miter lim=\"800000\"/></a:ln><a:ln w=\"19050\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\"><a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill><a:prstDash val=\"solid\"/><a:miter lim=\"800000\"/></a:ln><a:ln w=\"25400\" cap=\"flat\" cmpd=\"sng\" algn=\"ctr\"><a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill><a:prstDash val=\"solid\"/><a:miter lim=\"800000\"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst><a:outerShdw blurRad=\"57150\" dist=\"19050\" dir=\"5400000\" algn=\"ctr\" rotWithShape=\"0\"><a:srgbClr val=\"000000\"><a:alpha val=\"63000\"/></a:srgbClr></a:outerShdw></a:effectLst></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val=\"phClr\"/></a:solidFill><a:solidFill><a:schemeClr val=\"phClr\"><a:tint val=\"95000\"/><a:satMod val=\"170000\"/></a:schemeClr></a:solidFill><a:gradFill rotWithShape=\"1\"><a:gsLst><a:gs pos=\"0\"><a:schemeClr val=\"phClr\"><a:tint val=\"93000\"/><a:satMod val=\"150000\"/><a:shade val=\"98000\"/><a:lumMod val=\"102000\"/></a:schemeClr></a:gs><a:gs pos=\"50000\"><a:schemeClr val=\"phClr\"><a:tint val=\"98000\"/><a:satMod val=\"130000\"/><a:shade val=\"90000\"/><a:lumMod val=\"103000\"/></a:schemeClr></a:gs><a:gs pos=\"100000\"><a:schemeClr val=\"phClr\"><a:shade val=\"63000\"/><a:satMod val=\"120000\"/></a:schemeClr></a:gs></a:gsLst><a:lin ang=\"5400000\" scaled=\"0\"/></a:gradFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults><a:lnDef><a:spPr/><a:bodyPr/><a:lstStyle/><a:style><a:lnRef idx=\"2\"><a:schemeClr val=\"accent1\"/></a:lnRef><a:fillRef idx=\"0\"><a:schemeClr val=\"accent1\"/></a:fillRef><a:effectRef idx=\"1\"><a:schemeClr val=\"accent1\"/></a:effectRef><a:fontRef idx=\"minor\"><a:schemeClr val=\"tx1\"/></a:fontRef></a:style></a:lnDef></a:objectDefaults><a:extraClrSchemeLst/><a:extLst><a:ext uri=\"{05A4C25C-085E-4340-85A3-A5531E510DB2}\"><thm15:themeFamily xmlns:thm15=\"http://schemas.microsoft.com/office/thememl/2012/main\" name=\"Office Theme\" id=\"{2E142A2C-CD16-42D6-873A-C26D2A0506FA}\" vid=\"{1BDDFF52-6CD6-40A5-AB3C-68EB2F1E4D0A}\"/></a:ext></a:extLst></a:theme>";
  const THEME_SAFE = THEME_SAFE_FN(THEME_XML);
  const enc = new TextEncoder();
  let EMU = 6350;   // EMU per px (set per model: 12192000 / model.w)

  // ---------- zip (store) ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(files) {   // files: [[name, Uint8Array]]
    const parts = [], central = []; let off = 0;
    for (const [name, data] of files) {
      const nb = enc.encode(name), crc = crc32(data), sz = data.length;
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint32(14, crc, true); h.setUint32(18, sz, true); h.setUint32(22, sz, true); h.setUint16(26, nb.length, true);
      parts.push(new Uint8Array(h.buffer), nb, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, sz, true); c.setUint32(24, sz, true); c.setUint16(28, nb.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nb);
      off += 30 + nb.length + sz;
    }
    const cdSize = central.reduce((a, b) => a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
    const all = [...parts, ...central, new Uint8Array(e.buffer)];
    const out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0;
    for (const a of all) { out.set(a, p); p += a.length; }
    return out;
  }

  // ---------- xml helpers ----------
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const E = v => Math.round(v * EMU);
  const hex = c => c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  function solidXml(c, a) { return `<a:solidFill><a:srgbClr val="${hex(c)}">${a < 0.999 ? `<a:alpha val="${Math.round(a * 100000)}"/>` : ''}</a:srgbClr></a:solidFill>`; }
  const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';

  // font family + figma style -> PowerPoint typeface / bold / italic
  function font(f, st) {
    let s = (st || 'Regular').replace(/\s*Italic$/i, ''); const it = /Italic/i.test(st || '');
    let face = f, b = false;
    // Font hệ thống theo thiết bị (bảng LOG › 7): 1 họ font nhiều độ đậm → KHÔNG ghép tên kiểu vào tên font ("PingFang SC Semibold" không tồn tại) – dùng họ font + b="1" cho Semibold trở lên
    const SYS = /^(Arial|Verdana|KaiTi|Kaiti SC|STKaiti|LXGW WenKai|PingFang (SC|TC|HK)|Hiragino Sans|Hiragino Kaku Gothic ProN|Apple SD Gothic Neo|Microsoft YaHei|Microsoft JhengHei|Yu Gothic|Meiryo|Malgun Gothic|Noto Sans( (SC|TC|JP|KR))?|Noto Sans CJK (SC|TC|JP|KR))$/;
    if (SYS.test(f)) b = /semi|demi|bold|heavy|black|W[6-9]/i.test(s);
    else if (s === 'Bold') b = true;
    else if (s !== 'Regular' && s !== '') face = f + ' ' + s.replace(/\s+/g, '');   // Montserrat SemiBold, Montserrat Medium …
    return { face, b, it };
  }

  // ---------- shapes ----------
  function xfrm(n, tag) { return `<${tag}><a:off x="${E(n.x)}" y="${E(n.y)}"/><a:ext cx="${Math.max(1, E(n.w))}" cy="${Math.max(1, E(n.h))}"/></${tag}>`; }
  function shapeXml(ctx, n, sh, name) {
    const id = ctx.nextId(n.id + (name === n.name ? '' : ':bg'));
    let geom = '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>';
    if (sh.ell) geom = '<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>';
    else if (sh.rad > 0) {
      const adj = Math.min(50000, Math.round(sh.rad / Math.max(1, Math.min(n.w, n.h)) * 100000));
      geom = `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ${adj}"/></a:avLst></a:prstGeom>`;
    }
    const op = n.op == null ? 1 : n.op;
    const fill = sh.fill ? solidXml(sh.fill.c, sh.fill.a * op) : '<a:noFill/>';
    const ln = sh.stroke ? `<a:ln w="${E(sh.stroke.w)}">${solidXml(sh.stroke.c, sh.stroke.a * op)}${sh.stroke.dash ? '<a:prstDash val="dash"/>' : ''}</a:ln>` : '<a:ln><a:noFill/></a:ln>';
    const eff = sh.shadow ? `<a:effectLst><a:outerShdw blurRad="${E(sh.shadow.r)}" dist="${E(Math.hypot(sh.shadow.x, sh.shadow.y))}" dir="${Math.round(((Math.atan2(sh.shadow.y, sh.shadow.x) * 180 / Math.PI) + 360) % 360 * 60000)}" algn="ctr" rotWithShape="0">${solidXml(sh.shadow.c, sh.shadow.a).replace('<a:solidFill>', '').replace('</a:solidFill>', '')}</a:outerShdw></a:effectLst>` : '';
    return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${esc(name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr>${xfrm(n, 'a:xfrm')}${geom}${fill}${ln}${eff}</p:spPr><p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="vi-VN"/></a:p></p:txBody></p:sp>`;
  }

  function textXml(ctx, n) {
    const id = ctx.nextId(n.id);
    const op = n.op == null ? 1 : n.op;
    const algn = { LEFT: 'l', CENTER: 'ctr', RIGHT: 'r', JUSTIFIED: 'just' }[n.ah] || 'l';
    const anchor = { TOP: 't', CENTER: 'ctr', BOTTOM: 'b' }[n.av] || 't';
    // split segments into paragraphs
    const paras = [[]];
    for (const s of n.segs) {
      let t = s.t; if (s.tc === 'UPPER') t = t.toUpperCase(); else if (s.tc === 'LOWER') t = t.toLowerCase();
      const pieces = t.split('\n');
      pieces.forEach((pc, i) => { if (i > 0) paras.push([]); if (pc.length) paras[paras.length - 1].push(Object.assign({}, s, { t: pc })); });
    }
    const runRpr = (s, tag) => {
      const f = font(s.f, s.st); const sz = Math.max(100, Math.round(s.sz * EMU / 12700 * 100));
      let a = `<a:${tag} lang="vi-VN" sz="${sz}"${f.b ? ' b="1"' : ''}${f.it ? ' i="1"' : ''}${s.u === 'UNDERLINE' ? ' u="sng"' : ''}${s.u === 'STRIKETHROUGH' ? ' strike="sngStrike"' : ''}`;
      if (s.ls && s.ls.value) { const px = s.ls.unit === 'PERCENT' ? s.ls.value / 100 * s.sz : s.ls.value; a += ` spc="${Math.round(px * EMU / 12700 * 100)}"`; }
      a += ' dirty="0">';
      if (s.c) a += solidXml(s.c.c, s.c.a * op);
      const ea = s.ea ? font(s.ea, s.st).face : f.face;
      a += `<a:latin typeface="${esc(f.face)}"/><a:ea typeface="${esc(ea)}"/><a:cs typeface="${esc(f.face)}"/></a:${tag}>`;
      return a;
    };
    let body = '';
    for (const p of paras) {
      const first = p[0] || n.segs[n.segs.length - 1];
      let lnSpc = '';
      const lh = first && first.lh;
      if (lh && lh.unit === 'PIXELS') lnSpc = `<a:lnSpc><a:spcPts val="${Math.round(lh.value * EMU / 12700 * 100)}"/></a:lnSpc>`;
      else if (lh && lh.unit === 'PERCENT') lnSpc = `<a:lnSpc><a:spcPct val="${Math.round(lh.value / 1.219 * 1000)}"/></a:lnSpc>`;
      body += `<a:p><a:pPr algn="${algn}">${lnSpc}</a:pPr>`;
      for (const s of p) {
        const lines = s.t.split(' ');
        lines.forEach((ln, i) => {
          if (i > 0) body += `<a:br>${runRpr(s, 'rPr')}</a:br>`;
          if (ln.length) body += `<a:r>${runRpr(s, 'rPr')}<a:t>${esc(ln)}</a:t></a:r>`;
        });
      }
      body += `${first ? runRpr(first, 'endParaRPr') : '<a:endParaRPr lang="vi-VN"/>'}</a:p>`;
    }
    const wrap = n.auto === 'WIDTH_AND_HEIGHT' ? 'none' : 'square';
    const box = Object.assign({}, n, { w: n.w + (wrap === 'square' ? 2 : 0) });   // tiny slack so lines don't re-wrap
    return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${esc(n.name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr>${xfrm(box, 'a:xfrm')}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr wrap="${wrap}" lIns="0" tIns="0" rIns="0" bIns="0" anchor="${anchor}" rtlCol="0"><a:noAutofit/></a:bodyPr><a:lstStyle/>${body}</p:txBody></p:sp>`;
  }

  function picXml(ctx, n) {
    const id = ctx.nextId(n.id);
    const rid = ctx.media(n.png);
    if (!rid) return '';
    const op = n.op == null ? 1 : n.op;
    return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="${esc(n.name)}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rid}">${op < 0.999 ? `<a:alphaModFix amt="${Math.round(op * 100000)}"/>` : ''}</a:blip><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${xfrm(n, 'a:xfrm')}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
  }

  // Morph: PowerPoint ghép đối tượng giữa 2 slide theo tên "!!…" -> làm phẳng nhóm, đặt tên theo đường dẫn layer
  function morphName(ctx, path) {
    let nm = '!!' + path.join('/'); const k = nm; let i = 2;
    while (ctx.used[nm]) nm = k + '#' + (i++);
    ctx.used[nm] = 1; return nm;
  }
  function flatXml(ctx, n, path) {
    const p = path.concat(n.name);
    if (n.k === 'text') return textXml(ctx, Object.assign({}, n, { name: morphName(ctx, p) }));
    if (n.k === 'img') return picXml(ctx, Object.assign({}, n, { name: morphName(ctx, p) }));
    if (n.k === 'shape') { const nm = morphName(ctx, p); return shapeXml(ctx, Object.assign({}, n, { name: nm }), n.shape, nm); }
    if (n.k === 'line') return lineXml(ctx, n, morphName(ctx, p));
    if (n.k === 'group') {
      let out = '';
      if (n.shape) { const nm = morphName(ctx, p.concat('nền')); out += shapeXml(ctx, Object.assign({}, n, { name: nm }), n.shape, nm); }
      for (const k of n.kids || []) out += flatXml(ctx, k, p);
      return out;
    }
    return '';
  }

  // đường thẳng (dây nối đáp án): flipH / flipV cho hướng chéo; 2 đầu chấm tròn
  function lineXml(ctx, n, name) {
    const id = ctx.nextId(n.id); const fl = (n.flipH ? ' flipH="1"' : '') + (n.flipV ? ' flipV="1"' : '');
    return `<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="${id}" name="${esc(name || n.name)}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr>${xfrm(n, 'a:xfrm').replace('<a:xfrm>', `<a:xfrm${fl}>`)}<a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="${E(n.lw)}" cap="rnd">${solidXml(n.c.c, n.c.a)}<a:headEnd type="oval" w="med" len="med"/><a:tailEnd type="oval" w="med" len="med"/></a:ln></p:spPr></p:cxnSp>`;
  }
  function nodeXml(ctx, n) {
    if (ctx.flat) return flatXml(ctx, n, []);
    if (n.k === 'text') return textXml(ctx, n);
    if (n.k === 'img') return picXml(ctx, n);
    if (n.k === 'shape') return shapeXml(ctx, n, n.shape, n.name);
    if (n.k === 'line') return lineXml(ctx, n);
    if (n.k === 'group') {
      let inner = '';
      if (n.shape) inner += shapeXml(ctx, n, n.shape, n.name + ' (nền)');
      for (const k of n.kids || []) inner += nodeXml(ctx, k);
      if (!inner) return '';
      // Keynote chỉ dựng hiệu ứng cho đối tượng cấp ngoài cùng → nhóm chứa đối tượng có hiệu ứng (mà bản thân nhóm không có) thì rã nhóm; toạ độ con đã là toạ độ slide (chOff = off) nên vị trí, thứ tự lớp giữ nguyên
      const hasAnim = g => (g.kids || []).some(k => ctx.anim.has(k.id) || hasAnim(k));
      if (!ctx.anim.has(n.id) && hasAnim(n)) return inner;
      const id = ctx.nextId(n.id);
      const g = xfrm(n, 'a:xfrm').replace('</a:xfrm>', `<a:chOff x="${E(n.x)}" y="${E(n.y)}"/><a:chExt cx="${Math.max(1, E(n.w))}" cy="${Math.max(1, E(n.h))}"/></a:xfrm>`);
      return `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="${id}" name="${esc(n.name)}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr>${g}</p:grpSpPr>${inner}</p:grpSp>`;
    }
    return '';
  }

  // ---------- transitions ----------
  function transitionXml(tr) {
    if (!tr || !tr.style || tr.style === 'NONE') return '';
    const d = tr.duration || 0.5; const spd = d <= 0.5 ? 'fast' : d <= 0.8 ? 'med' : 'slow';
    const ms = Math.max(10, Math.round(d * 1000));   // thời lượng đúng như Figma (PowerPoint 2010+ đọc p14:dur; bản cũ dùng spd)
    const s = tr.style; const dir = (s.match(/(LEFT|RIGHT|TOP|BOTTOM)$/) || [])[1];
    const from = { LEFT: 'r', RIGHT: 'l', TOP: 'd', BOTTOM: 'u' }[dir];   // "from right" = content moves left
    const to = { LEFT: 'l', RIGHT: 'r', TOP: 'u', BOTTOM: 'd' }[dir];
    let inner = '<p:fade/>';
    if (s.startsWith('PUSH_FROM')) inner = `<p:push dir="${from}"/>`;
    else if (s.startsWith('SLIDE_FROM') || s.startsWith('MOVE_FROM')) inner = `<p:cover dir="${from}"/>`;
    else if (s.startsWith('SLIDE_OUT') || s.startsWith('MOVE_OUT')) inner = `<p:pull dir="${to}"/>`;
    const MC = 'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"', P14 = 'xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main"';
    if (s === 'SMART_ANIMATE') {
      return `<mc:AlternateContent ${MC}><mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" ${P14} Requires="p159"><p:transition spd="${spd}" p14:dur="${ms}"><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="${spd}"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>`;
    }
    return `<mc:AlternateContent ${MC}><mc:Choice ${P14} Requires="p14"><p:transition spd="${spd}" p14:dur="${ms}">${inner}</p:transition></mc:Choice><mc:Fallback><p:transition spd="${spd}">${inner}</p:transition></mc:Fallback></mc:AlternateContent>`;
  }

  function timingXml(ctx, anims) {
    const list = anims.map(a => Object.assign({}, a, { spid: ctx.ids[a.id] })).filter(a => a.spid);
    if (!list.length) return '';
    let cid = 3; const nid = () => cid++;
    // nhóm theo lần bấm: 'after' và 'with' nhập vào nhóm trước (không thêm lần bấm); chỉ 'click' mở nhóm mới
    const groups = [];
    for (const a of list) { if ((a.when === 'after' || a.when === 'with') && groups.length) groups[groups.length - 1].push(a); else groups.push([a]); }
    const effect = (a, delay, nodeType) => {
      if (a.fx === 'move') {   // ô từ trượt về đúng chỗ: Motion Path đường thẳng (đơn vị = tỉ lệ khổ slide)
        const ctn = nid(), dur = a.dur || 700, P = `M 0 0 L ${((a.dx || 0) / 1920).toFixed(4)} ${((a.dy || 0) / 1080).toFixed(4)} E`;
        return { dur, xml: `<p:par><p:cTn id="${ctn}" presetID="0" presetClass="path" presetSubtype="0" accel="50000" decel="50000" fill="hold" nodeType="${nodeType}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:animMotion origin="layout" path="${P}" pathEditMode="relative" ptsTypes=""><p:cBhvr><p:cTn id="${nid()}" dur="${dur}" fill="hold"/><p:tgtEl><p:spTgt spid="${a.spid}"/></p:tgtEl><p:attrNameLst><p:attrName>ppt_x</p:attrName><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr></p:animMotion></p:childTnLst></p:cTn></p:par>` }; }
      const ctn = nid();   // id cha trước con (thứ tự như PowerPoint)
      const dur = a.dur || 500; const sp = `<p:tgtEl><p:spTgt spid="${a.spid}"/></p:tgtEl>`;
      const dir = a.dir || (a.fx === 'wipe' ? 'left' : 'bottom');
      const FLY = { bottom: [4, '#ppt_x', '1+#ppt_h/2'], left: [8, '0-#ppt_w/2', '#ppt_y'], right: [2, '1+#ppt_w/2', '#ppt_y'], top: [1, '#ppt_x', '0-#ppt_h/2'] }[dir] || [4, '#ppt_x', '1+#ppt_h/2'];
      const preset = { appear: [1, 0], fade: [10, 0], fly: [2, FLY[0]], zoom: [53, 16], wipe: [22, { left: 8, top: 1, right: 2, bottom: 4 }[dir] || 8] }[a.fx] || [10, 0];
      let beh = `<p:set><p:cBhvr><p:cTn id="${nid()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>${sp}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>`;
      if (a.fx === 'fade') beh += `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${nid()}" dur="${dur}"/>${sp}</p:cBhvr></p:animEffect>`;
      if (a.fx === 'fly') {
        beh += `<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="${nid()}" dur="${dur}" fill="hold"/>${sp}<p:attrNameLst><p:attrName>ppt_x</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="${FLY[1]}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_x"/></p:val></p:tav></p:tavLst></p:anim>`;
        beh += `<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="${nid()}" dur="${dur}" fill="hold"/>${sp}<p:attrNameLst><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="${FLY[2]}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_y"/></p:val></p:tav></p:tavLst></p:anim>`;
      }
      if (a.fx === 'wipe') beh += `<p:animEffect transition="in" filter="wipe(${dir})"><p:cBhvr><p:cTn id="${nid()}" dur="${dur}"/>${sp}</p:cBhvr></p:animEffect>`;
      if (a.fx === 'zoom') {
        beh += `<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="${nid()}" dur="${dur}" fill="hold"/>${sp}<p:attrNameLst><p:attrName>ppt_w</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:fltVal val="0"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_w"/></p:val></p:tav></p:tavLst></p:anim>`;
        beh += `<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="${nid()}" dur="${dur}" fill="hold"/>${sp}<p:attrNameLst><p:attrName>ppt_h</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:fltVal val="0"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_h"/></p:val></p:tav></p:tavLst></p:anim>`;
      }
      return { dur, xml: `<p:par><p:cTn id="${ctn}" presetID="${preset[0]}" presetClass="entr" presetSubtype="${preset[1]}" fill="hold" nodeType="${nodeType}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${beh}</p:childTnLst></p:cTn></p:par>` };
    };
    // Cấu trúc giống PowerPoint: mỗi nhóm bấm chia thành các "bước"; 'after' mở bước mới (bắt đầu khi bước trước xong),
    // 'with' nằm chung bước với hiệu ứng trước (chạy cùng lúc). Nhóm đầu bắt đầu bằng 'after'/'with' → tự chạy khi vào slide.
    const nodeTypeOf = a => a.when === 'with' ? 'withEffect' : a.when === 'after' ? 'afterEffect' : 'clickEffect';
    let clicks = '';
    groups.forEach((g, gi) => {
      const outer = nid(); let inner = ''; let t = 0;
      const steps = [];
      g.forEach((a, i) => { if (i === 0 || a.when === 'after') steps.push([a]); else steps[steps.length - 1].push(a); });
      for (const st of steps) {
        const pid = nid(); let xml = '', span = 0;
        st.forEach(a => {
          const e = effect(a, 0, nodeTypeOf(a));
          xml += e.xml; span = Math.max(span, e.dur);
        });
        inner += `<p:par><p:cTn id="${pid}" fill="hold"><p:stCondLst><p:cond delay="${t}"/></p:stCondLst><p:childTnLst>${xml}</p:childTnLst></p:cTn></p:par>`;
        t += span;
      }
      const auto = gi === 0 && g[0].when !== 'click' ? `<p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>` : '';
      clicks += `<p:par><p:cTn id="${outer}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/>${auto}</p:stCondLst><p:childTnLst>${inner}</p:childTnLst></p:cTn></p:par>`;
    });
    return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${clicks}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>`;
  }

  // ---------- package ----------
  function build(model) {
    EMU = 12192000 / (model.w || 1920);
    const SH = Math.round((model.h || 1080) * EMU);
    const files = []; const mediaFiles = {}; const sameMedia = {}; let mediaN = 0;
    const slideXmls = [], notesN = [];
    model.slides.forEach((s, si) => {
      const rels = ['<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'];
      const relIds = {}; let rn = 2; let idn = 2;
      const smart = i => model.slides[i] && model.slides[i].tr && model.slides[i].tr.style === 'SMART_ANIMATE';
      const ctx = {
        flat: smart(si) || smart(si + 1), used: {}, anim: new Set((s.anims || []).map(a => a.id)),
        ids: {},
        nextId(key) { const v = idn++; if (key && !(key in this.ids)) this.ids[key] = v; return v; },
        media(key) {
          if (!key || !model.media[key]) return null;
          if (!mediaFiles[key]) {   // ảnh trùng nội dung (nền, logo lặp lại) chỉ lưu 1 tệp
            const b = model.media[key]; let h = 0x811c9dc5; for (let i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 0x01000193); }
            const sig = (h >>> 0) + ':' + b.length;
            if (sameMedia[sig]) mediaFiles[key] = sameMedia[sig];
            else { mediaFiles[key] = sameMedia[sig] = `image${++mediaN}.png`; files.push([`ppt/media/${mediaFiles[key]}`, b]); }
          }
          if (!relIds[key]) { relIds[key] = `rId${rn++}`; rels.push(`<Relationship Id="${relIds[key]}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${mediaFiles[key]}"/>`); }
          return relIds[key];
        }
      };
      let tree = '';
      for (const it of s.items) tree += nodeXml(ctx, it);
      const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${NS}><p:cSld${s.name ? ` name="${esc(s.name)}"` : ''}>${s.bg ? `<p:bg><p:bgPr>${solidXml(s.bg, 1)}<a:effectLst/></p:bgPr></p:bg>` : ''}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${tree}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${transitionXml(s.tr)}${timingXml(ctx, s.anims || [])}</p:sld>`;
      files.push([`ppt/slides/slide${si + 1}.xml`, enc.encode(xml)]);
      if (s.notes && String(s.notes).trim()) {   // GHI CHÚ GIẢNG → notesSlide (PowerPoint / Google Slides / Keynote đều đọc)
        rels.push(`<Relationship Id="rId${rn++}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide${si + 1}.xml"/>`);
        const paras = String(s.notes).replace(/\r/g, '').split('\n').map(l => { const head = /^[A-ZÀ-ỸĐ ]{3,}$/.test(l.trim());
          return l.trim() ? `<a:p><a:r><a:rPr lang="vi-VN" sz="1200"${head ? ' b="1"' : ''} dirty="0"/><a:t>${esc(l)}</a:t></a:r></a:p>` : '<a:p><a:endParaRPr lang="vi-VN" sz="1200"/></a:p>'; }).join('');
        files.push([`ppt/notesSlides/notesSlide${si + 1}.xml`, enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:notes ${NS}><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${paras}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`)]);
        files.push([`ppt/notesSlides/_rels/notesSlide${si + 1}.xml.rels`, enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide${si + 1}.xml"/></Relationships>`)]);
        notesN.push(si + 1);
      }
      files.push([`ppt/slides/_rels/slide${si + 1}.xml.rels`, enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`)]);
      slideXmls.push(si + 1);
    });
    const n = slideXmls.length;
    const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${slideXmls.map(i => `<Override PartName="/ppt/slides/slide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}${notesN.length ? `<Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"/><Override PartName="/ppt/theme/theme2.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>` + notesN.map(i => `<Override PartName="/ppt/notesSlides/notesSlide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`).join('') : ''}</Types>`;
    const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const head = [
      ['[Content_Types].xml', ct],
      ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="${R}/extended-properties" Target="docProps/app.xml"/></Relationships>`],
      ['docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(model.title || 'Betreux')}</dc:title><dc:creator>Betreux – Figma export</dc:creator></cp:coreProperties>`],
      ['docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Office PowerPoint</Application><Slides>${n}</Slides></Properties>`],
      ['ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>${notesN.length ? `<p:notesMasterIdLst><p:notesMasterId r:id="rId${n + 3}"/></p:notesMasterIdLst>` : ''}<p:sldIdLst>${slideXmls.map(i => `<p:sldId id="${255 + i}" r:id="rId${i + 2}"/>`).join('')}</p:sldIdLst><p:sldSz cx="12192000" cy="${SH}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`],
      ['ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/slideMaster" Target="slideMasters/slideMaster1.xml"/><Relationship Id="rId2" Type="${R}/theme" Target="theme/theme1.xml"/>${slideXmls.map(i => `<Relationship Id="rId${i + 2}" Type="${R}/slide" Target="slides/slide${i}.xml"/>`).join('')}${notesN.length ? `<Relationship Id="rId${n + 3}" Type="${R}/notesMaster" Target="notesMasters/notesMaster1.xml"/>` : ''}</Relationships>`],
      ['ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="4400"/></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:otherStyle></p:txStyles></p:sldMaster>`],
      ['ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="${R}/theme" Target="../theme/theme1.xml"/></Relationships>`],
      ['ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`],
      ['ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`],
      ['ppt/theme/theme1.xml', THEME_SAFE],
    ];
    if (notesN.length) head.push(   // khuôn trang ghi chú (bắt buộc khi có notesSlide)
      ['ppt/notesMasters/notesMaster1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:notesMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg" idx="2"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="381000" y="685800"/><a:ext cx="6096000" cy="3429000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" sz="quarter" idx="3"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="685800" y="4343400"/><a:ext cx="5486400" cy="4114800"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/><a:p><a:endParaRPr lang="vi-VN"/></a:p></p:txBody></p:sp></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:notesStyle><a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr></p:notesStyle></p:notesMaster>`],
      ['ppt/notesMasters/_rels/notesMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/theme" Target="../theme/theme2.xml"/></Relationships>`],
      ['ppt/theme/theme2.xml', THEME_SAFE]);
    const headB = head.map(([a, b]) => [a, enc.encode(b)]);
    return zip([...headB, ...files]);
  }
  root.PPTX = { build };
})(typeof window !== 'undefined' ? window : globalThis);

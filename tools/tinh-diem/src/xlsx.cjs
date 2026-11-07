/* Ghi và đọc tệp Excel (.xlsx) tối giản, không dùng thư viện ngoài.
 *  - Ghi: ZIP không nén + XML (chuỗi nội tuyến), nhiều trang tính, một trang tính ẩn "_du_lieu" chứa toàn bộ dữ liệu JSON
 *    để nhập lại đầy đủ (trang tính hiển thị chỉ là bản tóm tắt dễ đọc).
 *  - Đọc: chỉ để lấy lại trang tính ẩn "_du_lieu". Đọc được cả tệp đã mở và lưu lại bằng Excel (ZIP nén deflate, chuỗi dùng chung).
 * Chạy trong trình duyệt (globalThis.VTF_XLSX) và Node (require). */
(function (root) {
  'use strict';

  var HIDDEN = '_du_lieu';
  var MARK = 'vtf-tinh-diem';
  var CHUNK = 30000; // dưới giới hạn 32.767 ký tự mỗi ô của Excel

  function utf8(s) { return new TextEncoder().encode(s); }
  function fromUtf8(u8) { return new TextDecoder('utf-8').decode(u8); }

  /* ---------- CRC32 ---------- */
  var CRC_TABLE = null;
  function crc32(u8) {
    if (!CRC_TABLE) {
      CRC_TABLE = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        CRC_TABLE[n] = c >>> 0;
      }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) crc = CRC_TABLE[(crc ^ u8[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function le16(n) { return [n & 255, (n >>> 8) & 255]; }
  function le32(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }

  /* ---------- ZIP (ghi, không nén) ---------- */
  function zipStore(files, now) {
    var d = now || new Date();
    var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    var parts = []; var central = []; var offset = 0;
    files.forEach(function (f) {
      var name = utf8(f.name);
      var crc = crc32(f.data);
      var size = f.data.length;
      var local = [].concat([0x50, 0x4b, 3, 4], le16(20), le16(0x0800), le16(0), le16(dosTime), le16(dosDate),
        le32(crc), le32(size), le32(size), le16(name.length), le16(0));
      parts.push(new Uint8Array(local), name, f.data);
      var cen = [].concat([0x50, 0x4b, 1, 2], le16(20), le16(20), le16(0x0800), le16(0), le16(dosTime), le16(dosDate),
        le32(crc), le32(size), le32(size), le16(name.length), le16(0), le16(0), le16(0), le16(0), le32(0), le32(offset));
      central.push(new Uint8Array(cen), name);
      offset += local.length + name.length + size;
    });
    var cdSize = 0;
    central.forEach(function (c) { cdSize += c.length; });
    var eocd = [].concat([0x50, 0x4b, 5, 6], le16(0), le16(0), le16(files.length), le16(files.length), le32(cdSize), le32(offset), le16(0));
    var all = parts.concat(central, [new Uint8Array(eocd)]);
    var total = 0; all.forEach(function (a) { total += a.length; });
    var out = new Uint8Array(total); var p = 0;
    all.forEach(function (a) { out.set(a, p); p += a.length; });
    return out;
  }

  /* ---------- ZIP (đọc) ---------- */
  function rd16(b, o) { return b[o] | (b[o + 1] << 8); }
  function rd32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }

  function inflateRaw(u8) {
    return new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }

  function unzip(bytes) {
    var eocd = -1;
    for (var i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 5 && bytes[i + 3] === 6) { eocd = i; break; }
    }
    if (eocd < 0) return Promise.reject(new Error('Không phải tệp .xlsx hợp lệ (không đọc được cấu trúc ZIP).'));
    var n = rd16(bytes, eocd + 10);
    var cd = rd32(bytes, eocd + 16);
    var entries = [];
    var p = cd;
    for (var k = 0; k < n; k++) {
      if (rd32(bytes, p) !== 0x02014b50) return Promise.reject(new Error('Tệp .xlsx bị hỏng (danh mục ZIP).'));
      var flags = rd16(bytes, p + 8);
      var method = rd16(bytes, p + 10);
      var csize = rd32(bytes, p + 20);
      var nlen = rd16(bytes, p + 28); var elen = rd16(bytes, p + 30); var clen = rd16(bytes, p + 32);
      var loff = rd32(bytes, p + 42);
      var name = fromUtf8(bytes.subarray(p + 46, p + 46 + nlen));
      entries.push({ name: name, method: method, csize: csize, loff: loff, flags: flags });
      p += 46 + nlen + elen + clen;
    }
    var out = {};
    var chain = Promise.resolve();
    entries.forEach(function (e) {
      chain = chain.then(function () {
        var lh = e.loff;
        var data = bytes.subarray(lh + 30 + rd16(bytes, lh + 26) + rd16(bytes, lh + 28));
        data = data.subarray(0, e.csize);
        if (e.method === 0) { out[e.name] = data; return; }
        if (e.method === 8) {
          if (typeof DecompressionStream === 'undefined') throw new Error('Trình duyệt này chưa hỗ trợ đọc tệp Excel đã nén. Hãy nhập bằng tệp .json.');
          return inflateRaw(data).then(function (u) { out[e.name] = u; });
        }
        throw new Error('Tệp .xlsx dùng kiểu nén không hỗ trợ.');
      });
    });
    return chain.then(function () { return out; });
  }

  /* ---------- XML ---------- */
  function esc(s) {
    return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function unesc(s) {
    return s.replace(/&#x([0-9a-fA-F]+);/g, function (_, h) { return String.fromCodePoint(parseInt(h, 16)); })
      .replace(/&#(\d+);/g, function (_, d) { return String.fromCodePoint(parseInt(d, 10)); })
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  }
  function colName(i) {
    var s = ''; var n = i + 1;
    while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
    return s;
  }

  function sheetXml(rows, opt) {
    opt = opt || {};
    var widths = [];
    var xml = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'];
    if (opt.header) xml.push('<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>');
    var body = ['<sheetData>'];
    rows.forEach(function (row, r) {
      var cells = [];
      row.forEach(function (v, c) {
        if (v === null || v === undefined || v === '') return;
        var ref = colName(c) + (r + 1);
        var isHead = opt.header && r === 0;
        var len;
        if (typeof v === 'number' && isFinite(v)) {
          cells.push('<c r="' + ref + '"><v>' + v + '</v></c>');
          len = String(v).length;
        } else {
          var t = String(v);
          cells.push('<c r="' + ref + '" t="inlineStr"' + (opt.styled ? ' s="' + (isHead ? 1 : 2) + '"' : '') + '><is><t xml:space="preserve">' + esc(t) + '</t></is></c>');
          len = Math.min(t.length, 60);
        }
        widths[c] = Math.max(widths[c] || 0, isHead ? len + 2 : len);
      });
      body.push('<row r="' + (r + 1) + '">' + cells.join('') + '</row>');
    });
    body.push('</sheetData>');
    if (opt.styled && widths.length) {
      xml.push('<cols>' + widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + Math.max(8, Math.min(60, (w || 8) + 2)) + '" customWidth="1"/>'; }).join('') + '</cols>');
    }
    xml.push(body.join(''));
    xml.push('</worksheet>');
    return xml.join('');
  }

  var STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF3EDE2"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

  function tenSheet(s) { return String(s).replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31); }

  /* sheets: [{ name, rows }] (dòng đầu là tiêu đề). dataJson: chuỗi JSON đầy đủ, đặt trong trang tính ẩn. Trả Uint8Array. */
  function buildXlsx(sheets, dataJson, now) {
    var all = sheets.map(function (s) { return { name: tenSheet(s.name), rows: s.rows, styled: true, header: true, hidden: false }; });
    if (dataJson !== undefined && dataJson !== null) {
      var rows = [[MARK], ['schema 1']];
      for (var i = 0; i < dataJson.length; i += CHUNK) rows.push([dataJson.slice(i, i + CHUNK)]);
      all.push({ name: HIDDEN, rows: rows, styled: false, header: false, hidden: true });
    }
    var files = [];
    files.push({ name: '[Content_Types].xml', data: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      all.map(function (_, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>') });
    files.push({ name: '_rels/.rels', data: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>') });
    files.push({ name: 'xl/workbook.xml', data: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      all.map(function (s, i) { return '<sheet name="' + esc(s.name) + '" sheetId="' + (i + 1) + '"' + (s.hidden ? ' state="hidden"' : '') + ' r:id="rId' + (i + 1) + '"/>'; }).join('') +
      '</sheets></workbook>') });
    files.push({ name: 'xl/_rels/workbook.xml.rels', data: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      all.map(function (_, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
      '<Relationship Id="rId' + (all.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>') });
    files.push({ name: 'xl/styles.xml', data: utf8(STYLES) });
    all.forEach(function (s, i) {
      files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: utf8(sheetXml(s.rows, { styled: s.styled, header: s.header })) });
    });
    return zipStore(files, now);
  }

  /* ---------- Đọc lại trang tính ẩn ---------- */
  function texts(xml) {
    var out = []; var re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g; var m;
    while ((m = re.exec(xml))) out.push(unesc(m[1]));
    return out.join('');
  }

  function readHiddenData(bytes) {
    return unzip(bytes).then(function (z) {
      var wb = z['xl/workbook.xml'];
      var rels = z['xl/_rels/workbook.xml.rels'];
      if (!wb || !rels) throw new Error('Không phải tệp Excel hợp lệ.');
      var wbx = fromUtf8(wb); var relx = fromUtf8(rels);
      var rid = null; var m; var reS = /<sheet\b([^>]*?)\/?>/g;
      while ((m = reS.exec(wbx))) {
        var nm = /\bname="([^"]*)"/.exec(m[1]);
        var ri = /\br:id="([^"]*)"/.exec(m[1]);
        if (nm && ri && unesc(nm[1]) === HIDDEN) { rid = ri[1]; break; }
      }
      if (!rid) return null;
      var target = null; var reR = /<Relationship\b([^>]*?)\/?>/g;
      while ((m = reR.exec(relx))) {
        var id = /\bId="([^"]*)"/.exec(m[1]); var tg = /\bTarget="([^"]*)"/.exec(m[1]);
        if (id && tg && id[1] === rid) { target = tg[1]; break; }
      }
      if (!target) return null;
      target = target.replace(/^\/?(xl\/)?/, 'xl/');
      var sx = z[target];
      if (!sx) return null;
      var shared = [];
      if (z['xl/sharedStrings.xml']) {
        var ss = fromUtf8(z['xl/sharedStrings.xml']); var reSi = /<si\b[^>]*>([\s\S]*?)<\/si>/g; var si;
        while ((si = reSi.exec(ss))) shared.push(texts(si[1]));
      }
      var sheet = fromUtf8(sx);
      var cells = []; var reC = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g; var c;
      while ((c = reC.exec(sheet))) {
        var attrs = c[1]; var inner = c[2] || '';
        var ref = /\br="([A-Z]+)(\d+)"/.exec(attrs);
        if (!ref || ref[1] !== 'A') continue;
        var t = /\bt="([^"]*)"/.exec(attrs);
        var type = t ? t[1] : 'n';
        var val;
        if (type === 'inlineStr') val = texts(inner);
        else if (type === 's') { var v = /<v>([\s\S]*?)<\/v>/.exec(inner); val = v ? (shared[Number(v[1])] || '') : ''; }
        else { var v2 = /<v>([\s\S]*?)<\/v>/.exec(inner); val = v2 ? unesc(v2[1]) : ''; }
        cells.push({ row: Number(ref[2]), val: val });
      }
      cells.sort(function (a, b) { return a.row - b.row; });
      if (!cells.length || cells[0].val !== MARK) return null;
      return cells.filter(function (x) { return x.row >= 3; }).map(function (x) { return x.val; }).join('');
    });
  }

  var API = { buildXlsx: buildXlsx, readHiddenData: readHiddenData, zipStore: zipStore, unzip: unzip, crc32: crc32, HIDDEN: HIDDEN };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.VTF_XLSX = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);

/* ============ 图片扩展工具：水印 / 拼接 / ASCII / EXIF ============ */
(function () {
  const T = window.TB;
  const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB';
  const download = (url, name) => { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); };

  /* ---------- 1. 图片加水印 ---------- */
  T.register({
    id: 'image-watermark', cat: 'color', icon: '💧', name: '图片加水印',
    desc: '文字水印：位置 / 透明度 / 旋转 / 平铺', keywords: 'watermark 水印 图片 文字',
    render: () => `
      <div class="tool-panel">
        <h2>💧 图片加水印</h2>
        <p class="t-sub">本地处理不上传，实时预览，满意再下载。</p>
        <div class="field"><label>选择图片</label><input type="file" id="wm-file" accept="image/*"></div>
        <div class="row">
          <div class="field"><label>水印文字</label><input type="text" id="wm-text" value="© ZeroTrace" maxlength="60"></div>
          <div class="field" style="max-width:130px"><label>位置</label><select id="wm-pos">
            <option value="lt">左上</option><option value="ct">上中</option><option value="rt">右上</option>
            <option value="lc">左中</option><option value="cc" selected>居中</option><option value="rc">右中</option>
            <option value="lb">左下</option><option value="bc">下中</option><option value="rb" selected>右下</option>
          </select></div>
        </div>
        <div class="row">
          <div class="field" style="max-width:130px"><label>颜色</label><input type="color" id="wm-color" value="#ffffff" class="color-input"></div>
          <div class="field"><label>字号（图宽 %）：<span id="wm-szv">5</span>%</label><input type="range" id="wm-size" min="2" max="20" value="5"></div>
          <div class="field"><label>透明度：<span id="wm-opv">65</span>%</label><input type="range" id="wm-op" min="10" max="100" value="65"></div>
        </div>
        <div class="row">
          <div class="field"><label>旋转角度：<span id="wm-rov">0</span>°</label><input type="range" id="wm-rot" min="-45" max="45" value="0"></div>
          <div class="field" style="max-width:130px"><label>平铺</label><select id="wm-tile"><option value="0">关闭</option><option value="1">开启</option></select></div>
        </div>
        <div class="btn-row"><button class="btn secondary" id="wm-dl" disabled>下载 PNG</button></div>
        <div class="cmp-img-box" style="margin-top:12px"><canvas id="wm-cv" style="max-width:100%;border-radius:10px;display:none"></canvas></div>
        <div class="hint" id="wm-note"></div>
      </div>`,
    init: (r) => {
      const file = r.querySelector('#wm-file'), text = r.querySelector('#wm-text'), pos = r.querySelector('#wm-pos');
      const color = r.querySelector('#wm-color'), size = r.querySelector('#wm-size'), op = r.querySelector('#wm-op'), rot = r.querySelector('#wm-rot'), tile = r.querySelector('#wm-tile');
      const cv = r.querySelector('#wm-cv'), dl = r.querySelector('#wm-dl'), note = r.querySelector('#wm-note');
      r.querySelector('#wm-szv').textContent = size.value; r.querySelector('#wm-opv').textContent = op.value; r.querySelector('#wm-rov').textContent = rot.value;
      let img = null, name = 'image', outUrl = null;
      const draw = () => {
        if (!img) return;
        const w = img.naturalWidth, h = img.naturalHeight;
        cv.width = w; cv.height = h; cv.style.display = 'block';
        const ctx = cv.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const t = text.value.trim() || ' ';
        const fs = Math.max(12, Math.round(Math.min(w, h) * (+size.value) / 100));
        ctx.font = `bold ${fs}px "Microsoft YaHei", "PingFang SC", sans-serif`;
        ctx.fillStyle = color.value;
        ctx.globalAlpha = (+op.value) / 100;
        ctx.textBaseline = 'middle';
        const m = Math.round(fs * 1.2); // 边距
        const tw = ctx.measureText(t).width;
        const renderAt = (x, y) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((+rot.value) * Math.PI / 180);
          ctx.fillText(t, -tw / 2, 0);
          ctx.restore();
        };
        if (tile.value === '1') {
          const stepX = tw + fs * 2.5, stepY = fs * 4;
          for (let y = stepY / 2; y < h + stepY; y += stepY)
            for (let x = stepX / 2; x < w + stepX; x += stepX) renderAt(x, y);
        } else {
          const p = pos.value;
          const x = p[1] === 'l' ? m + tw / 2 : p[1] === 'r' ? w - m - tw / 2 : w / 2;
          const y = p[0] === 't' ? m + fs / 2 : p[0] === 'b' ? h - m - fs / 2 : h / 2;
          renderAt(x, y);
        }
        ctx.globalAlpha = 1;
        if (outUrl) URL.revokeObjectURL(outUrl);
        cv.toBlob(b => { if (b) { outUrl = URL.createObjectURL(b); dl.disabled = false; } }, 'image/png');
        note.textContent = `输出尺寸 ${w} × ${h}`;
      };
      file.onchange = () => {
        const f = file.files[0]; if (!f) return;
        name = f.name.replace(/\.[^.]+$/, '');
        const i = new Image(); i.onload = () => { img = i; draw(); }; i.src = URL.createObjectURL(f);
      };
      [text, pos, color, size, op, rot, tile].forEach(el => {
        el.addEventListener('input', () => {
          r.querySelector('#wm-szv').textContent = size.value; r.querySelector('#wm-opv').textContent = op.value; r.querySelector('#wm-rov').textContent = rot.value;
          draw();
        });
        el.addEventListener('change', draw);
      });
      dl.onclick = () => { if (outUrl) download(outUrl, name + '-watermark.png'); };
    }
  });

  /* ---------- 2. 图片拼接 ---------- */
  T.register({
    id: 'image-stitch', cat: 'color', icon: '🧵', name: '图片拼接',
    desc: '多图横向 / 纵向拼成一张', keywords: 'stitch merge 拼接 拼图 长图 合并',
    render: () => `
      <div class="tool-panel">
        <h2>🧵 图片拼接</h2>
        <p class="t-sub">可多选，按选择顺序拼接，本地处理不上传。</p>
        <div class="field"><label>选择图片（可多选）</label><input type="file" id="st-file" accept="image/*" multiple></div>
        <div id="st-list" style="display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 12px"></div>
        <div class="row">
          <div class="field" style="max-width:150px"><label>方向</label><select id="st-dir"><option value="h">横向 →</option><option value="v">纵向 ↓</option></select></div>
          <div class="field" style="max-width:130px"><label>间距 px</label><input type="number" id="st-gap" value="0" min="0" max="100"></div>
          <div class="field" style="max-width:130px"><label>背景色</label><input type="color" id="st-bg" value="#ffffff" class="color-input"></div>
        </div>
        <div class="btn-row"><button class="btn" id="st-go" disabled>拼接</button><button class="btn secondary" id="st-dl" disabled>下载 PNG</button></div>
        <div class="cmp-img-box" style="margin-top:12px"><canvas id="st-cv" style="max-width:100%;border-radius:10px;display:none"></canvas></div>
        <div class="hint" id="st-note"></div>
      </div>`,
    init: (r) => {
      const file = r.querySelector('#st-file'), dir = r.querySelector('#st-dir'), gap = r.querySelector('#st-gap'), bg = r.querySelector('#st-bg');
      const list = r.querySelector('#st-list'), go = r.querySelector('#st-go'), dl = r.querySelector('#st-dl'), cv = r.querySelector('#st-cv'), note = r.querySelector('#st-note');
      let imgs = [], outUrl = null;
      const renderList = () => {
        list.innerHTML = imgs.map((im, i) => `<div style="position:relative"><img src="${im.src}" style="height:56px;border-radius:6px;border:1px solid var(--border,#444)"><button data-rm="${i}" title="移除" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;border:none;background:#e5484d;color:#fff;font-size:11px;cursor:pointer;line-height:1">×</button></div>`).join('');
        list.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { imgs.splice(+b.dataset.rm, 1); renderList(); });
        go.disabled = imgs.length < 2;
      };
      file.onchange = async () => {
        const fs = Array.from(file.files || []);
        for (const f of fs) {
          await new Promise(res => { const i = new Image(); i.onload = () => { imgs.push(i); res(); }; i.onerror = res; i.src = URL.createObjectURL(f); });
        }
        file.value = '';
        renderList();
      };
      go.onclick = () => {
        const g = clamp(+gap.value || 0, 0, 100);
        const horiz = dir.value === 'h';
        // 横向：统一到最小高度；纵向：统一到最小宽度
        const cross = Math.min(...imgs.map(im => horiz ? im.naturalHeight : im.naturalWidth));
        const dims = imgs.map(im => horiz ? { w: Math.round(im.naturalWidth * cross / im.naturalHeight), h: cross } : { w: cross, h: Math.round(im.naturalHeight * cross / im.naturalWidth) });
        const W = dims.reduce((s, d) => s + d.w, 0) + g * (imgs.length - 1);
        const H = dims.reduce((s, d) => s + d.h, 0) + g * (imgs.length - 1);
        cv.width = W; cv.height = H; cv.style.display = 'block';
        const ctx = cv.getContext('2d');
        ctx.fillStyle = bg.value; ctx.fillRect(0, 0, W, H);
        let off = 0;
        imgs.forEach((im, i) => { ctx.drawImage(im, horiz ? off : 0, horiz ? 0 : off, dims[i].w, dims[i].h); off += (horiz ? dims[i].w : dims[i].h) + g; });
        if (outUrl) URL.revokeObjectURL(outUrl);
        cv.toBlob(b => { if (b) { outUrl = URL.createObjectURL(b); dl.disabled = false; } }, 'image/png');
        note.textContent = `拼接 ${imgs.length} 张 → ${W} × ${H}`;
      };
      dl.onclick = () => { if (outUrl) download(outUrl, 'stitched.png'); };
    }
  });

  /* ---------- 3. 图片转 ASCII 字符画 ---------- */
  T.register({
    id: 'img-ascii', cat: 'color', icon: '🔡', name: '图片转字符画',
    desc: '把图片转成 ASCII 字符画', keywords: 'ascii art 字符画 像素 文本画',
    render: () => `
      <div class="tool-panel">
        <h2>🔡 图片转字符画</h2>
        <p class="t-sub">按亮度映射字符，全部本地计算。建议用人像 / logo 等轮廓明显的图。</p>
        <div class="field"><label>选择图片</label><input type="file" id="as-file" accept="image/*"></div>
        <div class="row">
          <div class="field" style="max-width:150px"><label>字符集</label><select id="as-set">
            <option value="std">标准 10 级</option>
            <option value="detail">精细 70 级</option>
            <option value="block">色块</option>
          </select></div>
          <div class="field"><label>宽度（字符数）：<span id="as-wv">100</span></label><input type="range" id="as-w" min="40" max="200" value="100"></div>
          <div class="field" style="max-width:130px"><label>反色</label><select id="as-inv"><option value="0">关闭</option><option value="1">开启</option></select></div>
        </div>
        <div class="btn-row"><button class="btn secondary" id="as-dl" disabled>下载 .txt</button></div>
        <pre id="as-out" style="margin-top:12px;max-height:420px;overflow:auto;background:var(--bg,#111);color:#9fe870;font-size:10px;line-height:1.05;border-radius:10px;padding:12px;white-space:pre"></pre>
        <div class="hint" id="as-note"></div>
      </div>`,
    init: (r) => {
      const file = r.querySelector('#as-file'), set = r.querySelector('#as-set'), wIn = r.querySelector('#as-w'), inv = r.querySelector('#as-inv');
      const out = r.querySelector('#as-out'), dl = r.querySelector('#as-dl'), note = r.querySelector('#as-note');
      r.querySelector('#as-wv').textContent = wIn.value;
      let img = null, text = '';
      const STD = '@%#*+=-:. ';
      const DETAIL = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ';
      const BLOCK = '█▓▒░ ';
      const run = () => {
        if (!img) return;
        const cols = +wIn.value;
        const rows = Math.max(1, Math.round(img.naturalHeight / img.naturalWidth * cols * 0.5));
        const c = document.createElement('canvas'); c.width = cols; c.height = rows;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, cols, rows);
        const d = ctx.getImageData(0, 0, cols, rows).data;
        const chars = set.value === 'detail' ? DETAIL : set.value === 'block' ? BLOCK : STD;
        let s = '';
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const i = (y * cols + x) * 4;
            let lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
            if (inv.value === '1') lum = 1 - lum;
            s += chars[Math.min(chars.length - 1, Math.floor(lum * chars.length))];
          }
          s += '\n';
        }
        text = s;
        out.textContent = s;
        dl.disabled = false;
        note.textContent = `${cols} × ${rows} 字符`;
      };
      file.onchange = () => {
        const f = file.files[0]; if (!f) return;
        const i = new Image(); i.onload = () => { img = i; run(); }; i.src = URL.createObjectURL(f);
      };
      [set, wIn, inv].forEach(el => { el.addEventListener('input', () => { r.querySelector('#as-wv').textContent = wIn.value; run(); }); el.addEventListener('change', run); });
      dl.onclick = () => {
        const b = new Blob([text], { type: 'text/plain;charset=utf-8' });
        download(URL.createObjectURL(b), 'ascii-art.txt');
      };
    }
  });

  /* ---------- 4. EXIF 信息查看 ---------- */
  T.register({
    id: 'exif-viewer', cat: 'conv', icon: '🔬', name: 'EXIF 信息查看',
    desc: '查看 JPEG 拍摄参数 / 相机 / GPS', keywords: 'exif 元数据 拍摄信息 相机 gps',
    render: () => `
      <div class="tool-panel">
        <h2>🔬 EXIF 信息查看</h2>
        <p class="t-sub">解析 JPEG 的 EXIF 元数据（相机、参数、GPS），纯本地读取，不上传。</p>
        <div class="field"><label>选择图片（JPEG）</label><input type="file" id="ex-file" accept="image/jpeg,.jpg,.jpeg"></div>
        <div class="cmp-img-box" style="margin-bottom:12px"><img id="ex-prev" style="max-width:100%;max-height:260px;border-radius:10px;display:none" alt="预览"></div>
        <div id="ex-out" class="out" style="white-space:pre-wrap"></div>
        <div class="hint" id="ex-note"></div>
      </div>`,
    init: (r) => {
      const file = r.querySelector('#ex-file'), out = r.querySelector('#ex-out'), prev = r.querySelector('#ex-prev'), note = r.querySelector('#ex-note');
      const ORI = { 1: '正常', 2: '水平翻转', 3: '旋转 180°', 4: '垂直翻转', 5: '转置（顺时针90+翻转）', 6: '需顺时针旋转 90°', 7: '逆转置', 8: '需逆时针旋转 90°' };
      const EXPP = { 1: '手动', 2: '程序自动', 3: '光圈优先', 4: '快门优先', 5: '创意程序', 6: '运动模式', 7: '人像', 8: '风景' };
      const METER = { 1: '平均测光', 2: '中央重点', 3: '点测光', 4: '多区测光', 5: '评价测光', 6: '局部测光' };
      const FLASH = { 0x0: '未闪光', 0x1: '已闪光', 0x5: '闪光（返回光未检测）', 0x7: '闪光（返回光检测）', 0x9: '强制闪光', 0x10: '关闭闪光', 0x18: '自动未闪光', 0x19: '自动闪光' };
      const TAGS = {
        0x010F: ['制造商', v => v], 0x0110: ['型号', v => v], 0x0112: ['方向', v => ORI[v] || v],
        0x0132: ['修改时间', v => v], 0x829A: ['曝光时间', v => v < 1 ? `1/${Math.round(1 / v)} 秒` : v + ' 秒'],
        0x829D: ['光圈值', v => 'f/' + (v % 1 ? v.toFixed(1) : v)], 0x8822: ['曝光程序', v => EXPP[v] || v],
        0x8827: ['ISO', v => v], 0x9003: ['拍摄时间', v => v], 0x9004: ['数字化时间', v => v],
        0x920A: ['焦距', v => Math.round(v) + ' mm'], 0xA405: ['等效 35mm 焦距', v => v ? Math.round(v) + ' mm' : ''],
        0x9207: ['测光模式', v => METER[v] || v], 0x9209: ['闪光灯', v => FLASH[v] ?? v],
        0xA002: ['像素宽', v => v], 0xA003: ['像素高', v => v], 0xA434: ['镜头型号', v => v]
      };
      function parseExif(buf) {
        const dv = new DataView(buf);
        if (dv.getUint16(0) !== 0xffd8) return null;
        let off = 2;
        while (off + 4 < dv.byteLength) {
          if (dv.getUint8(off) !== 0xff) break;
          const marker = dv.getUint8(off + 1), len = dv.getUint16(off + 2);
          if (marker === 0xe1 && off + 10 < dv.byteLength) {
            // 检查 "Exif\0\0"
            let isExif = true;
            for (let i = 0; i < 6; i++) if (dv.getUint8(off + 4 + i) !== [0x45, 0x78, 0x69, 0x66, 0, 0][i]) { isExif = false; break; }
            if (isExif) return parseTiff(dv, off + 10);
          }
          off += 2 + len;
        }
        return null;
      }
      function parseTiff(dv, base) {
        const le = dv.getUint16(base) === 0x4949; // II = little endian
        const rd16 = o => dv.getUint16(o, le), rd32 = o => dv.getUint32(o, le);
        if (rd16(base + 2) !== 42) return null;
        const res = { entries: [], gps: null };
        const readIFD = (ifdOff, into) => {
          const n = rd16(base + ifdOff);
          for (let i = 0; i < n; i++) {
            const eo = base + ifdOff + 2 + i * 12;
            const tag = rd16(eo), type = rd16(eo + 2), cnt = rd32(eo + 4);
            const TSZ = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
            const sz = (TSZ[type] || 1) * cnt;
            const vo = sz <= 4 ? eo + 8 : base + rd32(eo + 8);
            let val;
            if (type === 2) { // ASCII
              let s = ''; for (let k = 0; k < cnt - 1; k++) s += String.fromCharCode(dv.getUint8(vo + k)); val = s.trim();
            } else if (type === 3) val = rd16(vo);
            else if (type === 4) val = rd32(vo);
            else if (type === 5 || type === 10) {
              const num = type === 5 ? rd32(vo) : dv.getInt32(vo, le);
              const den = type === 5 ? rd32(vo + 4) : dv.getInt32(vo + 4, le);
              val = den ? num / den : 0;
              if (cnt > 1) { val = [val]; for (let k = 1; k < cnt; k++) { const o = vo + k * 8; const nu = rd32(o), de = rd32(o + 4); val.push(de ? nu / de : 0); } }
            }
            into.push({ tag, type, cnt, val });
          }
          return rd32(base + ifdOff + 2 + n * 12); // next IFD
        };
        const ifd0 = rd32(base + 4);
        const next = readIFD(ifd0, res.entries);
        // Exif SubIFD 与 GPS
        const sub = res.entries.find(e => e.tag === 0x8769);
        if (sub && typeof sub.val === 'number') readIFD(sub.val, res.entries);
        const gpsOff = res.entries.find(e => e.tag === 0x8825);
        if (gpsOff && typeof gpsOff.val === 'number') { res.gps = []; readIFD(gpsOff.val, res.gps); }
        // 去掉指针型条目
        res.entries = res.entries.filter(e => e.tag !== 0x8769 && e.tag !== 0x8825);
        res.le = le;
        return res;
      }
      function gpsDecimal(gps) {
        const get = t => gps.find(e => e.tag === t);
        const latRef = get(1), lat = get(2), lonRef = get(3), lon = get(4);
        if (!lat || !lon || !Array.isArray(lat.val) || !Array.isArray(lon.val)) return null;
        const dms = a => a[0] + (a[1] || 0) / 60 + (a[2] || 0) / 3600;
        let la = dms(lat.val), lo = dms(lon.val);
        if (latRef && latRef.val === 'S') la = -la;
        if (lonRef && lonRef.val === 'W') lo = -lo;
        return la.toFixed(6) + ', ' + lo.toFixed(6);
      }
      file.onchange = () => {
        const f = file.files[0]; if (!f) return;
        out.textContent = '';
        note.textContent = '';
        const url = URL.createObjectURL(f);
        prev.src = url; prev.style.display = 'block';
        out.textContent = `文件：${f.name}\n大小：${fmtSize(f.size)}\n类型：${f.type || '未知'}\n`;
        f.arrayBuffer().then(buf => {
          const ex = parseExif(buf);
          if (!ex) { note.textContent = '未找到 EXIF 数据（可能已被清除，或不是含 EXIF 的 JPEG）。'; return; }
          const lines = [];
          ex.entries.forEach(e => {
            const meta = TAGS[e.tag];
            if (!meta || e.val == null || e.val === '') return;
            const [label, conv] = meta;
            const v = conv(e.val);
            if (v !== '' && v != null) lines.push(label + '：' + v);
          });
          if (ex.gps) {
            const dec = gpsDecimal(ex.gps);
            if (dec) lines.push('GPS 坐标：' + dec);
          }
          if (lines.length) out.textContent += '\n' + lines.join('\n');
          else note.textContent = 'EXIF 存在但无常用字段。';
        }).catch(() => { note.textContent = '读取文件失败。'; });
      };
    }
  });
})();

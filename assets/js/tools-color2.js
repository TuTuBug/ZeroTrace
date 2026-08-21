/* ============ 颜色 / 转换 补充 ============ */
(function () {
  const T = window.TB;

  // 颜色混合
  T.register({
    id: 'color-mixer', cat: 'color', icon: '🎨', name: '颜色混合',
    desc: '按权重混合两种颜色', keywords: 'mix blend 颜色 混合',
    render: () => `
      <div class="tool-panel">
        <h2>🎨 颜色混合</h2>
        <p class="t-sub">选择两种颜色并调整比例，实时预览混合结果。</p>
        <div class="row"><div class="field"><label>颜色 A</label><input type="color" id="mx-a" value="#6d7dff" class="color-input"></div>
        <div class="field"><label>颜色 B</label><input type="color" id="mx-b" value="#34d6b5" class="color-input"></div></div>
        <div class="field"><label>颜色 A 占比：<span id="mx-rv">50</span>%</label><input type="range" id="mx-r" min="0" max="100" value="50"></div>
        <div class="swatch" id="mx-prev" style="height:90px"></div>
        <div class="field"><label>结果 HEX</label><div class="out" id="mx-out"></div></div>
      </div>`,
    init: (r) => {
      const go = () => {
        const a = hexToRgb(r.querySelector('#mx-a').value), b = hexToRgb(r.querySelector('#mx-b').value), t = +r.querySelector('#mx-r').value / 100;
        r.querySelector('#mx-rv').textContent = Math.round(t * 100);
        const hex = rgbToHex(Math.round(a.r * (1 - t) + b.r * t), Math.round(a.g * (1 - t) + b.g * t), Math.round(a.b * (1 - t) + b.b * t));
        r.querySelector('#mx-prev').style.background = `linear-gradient(90deg, ${r.querySelector('#mx-a').value} 0%, ${hex} 50%, ${r.querySelector('#mx-b').value} 100%)`;
        r.querySelector('#mx-out').textContent = hex;
      };
      r.querySelectorAll('input').forEach(el => el.addEventListener('input', go)); go();
    }
  });

  // 生成真实 ICO（256x256 正方形，32bit BGRA）
  function makeICO(canvas) {
    const size = 256;
    const c = document.createElement('canvas'); c.width = c.height = size;
    const ctx = c.getContext('2d');
    const s = Math.min(canvas.width, canvas.height);
    ctx.drawImage(canvas, (canvas.width - s) / 2, (canvas.height - s) / 2, s, s, 0, 0, size, size);
    const img = ctx.getImageData(0, 0, size, size).data;
    const px = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) { px[i * 4] = img[i * 4 + 2]; px[i * 4 + 1] = img[i * 4 + 1]; px[i * 4 + 2] = img[i * 4]; px[i * 4 + 3] = img[i * 4 + 3]; }
    const andMask = new Uint8Array(Math.ceil(size / 32) * 4 * size);
    const header = new Uint8Array(6 + 16 + 40 + px.length + andMask.length);
    const dv = new DataView(header.buffer);
    dv.setUint16(0, 0, true); dv.setUint16(2, 1, true); dv.setUint16(4, 1, true);
    dv.setUint8(6, size); dv.setUint8(7, size); dv.setUint16(10, 1, true); dv.setUint16(12, 32, true); dv.setUint32(14, 40 + px.length + andMask.length, true);
    dv.setUint32(18, 40, true); dv.setInt32(22, size, true); dv.setInt32(26, size * 2, true);
    dv.setUint16(30, 1, true); dv.setUint16(32, 32, true); dv.setUint32(38, px.length, true); dv.setUint32(42, andMask.length, true);
    header.set(px, 54); header.set(andMask, 54 + px.length);
    return new Blob([header], { type: 'image/x-icon' });
  }

  // 生成真实 BMP（32bit BGRA，top-down，行按 4 字节对齐天然满足）
  function makeBMP(canvas) {
    const w = canvas.width, h = canvas.height;
    const img = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    const px = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      px[i * 4] = img[i * 4 + 2]; px[i * 4 + 1] = img[i * 4 + 1]; px[i * 4 + 2] = img[i * 4]; px[i * 4 + 3] = img[i * 4 + 3];
    }
    const header = new Uint8Array(14 + 40 + px.length);
    const dv = new DataView(header.buffer);
    dv.setUint16(0, 0x4d42, true);            // 'BM'
    dv.setUint32(2, header.length, true);     // 文件大小
    dv.setUint32(10, 54, true);               // 像素数据偏移
    dv.setUint32(14, 40, true);               // BITMAPINFOHEADER
    dv.setInt32(18, w, true);
    dv.setInt32(22, -h, true);                // 负高度 = top-down
    dv.setUint16(26, 1, true);                // planes
    dv.setUint16(28, 32, true);               // 32bit
    dv.setUint32(30, 0, true);                // BI_RGB
    dv.setUint32(34, px.length, true);        // 图像数据大小
    header.set(px, 54);
    return new Blob([header], { type: 'image/bmp' });
  }

  // 图片格式转换
  T.register({
    id: 'image-convert', cat: 'conv', icon: '🔁', name: '图片格式转换',
    desc: 'PNG/JPG/WEBP/BMP/GIF/ICO/SVG 互转', keywords: 'convert 图片 格式 转换 png jpg webp ico',
    render: () => `
      <div class="tool-panel">
        <h2>🔁 图片格式转换</h2>
        <p class="t-sub">本地转换，图片不会上传。选图即看原图，转换后实时对比（HEIC/TIFF 等需专用解码器，暂不支持）。</p>
        <div class="field"><label>选择图片</label><input type="file" id="cv-file" accept="image/*,.svg"></div>
        <div class="row"><div class="field"><label>目标格式</label><select id="cv-fmt"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WEBP</option><option value="image/bmp">BMP</option><option value="image/gif">GIF</option><option value="ico">ICO</option></select></div>
        <div class="field"><label>质量（JPG/WEBP，0-1）</label><input type="number" id="cv-q" value="0.92" step="0.01" min="0.1" max="1"></div></div>
        <div class="btn-row"><button class="btn" id="cv-go" disabled>转换</button><button class="btn secondary" id="cv-dl" disabled>下载</button></div>
        <div class="cmp-grid" id="cv-cmp" hidden>
          <div class="cmp-card">
            <div class="cmp-title"><span>原图</span><span class="cmp-meta" id="cv-osz"></span></div>
            <div class="cmp-img-box"><img class="cmp-img" id="cv-orig" alt="原图"></div>
            <div class="cmp-meta" id="cv-odim" style="margin-top:8px"></div>
          </div>
          <div class="cmp-card">
            <div class="cmp-title"><span>转换后</span><span class="cmp-meta" id="cv-csz"></span></div>
            <div class="cmp-img-box"><img class="cmp-img" id="cv-comp" alt="转换后"></div>
            <div class="cmp-meta" id="cv-cdim" style="margin-top:8px"></div>
          </div>
        </div>
        <div class="hint" id="cv-note"></div>
      </div>`,
    init: (r) => {
      const fileIn = r.querySelector('#cv-file'), fmtSel = r.querySelector('#cv-fmt'), q = r.querySelector('#cv-q'), note = r.querySelector('#cv-note');
      const cmp = r.querySelector('#cv-cmp'), orig = r.querySelector('#cv-orig'), comp = r.querySelector('#cv-comp');
      const osz = r.querySelector('#cv-osz'), csz = r.querySelector('#cv-csz'), odim = r.querySelector('#cv-odim'), cdim = r.querySelector('#cv-cdim');
      const goBtn = r.querySelector('#cv-go'), dlBtn = r.querySelector('#cv-dl');
      const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB';
      let curName = 'image', curExt = 'png', curUrl = '', srcCanvas = null, srcUrl = null;
      dlBtn.onclick = () => { if (curUrl) { const a = document.createElement('a'); a.href = curUrl; a.download = curName + '.' + curExt; a.click(); } };
      fileIn.addEventListener('change', () => {
        const f = fileIn.files[0]; if (!f) return; curName = f.name.replace(/\.[^.]+$/, '');
        if (srcUrl) URL.revokeObjectURL(srcUrl);
        srcUrl = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas'); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
          c.getContext('2d').drawImage(img, 0, 0); srcCanvas = c;
          goBtn.disabled = false;
          orig.src = srcUrl; cmp.hidden = false;
          osz.textContent = fmtSize(f.size); odim.textContent = `尺寸 ${c.width} × ${c.height}`; note.textContent = '';
        };
        img.onerror = () => { note.textContent = '无法解码该文件（HEIC/TIFF 等需专用解码器，暂不支持）。'; };
        img.src = srcUrl;
      });
      goBtn.onclick = () => {
        if (!srcCanvas) return;
        const target = fmtSel.value, quality = clamp(+q.value || 0.92, 0.1, 1);
        const done = (blob, ext, msg) => {
          if (curUrl) URL.revokeObjectURL(curUrl);
          curUrl = URL.createObjectURL(blob); comp.src = curUrl; cmp.hidden = false;
          curExt = ext;
          csz.textContent = fmtSize(blob.size); cdim.textContent = `格式 ${ext.toUpperCase()}`;
          note.textContent = msg || ''; dlBtn.disabled = false;
        };
        if (target === 'ico') { done(makeICO(srcCanvas), 'ico'); return; }
        if (target === 'image/bmp') { done(makeBMP(srcCanvas), 'bmp'); return; }
        // JPEG 无透明通道，先铺白底避免透明区域变黑
        let cv = srcCanvas;
        if (target === 'image/jpeg') {
          cv = document.createElement('canvas'); cv.width = srcCanvas.width; cv.height = srcCanvas.height;
          const cx = cv.getContext('2d'); cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(srcCanvas, 0, 0);
        }
        cv.toBlob(b => {
          if (!b || b.type !== target) {
            // 浏览器不支持该编码（如 GIF），toBlob 会静默回退为 PNG
            srcCanvas.toBlob(p => {
              if (!p) { note.textContent = '转换失败，请更换格式重试。'; return; }
              done(p, 'png', '当前浏览器不支持编码为 ' + (target === 'image/gif' ? 'GIF' : target) + '，已回退为 PNG。');
            }, 'image/png');
            return;
          }
          done(b, target.split('/')[1].replace('jpeg', 'jpg'));
        }, target, (target === 'image/png') ? undefined : quality);
      };
    }
  });
})();

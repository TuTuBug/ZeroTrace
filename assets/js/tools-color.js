/* ============ 颜色 / 图像工具 ============ */
(function () {
  const T = window.TB;

  // 1. 颜色转换
  T.register({
    id: 'color-converter', cat: 'color', icon: '🎨', name: '颜色转换',
    desc: 'HEX / RGB / HSL 互转', keywords: 'color hex rgb hsl 转换 颜色',
    render: () => `
      <div class="tool-panel"><h2>🎨 颜色转换（HEX / RGB / HSL）</h2>
      <div class="preview-box" style="margin-bottom:16px"><div id="cc-prev" style="width:100%;height:80px;border-radius:10px;background:#6d7dff"></div></div>
      <div class="grid-3">
        <div class="field"><label>HEX</label><input type="text" id="cc-hex" value="#6d7dff"></div>
        <div class="field"><label>R G B</label><input type="text" id="cc-rgb" value="109, 125, 255"></div>
        <div class="field"><label>H S L</label><input type="text" id="cc-hsl" value="232, 100%, 71%"></div>
      </div>
      <div class="hint">修改任意一项，其余自动同步。RGB 范围 0-255，HSL 为 角度/百分比。</div></div>`,
    init: (r) => {
      const prev = r.querySelector('#cc-prev'), hex = r.querySelector('#cc-hex'), rgb = r.querySelector('#cc-rgb'), hsl = r.querySelector('#cc-hsl');
      const setAll = (h) => {
        h = h.replace('#', ''); const { r, g, b } = hexToRgb(h); const { h: hh, s, l } = rgbToHsl(r, g, b);
        prev.style.background = '#' + h; hex.value = '#' + h; rgb.value = `${r}, ${g}, ${b}`; hsl.value = `${hh}, ${s}%, ${l}%`;
      };
      hex.onchange = () => { try { setAll(hex.value.trim()); } catch (e) {} };
      rgb.onchange = () => { const [r, g, b] = rgb.value.split(',').map(x => +x); if ([r, g, b].every(n => n >= 0 && n <= 255)) setAll(rgbToHex(r, g, b)); };
      hsl.onchange = () => { const m = hsl.value.match(/([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/); if (m) { const { r, g, b } = hslToRgb(+m[1], +m[2], +m[3]); setAll(rgbToHex(r, g, b)); } };
      setAll('#6d7dff');
    }
  });

  // 2. 调色板生成
  T.register({
    id: 'palette', cat: 'color', icon: '🌈', name: '调色板生成',
    desc: '基于基色生成协调配色', keywords: 'palette color 调色板 配色',
    render: () => `
      <div class="tool-panel"><h2>🌈 调色板生成</h2>
      <div class="row"><div class="field" style="max-width:200px"><label>基色</label><input type="color" id="pl-base" class="color-input" value="#6d7dff"></div></div>
      <div class="field"><label>配色方案</label><div id="pl-out"></div></div></div>`,
    init: (r) => {
      const base = r.querySelector('#pl-base'), out = r.querySelector('#pl-out');
      const rot = (h, s, l, dh) => { const nh = (h + dh) % 360; return rgbToHex(...Object.values(hslToRgb(nh, s, l))); };
      const build = () => {
        const { r, g, b } = hexToRgb(base.value); const { h, s, l } = rgbToHsl(r, g, b);
        const schemes = {
          '互补': [0, 180], '类似（±30）': [-30, 0, 30], '三角': [0, 120, 240],
          '分裂互补': [0, 150, 210], '四角': [0, 90, 180, 270],
        };
        let html = '';
        for (const [name, diffs] of Object.entries(schemes)) {
          html += `<div style="margin-bottom:14px"><div class="t-desc" style="margin-bottom:6px">${name}</div><div class="swatch-row">`;
          diffs.forEach(d => { const c = rot(h, s, l, d); html += `<div class="swatch-card" data-copy="${c}"><div class="c" style="background:${c}"></div><div class="l">${c}</div></div>`; });
          html += `</div></div>`;
        }
        out.innerHTML = html;
        out.querySelectorAll('[data-copy]').forEach(el => el.onclick = () => copyText(el.dataset.copy, '已复制 ' + el.dataset.copy));
      };
      base.oninput = build; build();
    }
  });

  // 3. 对比度检查
  T.register({
    id: 'contrast', cat: 'color', icon: '⚖️', name: '对比度检查',
    desc: 'WCAG 文字/背景对比度', keywords: 'contrast wcag 对比度 可访问性',
    render: () => `
      <div class="tool-panel"><h2>⚖️ 对比度检查（WCAG）</h2>
      <div class="row">
        <div class="field" style="max-width:160px"><label>前景色</label><input type="color" id="ct-fg" class="color-input" value="#111111"></div>
        <div class="field" style="max-width:160px"><label>背景色</label><input type="color" id="ct-bg" class="color-input" value="#6d7dff"></div>
      </div>
      <div class="field"><label>对比度比值</label><div class="out" id="ct-ratio"></div></div>
      <div class="preview-box" id="ct-prev" style="margin:8px 0"></div>
      <div id="ct-res"></div></div>`,
    init: (r) => {
      const fg = r.querySelector('#ct-fg'), bg = r.querySelector('#ct-bg'), ratio = r.querySelector('#ct-ratio'), prev = r.querySelector('#ct-prev'), res = r.querySelector('#ct-res');
      const up = () => {
        const f = hexToRgb(fg.value), b = hexToRgb(bg.value);
        const L1 = relLum(f.r, f.g, f.b), L2 = relLum(b.r, b.g, b.b);
        const R = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        ratio.textContent = R.toFixed(2) + ' : 1';
        prev.style.background = bg.value; prev.style.color = fg.value; prev.style.fontSize = '20px'; prev.fontWeight = '700';
        prev.textContent = '示例文字 Aa 中文对比 123';
        const pass = (n) => R >= n ? `<span style="color:var(--ok)">✓ 通过</span>` : `<span style="color:var(--danger)">✗ 不通过</span>`;
        res.innerHTML = `<div class="kv"><span class="k">普通文本（≥4.5）</span><span class="v">${pass(4.5)}</span></div>
          <div class="kv"><span class="k">大文本（≥3.0）</span><span class="v">${pass(3)}</span></div>
          <div class="kv"><span class="k">图形 / UI 元素（≥3.0）</span><span class="v">${pass(3)}</span></div>`;
      };
      fg.oninput = up; bg.oninput = up; up();
    }
  });

  // 4. 颜色明暗
  T.register({
    id: 'shades', cat: 'color', icon: '🟪', name: '颜色明暗',
    desc: '生成同色系深浅变化', keywords: 'shades tints 明暗 渐变 同色系',
    render: () => `
      <div class="tool-panel"><h2>🟪 颜色明暗生成</h2>
      <div class="row"><div class="field" style="max-width:200px"><label>基色</label><input type="color" id="sh-base" class="color-input" value="#6d7dff"></div></div>
      <div class="field"><label>浅色（向白）/ 深色（向黑）</label><div class="swatch-row" id="sh-out"></div></div></div>`,
    init: (r) => {
      const base = r.querySelector('#sh-base'), out = r.querySelector('#sh-out');
      const mix = (c1, c2, t) => rgbToHex(c1.r + (c2.r - c1.r) * t, c1.g + (c2.g - c1.g) * t, c1.b + (c2.b - c1.b) * t);
      const build = () => {
        const c = hexToRgb(base.value), white = { r: 255, g: 255, b: 255 }, black = { r: 0, g: 0, b: 0 };
        let html = '';
        for (let i = 4; i >= 1; i--) { const t = i / 5; const col = mix(c, white, t); html += `<div class="swatch-card" data-copy="${col}"><div class="c" style="background:${col}"></div><div class="l">${col}</div></div>`; }
        html += `<div class="swatch-card" data-copy="${base.value}"><div class="c" style="background:${base.value}"></div><div class="l">base</div></div>`;
        for (let i = 1; i <= 4; i++) { const t = i / 5; const col = mix(c, black, t); html += `<div class="swatch-card" data-copy="${col}"><div class="c" style="background:${col}"></div><div class="l">${col}</div></div>`; }
        out.innerHTML = html;
        out.querySelectorAll('[data-copy]').forEach(el => el.onclick = () => copyText(el.dataset.copy, '已复制'));
      };
      base.oninput = build; build();
    }
  });

  // 5. 图片转 Base64
  T.register({
    id: 'img-base64', cat: 'color', icon: '🖼️', name: '图片转 Base64',
    desc: '本地图片 → Data URL', keywords: 'image base64 dataurl 图片',
    render: () => `
      <div class="tool-panel"><h2>🖼️ 图片转 Base64</h2><p class="t-sub">图片仅在本地读取，不会上传。</p>
      <div class="field"><label>选择图片</label><input type="file" id="ib-file" accept="image/*"></div>
      <div class="cmp-img-box" style="max-width:220px;margin-bottom:12px"><img class="cmp-img" id="ib-prev" alt="预览" style="display:none"></div>
      <div class="field"><label>Data URL（可直接用于 &lt;img src&gt;）</label><textarea id="ib-out" readonly style="min-height:120px"></textarea></div>
      <div class="btn-row"><button class="btn secondary" id="ib-copy">复制</button></div></div>`,
    init: (r) => {
      const file = r.querySelector('#ib-file'), out = r.querySelector('#ib-out'), prev = r.querySelector('#ib-prev');
      file.onchange = () => {
        const f = file.files[0]; if (!f) return;
        const rd = new FileReader();
        rd.onload = () => { out.value = rd.result; prev.src = rd.result; prev.style.display = 'block'; };
        rd.readAsDataURL(f);
      };
      r.querySelector('#ib-copy').onclick = () => copyText(out.value, '已复制');
    }
  });

  // 6. 占位图生成
  T.register({
    id: 'placeholder', cat: 'color', icon: '📦', name: '占位图生成',
    desc: '生成 SVG 占位图', keywords: 'placeholder 占位图 svg',
    render: () => `
      <div class="tool-panel"><h2>📦 占位图生成</h2>
      <div class="row">
        <div class="field"><label>宽</label><input type="number" id="ph-w" value="400"></div>
        <div class="field"><label>高</label><input type="number" id="ph-h" value="300"></div>
        <div class="field"><label>文字</label><input type="text" id="ph-t" value="400 × 300"></div>
      </div>
      <div class="row">
        <div class="field" style="max-width:140px"><label>背景</label><input type="color" id="ph-bg" class="color-input" value="#cccccc"></div>
        <div class="field" style="max-width:140px"><label>前景</label><input type="color" id="ph-fg" class="color-input" value="#555555"></div>
      </div>
      <div class="btn-row"><button class="btn" id="ph-go">生成</button><button class="btn secondary" id="ph-copy">复制 SVG</button></div>
      <div class="preview-box" id="ph-box"></div>
      <div class="field"><label>SVG 代码</label><textarea id="ph-out" readonly style="min-height:90px"></textarea></div></div>`,
    init: (r) => {
      const w = r.querySelector('#ph-w'), h = r.querySelector('#ph-h'), t = r.querySelector('#ph-t'), bg = r.querySelector('#ph-bg'), fg = r.querySelector('#ph-fg'), box = r.querySelector('#ph-box'), out = r.querySelector('#ph-out');
      const gen = () => {
        const sw = clamp(+w.value || 0, 1, 4000), sh = clamp(+h.value || 0, 1, 4000);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}" viewBox="0 0 ${sw} ${sh}"><rect width="100%" height="100%" fill="${bg.value}"/><text x="50%" y="50%" fill="${fg.value}" font-family="sans-serif" font-size="${Math.min(sw, sh) / 8}" text-anchor="middle" dominant-baseline="middle">${esc(t.value || (sw + ' × ' + sh))}</text></svg>`;
        out.value = svg; box.innerHTML = svg; box.querySelector('svg').style.maxWidth = '100%'; box._svg = svg;
      };
      [w, h, t, bg, fg].forEach(e => e.addEventListener('input', gen));
      r.querySelector('#ph-go').onclick = gen;
      r.querySelector('#ph-copy').onclick = () => copyText(out.value, '已复制');
      gen();
    }
  });

  // 7. 宽高比
  T.register({
    id: 'aspect', cat: 'color', icon: '📐', name: '宽高比计算',
    desc: '简化宽高比 / 反推尺寸', keywords: 'aspect ratio 宽高比 比例',
    render: () => `
      <div class="tool-panel"><h2>📐 宽高比计算</h2>
      <div class="row">
        <div class="field"><label>宽度</label><input type="number" id="ar-w" value="1920"></div>
        <div class="field"><label>高度</label><input type="number" id="ar-h" value="1080"></div>
      </div>
      <div class="field"><label>宽高比</label><div class="out" id="ar-ratio"></div></div>
      <div class="field"><label>已知比例，求另一维度</label>
        <div class="row">
          <div class="field"><label>比例（如 16:9）</label><input type="text" id="ar-fix" value="16:9"></div>
          <div class="field"><label>已知宽度</label><input type="number" id="ar-kw" placeholder="留空则填高度"></div>
          <div class="field"><label>已知高度</label><input type="number" id="ar-kh" placeholder="留空则填宽度"></div>
        </div>
        <div class="out" id="ar-calc"></div>
      </div></div>`,
    init: (r) => {
      const w = r.querySelector('#ar-w'), h = r.querySelector('#ar-h'), ratio = r.querySelector('#ar-ratio');
      const gcd = (a, b) => b ? gcd(b, a % b) : a;
      const up = () => {
        const W = +w.value, H = +h.value;
        if (W && H) { const g = gcd(W, H); ratio.textContent = `${W}:${H}  →  ${W / g}:${H / g}`; }
      };
      w.oninput = up; h.oninput = up; up();
      const fix = r.querySelector('#ar-fix'), kw = r.querySelector('#ar-kw'), kh = r.querySelector('#ar-kh'), calc = r.querySelector('#ar-calc');
      const run = () => {
        const m = fix.value.match(/([\d.]+)\s*[:x]\s*([\d.]+)/);
        if (!m) { calc.textContent = ''; return; }
        const rw = +m[1], rh = +m[2];
        if (kw.value) { const v = kw.value * rh / rw; calc.textContent = `高度 = ${fmt(v)}`; }
        else if (kh.value) { const v = kh.value * rw / rh; calc.textContent = `宽度 = ${fmt(v)}`; }
        else calc.textContent = '请填写已知宽度或高度';
      };
      [fix, kw, kh].forEach(e => e.addEventListener('input', run)); run();
    }
  });

  // 8. 取色器（图片吸管）
  T.register({
    id: 'eyedropper', cat: 'color', icon: '💉', name: '图片取色',
    desc: '上传图片后取色', keywords: 'eyedropper color picker 取色 吸管',
    render: () => `
      <div class="tool-panel"><h2>💉 图片取色器</h2><p class="t-sub">上传图片，点击任意位置获取颜色（也可直接用取色器选色）。</p>
      <div class="field"><label>上传图片</label><input type="file" id="ed-file" accept="image/*"></div>
      <div class="field"><label>点击图片取色</label><canvas id="ed-canvas" style="max-width:100%;border-radius:10px;cursor:crosshair;display:none"></canvas></div>
      <div class="row">
        <div class="field" style="max-width:160px"><label>或直接选色</label><input type="color" id="ed-color" class="color-input" value="#6d7dff"></div>
      </div>
      <div class="field"><label>选中颜色</label><div class="out" id="ed-out"></div></div></div>`,
    init: (r) => {
      const file = r.querySelector('#ed-file'), canvas = r.querySelector('#ed-canvas'), color = r.querySelector('#ed-color'), out = r.querySelector('#ed-out');
      const show = (hex) => { const { r, g, b } = hexToRgb(rgbToHex(...Object.values(hexToRgb(hex)))); out.textContent = `HEX ${hex}  |  RGB ${r}, ${g}, ${b}  |  HSL ${rgbToHsl(r, g, b).h}, ${rgbToHsl(r, g, b).s}%, ${rgbToHsl(r, g, b).l}%`; };
      file.onchange = () => {
        const f = file.files[0]; if (!f) return;
        const img = new Image(); img.onload = () => {
          const max = 800; const sc = Math.min(1, max / Math.max(img.width, img.height));
          canvas.width = img.width * sc; canvas.height = img.height * sc;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.style.display = 'block';
        };
        img.src = URL.createObjectURL(f);
      };
      canvas.onclick = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * canvas.width / rect.width;
        const y = (e.clientY - rect.top) * canvas.height / rect.height;
        const d = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
        const hex = rgbToHex(d[0], d[1], d[2]); show(hex); color.value = hex;
      };
      color.oninput = () => show(color.value);
      show(color.value);
    }
  });

  // 9. 图片压缩
  T.register({
    id: 'img-compress', cat: 'color', icon: '🗜️', name: '图片压缩',
    desc: 'Canvas 重编码减小体积，原图/压缩后大小实时对比', keywords: 'compress image 压缩 图片 体积对比',
    render: () => `
      <div class="tool-panel"><h2>🗜️ 图片压缩</h2><p class="t-sub">通过 Canvas 重新编码（有损），本地处理不上传。压缩前/后大小一目了然。</p>
      <div class="field"><label>选择图片</label><input type="file" id="ic-file" accept="image/*"></div>
      <div id="ic-fname" class="muted" style="margin:-8px 0 12px;font-size:12.5px"></div>
      <div class="row">
        <div class="field"><label>输出格式</label><select id="ic-fmt"><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/png">PNG（无损）</option></select></div>
        <div class="field"><label>压缩质量：<span id="ic-qval">70</span>%</label><input type="range" id="ic-q" min="10" max="100" value="70" style="width:100%;accent-color:var(--accent)"></div>
      </div>
      <div class="btn-row"><button class="btn" id="ic-go">开始压缩</button><button class="btn secondary" id="ic-dl" hidden>下载压缩图</button></div>
      <div class="cmp-grid" id="ic-cmp" hidden>
        <div class="cmp-card">
          <div class="cmp-title"><span>原图</span></div>
          <div class="cmp-img-box"><img class="cmp-img" id="ic-orig" alt="原图"></div>
          <div class="cmp-rows">
            <div><span>尺寸</span><b id="ic-odim">--</b></div>
            <div><span>大小</span><b id="ic-osz">--</b></div>
            <div><span>格式</span><b id="ic-ofmt">--</b></div>
          </div>
        </div>
        <div class="cmp-card">
          <div class="cmp-title"><span>压缩后</span></div>
          <div class="cmp-img-box"><img class="cmp-img" id="ic-comp" alt="压缩后"></div>
          <div class="cmp-rows">
            <div><span>尺寸</span><b id="ic-cdim">--</b></div>
            <div><span>大小</span><b id="ic-csz">--</b></div>
            <div><span>格式</span><b id="ic-cfmt">--</b></div>
          </div>
        </div>
      </div>
      <div class="out" id="ic-info"></div></div>`,
    init: (r) => {
      const file = r.querySelector('#ic-file'), fmtSel = r.querySelector('#ic-fmt'), q = r.querySelector('#ic-q'), qval = r.querySelector('#ic-qval'), go = r.querySelector('#ic-go'), dl = r.querySelector('#ic-dl'), info = r.querySelector('#ic-info'), fname = r.querySelector('#ic-fname');
      const cmp = r.querySelector('#ic-cmp'), orig = r.querySelector('#ic-orig'), comp = r.querySelector('#ic-comp');
      const osz = r.querySelector('#ic-osz'), csz = r.querySelector('#ic-csz'), odim = r.querySelector('#ic-odim'), cdim = r.querySelector('#ic-cdim'), ofmt = r.querySelector('#ic-ofmt'), cfmt = r.querySelector('#ic-cfmt');
      const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB';
      const fmtLabel = v => v === 'image/jpeg' ? 'JPEG' : v === 'image/webp' ? 'WEBP' : 'PNG';
      let resultUrl = null, origUrl = null, rawSize = 0;
      q.oninput = () => { qval.textContent = q.value; };
      file.onchange = () => {
        const f = file.files[0]; if (!f) return;
        if (origUrl) URL.revokeObjectURL(origUrl);
        origUrl = URL.createObjectURL(f);
        orig.src = origUrl;
        rawSize = f.size;
        fname.textContent = f.name + '（' + fmtSize(f.size) + '）';
        cmp.hidden = false;
        osz.textContent = fmtSize(f.size);
        ofmt.textContent = (f.type.split('/')[1] || '').toUpperCase();
        const img = new Image();
        img.onload = () => { odim.textContent = img.naturalWidth + ' × ' + img.naturalHeight + ' px'; };
        img.src = origUrl;
        info.textContent = '';
      };
      go.onclick = () => {
        const f = file.files[0]; if (!f) { info.textContent = '请先选择图片'; return; }
        const img = new Image();
        img.onload = () => {
          const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
          cv.getContext('2d').drawImage(img, 0, 0);
          cv.toBlob(blob => {
            if (resultUrl) URL.revokeObjectURL(resultUrl);
            resultUrl = URL.createObjectURL(blob);
            comp.src = resultUrl;
            cmp.hidden = false;
            csz.textContent = fmtSize(blob.size);
            cdim.textContent = cv.width + ' × ' + cv.height + ' px';
            cfmt.textContent = fmtLabel(fmtSel.value);
            const ratio = (1 - blob.size / rawSize) * 100;
            const saved = ratio >= 0;
            info.className = 'out ok';
            info.innerHTML = `<div class="cmp-stat">
              <div class="s-before">压缩前：<b>${fmtSize(rawSize)}</b></div>
              <div class="s-arr">→</div>
              <div class="s-after">压缩后：<b>${fmtSize(blob.size)}</b></div>
              <div class="s-pct ${saved ? 'cmp-save' : 'cmp-grow'}">${saved ? '↓ 减小' : '↑ 增大'} ${Math.abs(ratio).toFixed(1)}%</div>
            </div>`;
            dl.hidden = false;
          }, fmtSel.value, +q.value / 100);
        };
        img.src = URL.createObjectURL(f);
      };
      dl.onclick = () => { if (resultUrl) { const a = document.createElement('a'); a.href = resultUrl; a.download = 'compressed.' + (fmtSel.value === 'image/png' ? 'png' : fmtSel.value === 'image/webp' ? 'webp' : 'jpg'); a.click(); } };
    }
  });

  // 10. 图片缩放
  T.register({
    id: 'img-resize', cat: 'color', icon: '🔍', name: '图片缩放',
    desc: '按比例缩放图片尺寸', keywords: 'resize image 缩放 图片',
    render: () => `
      <div class="tool-panel"><h2>🔍 图片缩放</h2><p class="t-sub">本地处理不上传，选图即看原图，缩放后实时对比。</p>
      <div class="field"><label>选择图片</label><input type="file" id="ir-file" accept="image/*"></div>
      <div class="row">
        <div class="field"><label>目标宽度</label><input type="number" id="ir-w" placeholder="自动按比例"></div>
        <div class="field"><label>目标高度</label><input type="number" id="ir-h" placeholder="自动按比例"></div>
      </div>
      <div class="btn-row"><button class="btn" id="ir-go">缩放</button><button class="btn secondary" id="ir-dl" hidden>下载</button></div>
      <div class="cmp-grid" id="ir-cmp" hidden>
        <div class="cmp-card">
          <div class="cmp-title"><span>原图</span><span class="cmp-meta" id="ir-osz"></span></div>
          <div class="cmp-img-box"><img class="cmp-img" id="ir-orig" alt="原图"></div>
          <div class="cmp-meta" id="ir-odim" style="margin-top:8px"></div>
        </div>
        <div class="cmp-card">
          <div class="cmp-title"><span>缩放后</span><span class="cmp-meta" id="ir-csz"></span></div>
          <div class="cmp-img-box"><img class="cmp-img" id="ir-comp" alt="缩放后"></div>
          <div class="cmp-meta" id="ir-cdim" style="margin-top:8px"></div>
        </div>
      </div>
      <div class="out" id="ir-info"></div></div>`,
    init: (r) => {
      const file = r.querySelector('#ir-file'), w = r.querySelector('#ir-w'), h = r.querySelector('#ir-h'), go = r.querySelector('#ir-go'), dl = r.querySelector('#ir-dl'), info = r.querySelector('#ir-info');
      const cmp = r.querySelector('#ir-cmp'), orig = r.querySelector('#ir-orig'), comp = r.querySelector('#ir-comp');
      const osz = r.querySelector('#ir-osz'), csz = r.querySelector('#ir-csz'), odim = r.querySelector('#ir-odim'), cdim = r.querySelector('#ir-cdim');
      let url = null, origUrl = null, curFile = null;
      file.onchange = () => {
        const f = file.files[0]; if (!f) return; curFile = f;
        if (origUrl) URL.revokeObjectURL(origUrl);
        origUrl = URL.createObjectURL(f); orig.src = origUrl; cmp.hidden = false;
        osz.textContent = fmt(f.size / 1024) + ' KB';
        const img = new Image(); img.onload = () => { odim.textContent = `尺寸 ${img.naturalWidth} × ${img.naturalHeight}`; }; img.src = origUrl;
        info.textContent = '';
      };
      go.onclick = () => {
        const f = curFile || file.files[0]; if (!f) { info.textContent = '请先选择图片'; return; }
        const tw = +w.value, th = +h.value;
        if (!tw && !th) { info.textContent = '请填写目标宽度或高度'; return; }
        const img = new Image(); img.onload = () => {
          const ow = img.naturalWidth, oh = img.naturalHeight;
          const W = tw || Math.round(oh * (th / oh)), H = th || Math.round(ow * (tw / ow));
          const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
          cv.getContext('2d').drawImage(img, 0, 0, W, H);
          cv.toBlob(blob => {
            if (url) URL.revokeObjectURL(url);
            url = URL.createObjectURL(blob); comp.src = url; cmp.hidden = false;
            csz.textContent = fmt(blob.size / 1024) + ' KB';
            cdim.textContent = `尺寸 ${W} × ${H}`;
            const ratio = (1 - blob.size / f.size) * 100, saved = ratio >= 0;
            info.className = 'out ok';
            info.innerHTML = `<div class="cmp-stat"><div class="s-before">原大小：<b>${fmt(f.size / 1024)} KB</b></div><div class="s-arr">→</div><div class="s-after">缩放后：<b>${fmt(blob.size / 1024)} KB</b></div><div class="s-pct ${saved ? 'cmp-save' : 'cmp-grow'}">${saved ? '↓ 减小' : '↑ 增大'} ${Math.abs(ratio).toFixed(1)}%</div></div>`;
            dl.hidden = false;
          }, 'image/png');
        };
        img.src = URL.createObjectURL(f);
      };
      dl.onclick = () => { if (url) { const a = document.createElement('a'); a.href = url; a.download = 'resized.png'; a.click(); } };
    }
  });
})();

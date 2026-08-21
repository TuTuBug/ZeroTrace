/* ============ 开发生成器 / 媒体生成 ============ */
(function () {
  const T = window.TB;

  // 条形码
  T.register({
    id: 'barcode', cat: 'dev', icon: '🔖', name: '条形码生成',
    desc: '生成 Code128 / EAN13 / UPC / Code39 条形码', keywords: 'barcode 条形码 生成 code128',
    render: () => `
      <div class="tool-panel">
        <h2>🔖 条形码生成</h2>
        <p class="t-sub">在浏览器本地生成可扫描的条形码（基于 JsBarcode）。</p>
        <div class="field"><label>内容</label><input type="text" id="bc-text" value="TOOLBOX-2026"></div>
        <div class="row"><div class="field"><label>格式</label><select id="bc-fmt"><option value="CODE128">CODE128</option><option value="CODE39">CODE39</option><option value="EAN13">EAN13</option><option value="UPC">UPC</option></select></div>
        <div class="field"><label>前景色</label><input type="color" id="bc-fg" value="#000000" class="color-input"></div>
        <div class="field"><label>背景色</label><input type="color" id="bc-bg" value="#ffffff" class="color-input"></div></div>
        <div class="btn-row"><button class="btn" id="bc-go">生成</button><button class="btn secondary" id="bc-dl">下载 SVG</button></div>
        <div class="preview-box" id="bc-box"><span class="muted">点击生成</span></div>
      </div>`,
    init: (r) => {
      if (typeof JsBarcode === 'undefined') { r.querySelector('#bc-box').innerHTML = '<span style="color:var(--danger)">条形码库未加载</span>'; return; }
      const box = r.querySelector('#bc-box');
      const go = () => {
        box.innerHTML = '<svg id="bc-svg"></svg>';
        try {
          JsBarcode('#bc-svg', r.querySelector('#bc-text').value, {
            format: r.querySelector('#bc-fmt').value,
            lineColor: r.querySelector('#bc-fg').value, width: 2, height: 90, margin: 10,
            background: r.querySelector('#bc-bg').value, displayValue: true, valid: () => {}
          });
          box._svg = box.querySelector('#bc-svg').outerHTML;
        } catch (e) { box.innerHTML = '<span style="color:var(--danger)">生成失败：' + esc(e.message) + '（EAN13/UPC 需合法位数字）</span>'; }
      };
      r.querySelectorAll('#bc-text,#bc-fmt,#bc-fg,#bc-bg').forEach(el => el.addEventListener('input', go));
      r.querySelector('#bc-go').onclick = go;
      r.querySelector('#bc-dl').onclick = () => { if (!box._svg) return; const b = new Blob([box._svg], { type: 'image/svg+xml' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'barcode.svg'; a.click(); };
      go();
    }
  });

  // CSS clip-path
  T.register({
    id: 'clip-path', cat: 'dev', icon: '✂️', name: 'Clip-Path 生成',
    desc: '生成各种裁剪路径并实时预览', keywords: 'clip path 裁剪 形状',
    render: () => `
      <div class="tool-panel">
        <h2>✂️ Clip-Path 生成器</h2>
        <p class="t-sub">选择形状，调节参数，复制 CSS。</p>
        <div class="field"><label>形状</label><select id="cp-shape">
          <option value="circle">圆形</option><option value="polygon">多边形</option><option value="ellipse">椭圆</option><option value="inset">圆角矩形</option></select></div>
        <div class="field"><label id="cp-l1">参数 1</label><input type="range" id="cp-p1" min="0" max="100" value="50"></div>
        <div class="field"><label id="cp-l2">参数 2</label><input type="range" id="cp-p2" min="0" max="100" value="50"></div>
        <div class="preview-box"><div id="cp-demo" class="demo-box" style="width:200px;height:200px"></div></div>
        <div class="field"><label>CSS</label><div class="out" id="cp-css"></div></div>
        <div class="btn-row"><button class="btn secondary" id="cp-copy">复制 CSS</button></div>
      </div>`,
    init: (r) => {
      const demo = r.querySelector('#cp-demo'), css = r.querySelector('#cp-css');
      const labels = { circle: ['半径 %', '中心 X%'], polygon: ['边数(近似)', '旋转°'], ellipse: ['横半径 %', '纵半径 %'], inset: ['圆角 %', '内缩 %'] };
      const go = () => {
        const sh = r.querySelector('#cp-shape').value, a = +r.querySelector('#cp-p1').value, b = +r.querySelector('#cp-p2').value;
        r.querySelector('#cp-l1').textContent = labels[sh][0]; r.querySelector('#cp-l2').textContent = labels[sh][1];
        let v;
        if (sh === 'circle') v = `circle(${a}% at 50% 50%)`;
        else if (sh === 'ellipse') v = `ellipse(${a}% ${b}% at 50% 50%)`;
        else if (sh === 'inset') v = `inset(${b}% round ${a}%)`;
        else { const sides = Math.max(3, Math.round(a / 10) + 2); let pts = []; for (let i = 0; i < sides; i++) { const ang = (i / sides) * 2 * Math.PI - Math.PI / 2 + b * Math.PI / 180; pts.push(`${(50 + 50 * Math.cos(ang)).toFixed(1)}% ${(50 + 50 * Math.sin(ang)).toFixed(1)}%`); } v = `polygon(${pts.join(', ')})`; }
        demo.style.clipPath = v; demo.style.webkitClipPath = v; css.textContent = 'clip-path: ' + v + ';';
      };
      r.querySelectorAll('#cp-shape,#cp-p1,#cp-p2').forEach(el => el.addEventListener('input', go));
      r.querySelector('#cp-copy').onclick = () => copyText(css.textContent, '已复制'); go();
    }
  });

  // CSS cubic-bezier
  T.register({
    id: 'cubic-bezier', cat: 'dev', icon: '〰️', name: '缓动曲线生成',
    desc: 'cubic-bezier 缓动曲线编辑与预览', keywords: 'cubic bezier 缓动 动画 曲线',
    render: () => `
      <div class="tool-panel">
        <h2>〰️ Cubic-Bezier 缓动</h2>
        <p class="t-sub">拖拽或输入控制点，预览动画。</p>
        <div class="row"><div class="field"><label>x1</label><input type="number" id="cb-x1" value="0.4" step="0.05" min="0" max="1"></div>
        <div class="field"><label>y1</label><input type="number" id="cb-y1" value="0" step="0.05"></div>
        <div class="field"><label>x2</label><input type="number" id="cb-x2" value="0.2" step="0.05" min="0" max="1"></div>
        <div class="field"><label>y2</label><input type="number" id="cb-y2" value="1" step="0.05"></div></div>
        <div class="preview-box" style="min-height:80px"><span id="cb-box" style="display:inline-block;width:60px;height:60px;border-radius:12px;background:var(--accent);position:relative;left:0"></span></div>
        <div class="btn-row"><button class="btn" id="cb-play">播放动画</button></div>
        <div class="field"><label>CSS</label><div class="out" id="cb-css"></div></div>
        <div class="btn-row"><button class="btn secondary" id="cb-copy">复制</button></div>
      </div>`,
    init: (r) => {
      const box = r.querySelector('#cb-box'), css = r.querySelector('#cb-css');
      const go = () => { const v = `cubic-bezier(${r.querySelector('#cb-x1').value}, ${r.querySelector('#cb-y1').value}, ${r.querySelector('#cb-x2').value}, ${r.querySelector('#cb-y2').value})`; css.textContent = 'transition-timing-function: ' + v + ';'; box.style.transition = 'none'; box.style.left = '0'; };
      r.querySelectorAll('input').forEach(el => el.addEventListener('input', go));
      r.querySelector('#cb-play').onclick = () => { box.style.transition = 'none'; box.style.left = '0'; void box.offsetWidth; box.style.transition = 'left 1.4s ' + css.textContent.replace('transition-timing-function: ', '').replace(';', ''); box.style.left = 'calc(100% - 60px)'; };
      r.querySelector('#cb-copy').onclick = () => copyText(css.textContent, '已复制'); go();
    }
  });

  // CSS transform
  T.register({
    id: 'transform', cat: 'dev', icon: '🔧', name: 'Transform 生成',
    desc: '生成 rotate/scale/skew/translate 组合', keywords: 'transform 变换 旋转 缩放',
    render: () => `
      <div class="tool-panel">
        <h2>🔧 CSS Transform 生成</h2>
        <p class="t-sub">实时调节变换参数。</p>
        <div class="grid-2">
          <div class="field"><label>旋转 rotate(°) <span id="tf-rv">0</span></label><input type="range" id="tf-r" min="-180" max="180" value="0"></div>
          <div class="field"><label>缩放 scale <span id="tf-sv">1</span></label><input type="range" id="tf-s" min="0.2" max="2" step="0.1" value="1"></div>
          <div class="field"><label>倾斜 X skewX(°) <span id="tf-xv">0</span></label><input type="range" id="tf-x" min="-60" max="60" value="0"></div>
          <div class="field"><label>倾斜 Y skewY(°) <span id="tf-yv">0</span></label><input type="range" id="tf-y" min="-60" max="60" value="0"></div>
        </div>
        <div class="preview-box"><div id="tf-demo" class="demo-box" style="width:140px;height:140px">CSS</div></div>
        <div class="field"><label>CSS</label><div class="out" id="tf-css"></div></div>
        <div class="btn-row"><button class="btn secondary" id="tf-copy">复制</button></div>
      </div>`,
    init: (r) => {
      const demo = r.querySelector('#tf-demo'), css = r.querySelector('#tf-css');
      const go = () => {
        const r1 = +r.querySelector('#tf-r').value, s = +r.querySelector('#tf-s').value, x = +r.querySelector('#tf-x').value, y = +r.querySelector('#tf-y').value;
        r.querySelector('#tf-rv').textContent = r1; r.querySelector('#tf-sv').textContent = s; r.querySelector('#tf-xv').textContent = x; r.querySelector('#tf-yv').textContent = y;
        const v = `rotate(${r1}deg) scale(${s}) skew(${x}deg, ${y}deg)`;
        demo.style.transform = v; css.textContent = 'transform: ' + v + ';';
      };
      r.querySelectorAll('input').forEach(el => el.addEventListener('input', go));
      r.querySelector('#tf-copy').onclick = () => copyText(css.textContent, '已复制'); go();
    }
  });

  // HTML 表格生成
  T.register({
    id: 'html-table', cat: 'dev', icon: '📊', name: 'HTML 表格生成',
    desc: '逗号/制表符数据转 HTML 表格', keywords: 'html table 表格 生成',
    render: () => `
      <div class="tool-panel">
        <h2>📊 HTML 表格生成</h2>
        <p class="t-sub">每行一条，单元格用逗号或制表符分隔。首行可作表头。</p>
        <div class="field"><label>数据（每行一条）</label><textarea id="ht-in" style="min-height:140px">姓名,年龄,城市
张三,28,北京
李四,32,上海</textarea></div>
        <div class="field"><label><input type="checkbox" id="ht-head" checked> 首行为表头</label></div>
        <div class="btn-row"><button class="btn" id="ht-go">生成</button><button class="btn secondary" id="ht-copy">复制</button></div>
        <div class="field"><label>HTML 代码</label><div class="out" id="ht-out" style="max-height:260px;overflow:auto"></div></div>
      </div>`,
    init: (r) => {
      const go = () => {
        const rows = r.querySelector('#ht-in').value.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.split(/[,\t]/).map(c => c.trim()));
        const head = r.querySelector('#ht-head').checked;
        let html = '<table>\n';
        rows.forEach((row, i) => {
          const tag = (head && i === 0) ? 'th' : 'td';
          html += '  <tr>' + row.map(c => `    <${tag}>${esc(c)}</${tag}>`).join('') + '</tr>\n';
        });
        html += '</table>';
        r.querySelector('#ht-out').textContent = html;
      };
      r.querySelector('#ht-go').onclick = go; r.querySelector('#ht-copy').onclick = () => copyText(r.querySelector('#ht-out').textContent, '已复制'); go();
    }
  });

  // Meta 标签生成
  T.register({
    id: 'meta-tag', cat: 'dev', icon: '🌐', name: 'Meta 标签生成',
    desc: '生成 SEO / 社交分享 meta 标签', keywords: 'meta seo og 标签 分享',
    render: () => `
      <div class="tool-panel">
        <h2>🌐 Meta 标签生成</h2>
        <p class="t-sub">填写站点信息，生成完整的 meta 标签。</p>
        <div class="grid-2">
          <div class="field"><label>标题</label><input type="text" id="mt-title" value="我的网站"></div>
          <div class="field"><label>站点地址 URL</label><input type="text" id="mt-url" value="https://example.com"></div>
          <div class="field"><label>描述</label><input type="text" id="mt-desc" value="一个很棒的网站"></div>
          <div class="field"><label>关键词(逗号分隔)</label><input type="text" id="mt-kw" value="工具,在线,免费"></div>
          <div class="field"><label>OG 图片 URL</label><input type="text" id="mt-img" value="https://example.com/og.png"></div>
          <div class="field"><label>站点类型</label><input type="text" id="mt-type" value="website"></div>
        </div>
        <div class="btn-row"><button class="btn" id="mt-go">生成</button><button class="btn secondary" id="mt-copy">复制</button></div>
        <div class="field"><label>代码</label><div class="out" id="mt-out" style="max-height:300px;overflow:auto"></div></div>
      </div>`,
    init: (r) => {
      const go = () => {
        const g = id => r.querySelector(id).value;
        const lines = [
          `<title>${esc(g('#mt-title'))}</title>`,
          `<meta name="description" content="${esc(g('#mt-desc'))}">`,
          `<meta name="keywords" content="${esc(g('#mt-kw'))}">`,
          `<meta property="og:title" content="${esc(g('#mt-title'))}">`,
          `<meta property="og:description" content="${esc(g('#mt-desc'))}">`,
          `<meta property="og:type" content="${esc(g('#mt-type'))}">`,
          `<meta property="og:url" content="${esc(g('#mt-url'))}">`,
          `<meta property="og:image" content="${esc(g('#mt-img'))}">`,
          `<meta name="twitter:card" content="summary_large_image">`
        ];
        r.querySelector('#mt-out').textContent = lines.join('\n');
      };
      r.querySelectorAll('input').forEach(el => el.addEventListener('input', go)); r.querySelector('#mt-go').onclick = go; r.querySelector('#mt-copy').onclick = () => copyText(r.querySelector('#mt-out').textContent, '已复制'); go();
    }
  });

  // robots.txt
  T.register({
    id: 'robots', cat: 'dev', icon: '🤖', name: 'Robots.txt 生成',
    desc: '生成 robots.txt 指令', keywords: 'robots seo 爬虫',
    render: () => `
      <div class="tool-panel">
        <h2>🤖 Robots.txt 生成</h2>
        <p class="t-sub">配置爬虫抓取规则。</p>
        <div class="field"><label>Disallow 路径（每行一条，留空表示允许全部）</label><textarea id="rb-dis">/admin
/private</textarea></div>
        <div class="field"><label>Sitemap URL</label><input type="text" id="rb-smap" value="https://example.com/sitemap.xml"></div>
        <div class="btn-row"><button class="btn" id="rb-go">生成</button><button class="btn secondary" id="rb-copy">复制</button></div>
        <div class="field"><label>robots.txt</label><div class="out" id="rb-out"></div></div>
      </div>`,
    init: (r) => {
      const go = () => {
        const dis = r.querySelector('#rb-dis').value.split('\n').map(l => l.trim()).filter(Boolean);
        let t = 'User-agent: *\n';
        t += dis.length ? dis.map(d => 'Disallow: ' + d).join('\n') + '\n' : 'Disallow:\n';
        const sm = r.querySelector('#rb-smap').value.trim(); if (sm) t += 'Sitemap: ' + sm + '\n';
        r.querySelector('#rb-out').textContent = t;
      };
      r.querySelectorAll('input,textarea').forEach(el => el.addEventListener('input', go)); r.querySelector('#rb-go').onclick = go; r.querySelector('#rb-copy').onclick = () => copyText(r.querySelector('#rb-out').textContent, '已复制'); go();
    }
  });

  // OG 预览
  T.register({
    id: 'og-preview', cat: 'dev', icon: '🖼️', name: '分享卡片预览',
    desc: '预览社交分享卡片效果', keywords: 'og preview 分享 卡片',
    render: () => `
      <div class="tool-panel">
        <h2>🖼️ 分享卡片预览</h2>
        <p class="t-sub">模拟社交平台的链接分享卡片。</p>
        <div class="grid-2">
          <div class="field"><label>标题</label><input type="text" id="og-t" value="一篇很棒的文章"></div>
          <div class="field"><label>来源/域名</label><input type="text" id="og-d" value="example.com"></div>
          <div class="field"><label>描述</label><input type="text" id="og-desc" value="这里是文章的简要描述，会显示在卡片下方。"></div>
          <div class="field"><label>图片 URL</label><input type="text" id="og-i" value="https://picsum.photos/600/315"></div>
        </div>
        <div class="preview-box"><div style="max-width:480px;width:100%;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--bg-card)">
          <img id="og-img" src="https://picsum.photos/600/315" style="width:100%;height:200px;object-fit:cover" onerror="this.style.display='none'">
          <div style="padding:12px 14px"><div style="font-weight:700;font-size:15px" id="og-tt"></div><div style="color:var(--text-muted);font-size:13px;margin-top:4px" id="og-dd"></div><div style="color:var(--text-muted);font-size:12px;margin-top:6px" id="og-dd2"></div></div>
        </div></div>
      </div>`,
    init: (r) => {
      const go = () => { r.querySelector('#og-tt').textContent = r.querySelector('#og-t').value; r.querySelector('#og-dd').textContent = r.querySelector('#og-desc').value; r.querySelector('#og-dd2').textContent = r.querySelector('#og-d').value; r.querySelector('#og-img').src = r.querySelector('#og-i').value; };
      r.querySelectorAll('input').forEach(el => el.addEventListener('input', go)); go();
    }
  });

  // Favicon 生成
  T.register({
    id: 'favicon', cat: 'dev', icon: '🟡', name: 'Favicon 生成',
    desc: '用文字/Emoji 生成 SVG Favicon', keywords: 'favicon 图标 生成 ico',
    render: () => `
      <div class="tool-panel">
        <h2>🟡 Favicon 生成</h2>
        <p class="t-sub">自定义图标并下载 SVG。</p>
        <div class="row"><div class="field"><label>符号(Emoji/字)</label><input type="text" id="fv-ch" value="🧰" maxlength="2"></div>
        <div class="field"><label>背景色</label><input type="color" id="fv-bg" value="#6d7dff" class="color-input"></div>
        <div class="field"><label>圆角</label><input type="range" id="fv-r" min="0" max="40" value="14"></div></div>
        <div class="preview-box"><img id="fv-img" style="width:96px;height:96px"></div>
        <div class="btn-row"><button class="btn secondary" id="fv-dl">下载 SVG</button></div>
      </div>`,
    init: (r) => {
      const go = () => {
        const ch = r.querySelector('#fv-ch').value || '?', bg = r.querySelector('#fv-bg').value, rad = r.querySelector('#fv-r').value;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${rad}" fill="${bg}"/><text x="32" y="44" font-size="38" text-anchor="middle">${esc(ch)}</text></svg>`;
        r.querySelector('#fv-img').src = 'data:image/svg+xml,' + encodeURIComponent(svg);
        r.querySelector('#fv-dl').onclick = () => { const b = new Blob([svg], { type: 'image/svg+xml' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'favicon.svg'; a.click(); };
      };
      r.querySelectorAll('input').forEach(el => el.addEventListener('input', go)); go();
    }
  });

  // SVG Blob
  T.register({
    id: 'svg-blob', cat: 'dev', icon: '💠', name: 'Blob 形状生成',
    desc: '随机生成有机 blob 形状 SVG', keywords: 'blob svg 形状 生成',
    render: () => `
      <div class="tool-panel">
        <h2>💠 Blob 形状生成</h2>
        <p class="t-sub">生成可用于背景的有机形状。</p>
        <div class="row"><div class="field"><label>颜色</label><input type="color" id="bl-c" value="#6d7dff" class="color-input"></div>
        <div class="field"><label>复杂度</label><input type="range" id="bl-n" min="4" max="12" value="6"></div>
        <div class="field"><label>不规则度</label><input type="range" id="bl-i" min="0" max="100" value="50"></div></div>
        <div class="btn-row"><button class="btn" id="bl-go">随机生成</button><button class="btn secondary" id="bl-copy">复制 SVG</button></div>
        <div class="preview-box" id="bl-box"></div>
      </div>`,
    init: (r) => {
      const box = r.querySelector('#bl-box');
      const path = (n, irr) => {
        const cx = 100, cy = 100, R = 70, pts = [];
        for (let i = 0; i < n; i++) { const a = (i / n) * 2 * Math.PI, rr = R * (1 - irr / 2 + Math.random() * irr); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
        let d = `M ${(pts[0][0] + pts[n - 1][0]) / 2} ${(pts[0][1] + pts[n - 1][1]) / 2}`;
        for (let i = 0; i < n; i++) { const c = pts[i], nx = pts[(i + 1) % n]; const mx = (c[0] + nx[0]) / 2, my = (c[1] + nx[1]) / 2; d += ` Q ${c[0].toFixed(1)} ${c[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`; }
        return d + ' Z';
      };
      const go = () => {
        const n = +r.querySelector('#bl-n').value, irr = +r.querySelector('#bl-i').value / 100, c = r.querySelector('#bl-c').value;
        const d = path(n, irr); const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="${d}" fill="${c}"/></svg>`;
        box.innerHTML = svg; box._svg = svg;
      };
      r.querySelectorAll('input').forEach(el => el.addEventListener('input', go));
      r.querySelector('#bl-go').onclick = go; r.querySelector('#bl-copy').onclick = () => copyText(box._svg || '', '已复制'); go();
    }
  });

  // SVG Wave
  T.register({
    id: 'svg-wave', cat: 'dev', icon: '🌊', name: '波浪形状生成',
    desc: '生成 SVG 波浪分隔形状', keywords: 'wave svg 波浪 分隔',
    render: () => `
      <div class="tool-panel">
        <h2>🌊 波浪形状生成</h2>
        <p class="t-sub">生成页脚/分隔常用的波浪。</p>
        <div class="row"><div class="field"><label>颜色</label><input type="color" id="wv-c" value="#34d6b5" class="color-input"></div>
        <div class="field"><label>波数</label><input type="range" id="wv-n" min="1" max="8" value="3"></div>
        <div class="field"><label>振幅</label><input type="range" id="wv-a" min="5" max="80" value="35"></div></div>
        <div class="btn-row"><button class="btn secondary" id="wv-copy">复制 SVG</button></div>
        <div class="preview-box" id="wv-box"></div>
      </div>`,
    init: (r) => {
      const box = r.querySelector('#wv-box');
      const go = () => {
        const n = +r.querySelector('#wv-n').value, amp = +r.querySelector('#wv-a').value, c = r.querySelector('#wv-c').value, W = 1000, H = 200;
        let d = `M0 ${H / 2}`;
        for (let i = 0; i < n; i++) { const x0 = i * W / n, x1 = (i + 0.5) * W / n, x2 = (i + 1) * W / n; d += ` Q ${x1} ${H / 2 - amp * (i % 2 ? -1 : 1)} ${x2} ${H / 2}`; }
        d += ` L ${W} ${H} L 0 ${H} Z`;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${d}" fill="${c}"/></svg>`;
        box.innerHTML = svg; box._svg = svg;
      };
      r.querySelectorAll('input').forEach(el => el.addEventListener('input', go));
      r.querySelector('#wv-copy').onclick = () => copyText(box._svg || '', '已复制'); go();
    }
  });

  // 噪声图
  T.register({
    id: 'noise', cat: 'dev', icon: '🌫️', name: '噪声纹理生成',
    desc: '生成随机噪声/PNG 纹理', keywords: 'noise 噪声 纹理 png',
    render: () => `
      <div class="tool-panel">
        <h2>🌫️ 噪声纹理生成</h2>
        <p class="t-sub">生成可下载的随机噪声 PNG。</p>
        <div class="row"><div class="field"><label>尺寸</label><select id="nz-s"><option value="256">256</option><option value="512" selected>512</option><option value="1024">1024</option></select></div>
        <div class="field"><label>强度</label><input type="range" id="nz-i" min="10" max="255" value="120"></div></div>
        <div class="btn-row"><button class="btn" id="nz-go">生成</button><button class="btn secondary" id="nz-dl">下载 PNG</button></div>
        <div class="preview-box" id="nz-box"></div>
      </div>`,
    init: (r) => {
      const box = r.querySelector('#nz-box');
      const go = () => {
        const s = +r.querySelector('#nz-s').value, amp = +r.querySelector('#nz-i').value;
        const cv = document.createElement('canvas'); cv.width = cv.height = s; const ctx = cv.getContext('2d');
        const img = ctx.createImageData(s, s);
        for (let i = 0; i < img.data.length; i += 4) { const v = 128 + Math.round((Math.random() - 0.5) * amp); img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
        ctx.putImageData(img, 0, 0); box.innerHTML = ''; box.appendChild(cv); cv.style.maxWidth = '100%'; cv.style.maxHeight = '300px';
        r.querySelector('#nz-dl').onclick = () => cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'noise.png'; a.click(); });
      };
      r.querySelectorAll('input,select').forEach(el => el.addEventListener('input', go)); r.querySelector('#nz-go').onclick = go; go();
    }
  });

  // 像素画
  T.register({
    id: 'pixel-art', cat: 'dev', icon: '🟦', name: '像素画板',
    desc: '绘制像素画并导出 PNG', keywords: 'pixel art 像素 画 导出',
    render: () => `
      <div class="tool-panel">
        <h2>🟦 像素画板</h2>
        <p class="t-sub">点击格子涂色，导出为 PNG。</p>
        <div class="row"><div class="field"><label>网格大小</label><select id="pa-g"><option value="8">8×8</option><option value="16" selected>16×16</option><option value="32">32×32</option></select></div>
        <div class="field"><label>画笔颜色</label><input type="color" id="pa-c" value="#6d7dff" class="color-input"></div></div>
        <div class="btn-row"><button class="btn secondary" id="pa-clear">清空</button><button class="btn" id="pa-dl">导出 PNG</button></div>
        <div class="preview-box" id="pa-box"></div>
      </div>`,
    init: (r) => {
      const box = r.querySelector('#pa-box');
      const draw = () => {
        const g = +r.querySelector('#pa-g').value, color = r.querySelector('#pa-c').value;
        box.innerHTML = ''; const grid = document.createElement('div'); grid.style.display = 'grid'; grid.style.gridTemplateColumns = `repeat(${g}, 1fr)`; grid.style.width = '320px'; grid.style.height = '320px'; grid.style.gap = '1px'; grid.style.background = 'var(--border)';
        for (let i = 0; i < g * g; i++) { const cell = document.createElement('div'); cell.style.background = '#fff'; cell.style.cursor = 'pointer'; cell.onmousedown = cell.onmouseenter = (e) => { if (e.buttons === 1 || e.type === 'mousedown') cell.style.background = color; }; grid.appendChild(cell); }
        r.querySelector('#pa-clear').onclick = () => grid.querySelectorAll('div').forEach(c => c.style.background = '#fff');
        r.querySelector('#pa-dl').onclick = () => { const cv = document.createElement('canvas'); cv.width = cv.height = g; const ctx = cv.getContext('2d'); const cells = grid.querySelectorAll('div'); cells.forEach((c, i) => { const col = c.style.background; ctx.fillStyle = col === 'rgb(255, 255, 255)' || col === '#fff' ? '#ffffff' : col; ctx.fillRect(i % g, Math.floor(i / g), 1, 1); }); cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'pixel-art.png'; a.click(); }); };
      };
      r.querySelector('#pa-g').addEventListener('change', draw); draw();
    }
  });

  // 图片滤镜
  T.register({
    id: 'image-filters', cat: 'color', icon: '🎚️', name: '图片滤镜',
    desc: '灰度/复古/反相/亮度/模糊等', keywords: 'filter 滤镜 图片 处理',
    render: () => `
      <div class="tool-panel">
        <h2>🎚️ 图片滤镜</h2>
        <p class="t-sub">本地处理，不上传。</p>
        <div class="field"><label>选择图片</label><input type="file" id="if-file" accept="image/*"></div>
        <div class="row"><div class="field"><label>预设</label><select id="if-pre"><option value="none">原图</option><option value="grayscale(100%)">灰度</option><option value="sepia(80%)">复古</option><option value="invert(100%)">反相</option><option value="contrast(140%) saturate(140%)">鲜亮</option></select></div>
        <div class="field"><label>亮度 <span id="if-bv">100</span>%</label><input type="range" id="if-b" min="0" max="200" value="100"></div>
        <div class="field"><label>模糊 <span id="if-clv">0</span>px</label><input type="range" id="if-cl" min="0" max="20" value="0"></div></div>
        <div class="btn-row"><button class="btn secondary" id="if-dl" disabled>下载</button></div>
        <div class="preview-box" id="if-box"><span class="muted">请选择图片</span></div>
      </div>`,
    init: (r) => {
      const box = r.querySelector('#if-box'); let curCanvas = null;
      const apply = () => {
        if (!curCanvas) return; const pre = r.querySelector('#if-pre').value, b = r.querySelector('#if-b').value, cl = r.querySelector('#if-cl').value;
        r.querySelector('#if-bv').textContent = b; r.querySelector('#if-clv').textContent = cl;
        const f = `brightness(${b}%) blur(${cl}px) ${pre !== 'none' ? pre : ''}`;
        const cv = document.createElement('canvas'); cv.width = curCanvas.width; cv.height = curCanvas.height; const ctx = cv.getContext('2d'); ctx.filter = f; ctx.drawImage(curCanvas, 0, 0); box.innerHTML = ''; box.appendChild(cv); cv.style.maxWidth = '100%'; cv.style.maxHeight = '320px'; curCanvas = cv;
        r.querySelector('#if-dl').disabled = false; r.querySelector('#if-dl').onclick = () => cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'filtered.png'; a.click(); });
      };
      r.querySelector('#if-file').addEventListener('change', () => { const f = r.querySelector('#if-file').files[0]; if (!f) return; const img = new Image(); img.onload = () => { const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; cv.getContext('2d').drawImage(img, 0, 0); curCanvas = cv; apply(); }; img.src = URL.createObjectURL(f); });
      r.querySelectorAll('#if-pre,#if-b,#if-cl').forEach(el => el.addEventListener('input', apply));
    }
  });

  // 图片裁剪
  T.register({
    id: 'image-crop', cat: 'color', icon: '✂️', name: '图片裁剪',
    desc: '按像素区域裁剪图片', keywords: 'crop 裁剪 图片 裁切',
    render: () => `
      <div class="tool-panel">
        <h2>✂️ 图片裁剪</h2>
        <p class="t-sub">选择图片后设定裁剪区域（像素）。</p>
        <div class="field"><label>选择图片</label><input type="file" id="ic-file" accept="image/*"></div>
        <div class="grid-2"><div class="field"><label>裁剪宽度 W</label><input type="number" id="ic-w" value="300"></div>
        <div class="field"><label>裁剪高度 H</label><input type="number" id="ic-h" value="300"></div>
        <div class="field"><label>起点 X</label><input type="number" id="ic-x" value="0"></div>
        <div class="field"><label>起点 Y</label><input type="number" id="ic-y" value="0"></div></div>
        <div class="btn-row"><button class="btn" id="ic-go">裁剪</button><button class="btn secondary" id="ic-dl" disabled>下载</button></div>
        <div class="preview-box" id="ic-box"><span class="muted">请选择图片</span></div>
      </div>`,
    init: (r) => {
      const box = r.querySelector('#ic-box'); let curImg = null;
      r.querySelector('#ic-file').addEventListener('change', () => { const f = r.querySelector('#ic-file').files[0]; if (!f) return; const img = new Image(); img.onload = () => { curImg = img; r.querySelector('#ic-w').value = img.naturalWidth; r.querySelector('#ic-h').value = img.naturalHeight; box.innerHTML = `<img src="${URL.createObjectURL(f)}" style="max-width:100%;max-height:300px">`; }; img.src = URL.createObjectURL(f); });
      r.querySelector('#ic-go').onclick = () => {
        if (!curImg) return; const x = clamp(+r.querySelector('#ic-x').value, 0, curImg.naturalWidth), y = clamp(+r.querySelector('#ic-y').value, 0, curImg.naturalHeight), w = clamp(+r.querySelector('#ic-w').value, 1, curImg.naturalWidth - x), h = clamp(+r.querySelector('#ic-h').value, 1, curImg.naturalHeight - y);
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(curImg, x, y, w, h, 0, 0, w, h); box.innerHTML = ''; box.appendChild(cv); cv.style.maxWidth = '100%'; cv.style.maxHeight = '320px';
        r.querySelector('#ic-dl').disabled = false; r.querySelector('#ic-dl').onclick = () => cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'cropped.png'; a.click(); });
      };
    }
  });

  // JSON 校验
  T.register({
    id: 'json-validator', cat: 'dev', icon: '✅', name: 'JSON 校验',
    desc: '校验并格式化 JSON，定位错误', keywords: 'json validate 校验 格式化',
    render: () => `
      <div class="tool-panel">
        <h2>✅ JSON 校验</h2>
        <p class="t-sub">粘贴 JSON，校验合法性并美化。</p>
        <div class="field"><label>JSON</label><textarea id="jv-in" style="min-height:160px">{"name":"工具箱","tools":[1,2,3]}</textarea></div>
        <div class="btn-row"><button class="btn" id="jv-go">校验</button><button class="btn secondary" id="jv-copy">复制结果</button></div>
        <div class="field"><label>结果</label><div class="out" id="jv-out" style="max-height:300px;overflow:auto"></div></div>
      </div>`,
    init: (r) => {
      const go = () => {
        const out = r.querySelector('#jv-out'); const t = r.querySelector('#jv-in').value;
        try { const o = JSON.parse(t); out.className = 'out ok'; out.textContent = JSON.stringify(o, null, 2); } catch (e) { out.className = 'out err'; const m = e.message; const pos = m.match(/position (\d+)/); let ctx = ''; if (pos) { const p = +pos[1]; ctx = '\n临近："' + (t.slice(Math.max(0, p - 20), p) + '▶' + t.slice(p, p + 20)) + '"'; } out.textContent = '❌ 错误：' + m + ctx; }
      };
      r.querySelector('#jv-go').onclick = go; r.querySelector('#jv-copy').onclick = () => { const o = r.querySelector('#jv-out'); if (o.className.includes('ok')) copyText(o.textContent, '已复制'); }; go();
    }
  });
})();

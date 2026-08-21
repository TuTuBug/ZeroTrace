/* ============ CSS 生成器 ============ */
(function () {
  const T = window.TB;
  const codeBlock = (s) => `<div class="field"><label>CSS 代码</label><div class="out" data-copy="${esc(s)}" style="cursor:pointer">${esc(s)}</div><div class="hint">点击代码即可复制。</div></div>`;
  const bindCopy = (r) => r.querySelectorAll('[data-copy]').forEach(el => el.onclick = () => copyText(el.dataset.copy, '已复制'));

  // 1. 渐变
  T.register({
    id: 'css-gradient', cat: 'css', icon: '🌈', name: '渐变生成器',
    desc: '线性 / 径向 / 圆锥渐变', keywords: 'gradient css 渐变',
    render: () => `
      <div class="tool-panel"><h2>🌈 渐变生成器</h2>
      <div class="row">
        <div class="field"><label>类型</label><select id="g-type"><option>linear</option><option>radial</option><option>conic</option></select></div>
        <div class="field"><label>角度</label><input type="range" id="g-ang" min="0" max="360" value="90"></div>
        <div class="field" style="max-width:140px"><label>颜色 1</label><input type="color" id="g-c1" class="color-input" value="#6d7dff"></div>
        <div class="field" style="max-width:140px"><label>颜色 2</label><input type="color" id="g-c2" class="color-input" value="#34d6b5"></div>
      </div>
      <div class="preview-box" style="margin-bottom:12px"><div id="g-prev" style="width:100%;height:120px;border-radius:10px"></div></div>
      <div id="g-code"></div></div>`,
    init: (r) => {
      const type = r.querySelector('#g-type'), ang = r.querySelector('#g-ang'), c1 = r.querySelector('#g-c1'), c2 = r.querySelector('#g-c2'), prev = r.querySelector('#g-prev'), code = r.querySelector('#g-code');
      const up = () => {
        let css;
        if (type.value === 'linear') css = `linear-gradient(${ang.value}deg, ${c1.value}, ${c2.value})`;
        else if (type.value === 'radial') css = `radial-gradient(circle, ${c1.value}, ${c2.value})`;
        else css = `conic-gradient(from ${ang.value}deg, ${c1.value}, ${c2.value}, ${c1.value})`;
        prev.style.background = css; code.innerHTML = codeBlock(`background: ${css};`); bindCopy(r);
      };
      [type, ang, c1, c2].forEach(e => e.addEventListener('input', up)); up();
    }
  });

  // 2. 阴影
  T.register({
    id: 'css-shadow', cat: 'css', icon: '🌑', name: '阴影生成器',
    desc: 'box-shadow 参数可视化', keywords: 'box-shadow shadow 阴影',
    render: () => `
      <div class="tool-panel"><h2>🌑 阴影生成器</h2>
      <div class="grid-3">
        <div class="field"><label>水平位移</label><input type="range" id="s-x" min="-50" max="50" value="8"></div>
        <div class="field"><label>垂直位移</label><input type="range" id="s-y" min="-50" max="50" value="12"></div>
        <div class="field"><label>模糊</label><input type="range" id="s-b" min="0" max="100" value="30"></div>
        <div class="field"><label>扩散</label><input type="range" id="s-s" min="-30" max="30" value="0"></div>
        <div class="field" style="max-width:140px"><label>颜色</label><input type="color" id="s-c" class="color-input" value="#000000"></div>
        <div class="field"><label>不透明度</label><input type="range" id="s-o" min="0" max="100" value="25"></div>
      </div>
      <label style="display:flex;gap:6px;align-items:center;color:var(--text-soft);font-size:13px"><input type="checkbox" id="s-in"> 内阴影 (inset)</label>
      <div class="preview-box" style="margin:12px 0"><div id="s-prev" style="width:120px;height:120px;background:#fff;border-radius:14px"></div></div>
      <div id="s-code"></div></div>`,
    init: (r) => {
      const x = r.querySelector('#s-x'), y = r.querySelector('#s-y'), b = r.querySelector('#s-b'), sp = r.querySelector('#s-s'), c = r.querySelector('#s-c'), o = r.querySelector('#s-o'), inset = r.querySelector('#s-in'), prev = r.querySelector('#s-prev'), code = r.querySelector('#s-code');
      const up = () => {
        const col = c.value + Math.round(o.value * 2.55).toString(16).padStart(2, '0');
        const v = `${inset.checked ? 'inset ' : ''}${x.value}px ${y.value}px ${b.value}px ${sp.value}px ${col}`;
        prev.style.boxShadow = v; code.innerHTML = codeBlock(`box-shadow: ${v};`); bindCopy(r);
      };
      [x, y, b, sp, c, o, inset].forEach(e => e.addEventListener('input', up)); up();
    }
  });

  // 3. 圆角
  T.register({
    id: 'css-radius', cat: 'css', icon: '⬭', name: '圆角生成器',
    desc: 'border-radius 四角控制', keywords: 'border-radius radius 圆角',
    render: () => `
      <div class="tool-panel"><h2>⬭ 圆角生成器</h2>
      <div class="grid-2">
        <div class="field"><label>左上</label><input type="range" id="r-tl" min="0" max="100" value="20"></div>
        <div class="field"><label>右上</label><input type="range" id="r-tr" min="0" max="100" value="20"></div>
        <div class="field"><label>右下</label><input type="range" id="r-br" min="0" max="100" value="20"></div>
        <div class="field"><label>左下</label><input type="range" id="r-bl" min="0" max="100" value="20"></div>
      </div>
      <label style="display:flex;gap:6px;align-items:center;color:var(--text-soft);font-size:13px"><input type="checkbox" id="r-link" checked> 四角联动</label>
      <div class="preview-box" style="margin:12px 0"><div id="r-prev" style="width:140px;height:140px;background:var(--accent)"></div></div>
      <div id="r-code"></div></div>`,
    init: (r) => {
      const ids = ['tl', 'tr', 'br', 'bl'], prev = r.querySelector('#r-prev'), code = r.querySelector('#r-code'), link = r.querySelector('#r-link');
      const up = () => {
        if (link.checked) { const v = r.querySelector('#r-tl').value; ids.forEach(i => r.querySelector('#r-' + i).value = v); }
        const vals = ids.map(i => r.querySelector('#r-' + i).value + 'px');
        const v = vals.join(' ');
        prev.style.borderRadius = v; code.innerHTML = codeBlock(`border-radius: ${v};`); bindCopy(r);
      };
      ids.forEach(i => r.querySelector('#r-' + i).addEventListener('input', up)); link.onchange = up; up();
    }
  });

  // 4. 玻璃拟态
  T.register({
    id: 'css-glass', cat: 'css', icon: '🪟', name: '玻璃拟态',
    desc: 'Glassmorphism 卡片', keywords: 'glassmorphism 玻璃 拟态',
    render: () => `
      <div class="tool-panel"><h2>🪟 玻璃拟态（Glassmorphism）</h2>
      <div class="row">
        <div class="field"><label>模糊度</label><input type="range" id="gl-b" min="0" max="30" value="10"></div>
        <div class="field"><label>透明度</label><input type="range" id="gl-o" min="0" max="100" value="20"></div>
        <div class="field" style="max-width:140px"><label>背景色</label><input type="color" id="gl-c" class="color-input" value="#ffffff"></div>
      </div>
      <div class="preview-box" id="gl-stage" style="background:linear-gradient(135deg,#6d7dff,#34d6b5);margin:12px 0"><div id="gl-card" style="width:220px;height:130px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;border:1px solid rgba(255,255,255,.4)">Glass</div></div>
      <div id="gl-code"></div></div>`,
    init: (r) => {
      const b = r.querySelector('#gl-b'), o = r.querySelector('#gl-o'), c = r.querySelector('#gl-c'), card = r.querySelector('#gl-card'), code = r.querySelector('#gl-code');
      const up = () => {
        const bg = hexToRgb(c.value); const rgba = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${(o.value / 100).toFixed(2)})`;
        const css = `background: ${rgba};\nbackdrop-filter: blur(${b.value}px);\n-webkit-backdrop-filter: blur(${b.value}px);\nborder: 1px solid rgba(255,255,255,0.4);\nborder-radius: 14px;`;
        card.style.background = rgba; card.style.backdropFilter = `blur(${b.value}px)`; card.style.webkitBackdropFilter = `blur(${b.value}px)`;
        code.innerHTML = codeBlock(css); bindCopy(r);
      };
      [b, o, c].forEach(e => e.addEventListener('input', up)); up();
    }
  });

  // 5. 弹性布局
  T.register({
    id: 'css-flex', cat: 'css', icon: '📏', name: 'Flex 布局',
    desc: 'justify / align 可视化', keywords: 'flex flexbox 弹性 布局',
    render: () => `
      <div class="tool-panel"><h2>📏 Flex 布局可视化</h2>
      <div class="row">
        <div class="field"><label>justify-content</label><select id="fx-j">${['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'].map(v => `<option>${v}</option>`).join('')}</select></div>
        <div class="field"><label>align-items</label><select id="fx-a">${['stretch', 'flex-start', 'center', 'flex-end', 'baseline'].map(v => `<option>${v}</option>`).join('')}</select></div>
        <div class="field"><label>子项数量</label><input type="number" id="fx-n" value="4" min="1" max="12"></div>
      </div>
      <div class="preview-box" id="fx-stage" style="background:var(--bg-input)"></div>
      <div id="fx-code"></div></div>`,
    init: (r) => {
      const j = r.querySelector('#fx-j'), a = r.querySelector('#fx-a'), n = r.querySelector('#fx-n'), stage = r.querySelector('#fx-stage'), code = r.querySelector('#fx-code');
      const up = () => {
        const cnt = clamp(+n.value || 1, 1, 12);
        stage.style.display = 'flex'; stage.style.justifyContent = j.value; stage.style.alignItems = a.value; stage.style.gap = '10px'; stage.style.minHeight = '120px'; stage.style.padding = '12px';
        stage.innerHTML = ''; for (let i = 0; i < cnt; i++) { const d = document.createElement('div'); d.className = 'demo-box'; d.style.width = '56px'; d.style.height = (40 + (i % 3) * 18) + 'px'; d.textContent = i + 1; stage.appendChild(d); }
        code.innerHTML = codeBlock(`.container {\n  display: flex;\n  justify-content: ${j.value};\n  align-items: ${a.value};\n  gap: 10px;\n}`);
        bindCopy(r);
      };
      [j, a, n].forEach(e => e.addEventListener('input', up)); up();
    }
  });

  // 6. 网格布局
  T.register({
    id: 'css-grid', cat: 'css', icon: '🔲', name: 'Grid 布局',
    desc: 'grid-template-columns 可视化', keywords: 'grid 网格 布局',
    render: () => `
      <div class="tool-panel"><h2>🔲 Grid 布局可视化</h2>
      <div class="row">
        <div class="field"><label>列数</label><input type="number" id="gd-c" value="3" min="1" max="8"></div>
        <div class="field"><label>间距</label><input type="range" id="gd-g" min="0" max="40" value="12"></div>
        <div class="field"><label>子项数量</label><input type="number" id="gd-n" value="6" min="1" max="24"></div>
      </div>
      <div class="preview-box" id="gd-stage" style="background:var(--bg-input)"></div>
      <div id="gd-code"></div></div>`,
    init: (r) => {
      const c = r.querySelector('#gd-c'), g = r.querySelector('#gd-g'), n = r.querySelector('#gd-n'), stage = r.querySelector('#gd-stage'), code = r.querySelector('#gd-code');
      const up = () => {
        const cols = clamp(+c.value || 1, 1, 8), cnt = clamp(+n.value || 1, 1, 24);
        stage.style.display = 'grid'; stage.style.gridTemplateColumns = `repeat(${cols}, 1fr)`; stage.style.gap = g.value + 'px'; stage.style.padding = '12px';
        stage.innerHTML = ''; for (let i = 0; i < cnt; i++) { const d = document.createElement('div'); d.className = 'demo-box'; d.style.height = '46px'; d.textContent = i + 1; stage.appendChild(d); }
        code.innerHTML = codeBlock(`.container {\n  display: grid;\n  grid-template-columns: repeat(${cols}, 1fr);\n  gap: ${g.value}px;\n}`);
        bindCopy(r);
      };
      [c, g, n].forEach(e => e.addEventListener('input', up)); up();
    }
  });

  // 7. 文本阴影
  T.register({
    id: 'css-tshadow', cat: 'css', icon: '🔤', name: '文本阴影',
    desc: 'text-shadow 参数可视化', keywords: 'text-shadow 文本 阴影',
    render: () => `
      <div class="tool-panel"><h2>🔤 文本阴影生成器</h2>
      <div class="grid-2">
        <div class="field"><label>水平位移</label><input type="range" id="ts-x" min="-20" max="20" value="2"></div>
        <div class="field"><label>垂直位移</label><input type="range" id="ts-y" min="-20" max="20" value="2"></div>
        <div class="field"><label>模糊</label><input type="range" id="ts-b" min="0" max="40" value="4"></div>
        <div class="field" style="max-width:140px"><label>颜色</label><input type="color" id="ts-c" class="color-input" value="#000000"></div>
      </div>
      <div class="preview-box" style="margin:12px 0"><div id="ts-prev" style="font-size:42px;font-weight:800;color:#fff">文字阴影 Aa</div></div>
      <div id="ts-code"></div></div>`,
    init: (r) => {
      const x = r.querySelector('#ts-x'), y = r.querySelector('#ts-y'), b = r.querySelector('#ts-b'), c = r.querySelector('#ts-c'), prev = r.querySelector('#ts-prev'), code = r.querySelector('#ts-code');
      const up = () => { const v = `${x.value}px ${y.value}px ${b.value}px ${c.value}`; prev.style.textShadow = v; code.innerHTML = codeBlock(`text-shadow: ${v};`); bindCopy(r); };
      [x, y, b, c].forEach(e => e.addEventListener('input', up)); up();
    }
  });

  // 8. 背景图案
  T.register({
    id: 'css-pattern', cat: 'css', icon: '🔳', name: '背景图案',
    desc: '点阵 / 条纹 / 网格背景', keywords: 'pattern background 背景 图案',
    render: () => `
      <div class="tool-panel"><h2>🔳 背景图案生成器</h2>
      <div class="row">
        <div class="field"><label>图案</label><select id="pt-t"><option value="dots">点阵</option><option value="stripes">条纹</option><option value="grid">网格</option><option value="diagonal">斜纹</option></select></div>
        <div class="field"><label>尺寸</label><input type="range" id="pt-s" min="8" max="60" value="20"></div>
        <div class="field" style="max-width:140px"><label>前景</label><input type="color" id="pt-f" class="color-input" value="#6d7dff"></div>
        <div class="field" style="max-width:140px"><label>背景</label><input type="color" id="pt-b" class="color-input" value="#ffffff"></div>
      </div>
      <div class="preview-box" id="pt-prev" style="margin:12px 0;min-height:140px"></div>
      <div id="pt-code"></div></div>`,
    init: (r) => {
      const t = r.querySelector('#pt-t'), s = r.querySelector('#pt-s'), f = r.querySelector('#pt-f'), b = r.querySelector('#pt-b'), prev = r.querySelector('#pt-prev'), code = r.querySelector('#pt-code');
      const up = () => {
        const sz = +s.value, c = f.value, bg = b.value; let css;
        if (t.value === 'dots') css = `radial-gradient(${c} 1.5px, transparent 1.6px) 0 0 / ${sz}px ${sz}px, ${bg}`;
        else if (t.value === 'stripes') css = `repeating-linear-gradient(0deg, ${c} 0 ${sz / 2}px, ${bg} ${sz / 2}px ${sz}px)`;
        else if (t.value === 'grid') css = `linear-gradient(${c} 1px, transparent 1px) 0 0 / ${sz}px ${sz}px, linear-gradient(90deg, ${c} 1px, transparent 1px) 0 0 / ${sz}px ${sz}px, ${bg}`;
        else css = `repeating-linear-gradient(45deg, ${c} 0 ${sz / 2}px, ${bg} ${sz / 2}px ${sz}px)`;
        prev.style.background = css; prev.style.backgroundSize = t.value === 'dots' ? `${sz}px ${sz}px` : '';
        if (t.value === 'dots') prev.style.background = `radial-gradient(${c} 1.5px, ${bg} 2px) 0 0 / ${sz}px ${sz}px`;
        code.innerHTML = codeBlock(`background: ${css};` + (t.value === 'dots' ? `\nbackground-size: ${sz}px ${sz}px;` : '')); bindCopy(r);
      };
      [t, s, f, b].forEach(e => e.addEventListener('input', up)); up();
    }
  });
})();

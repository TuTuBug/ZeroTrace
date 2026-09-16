/* 工具箱共享工具函数与注册表 */
window.TB = {
  tools: [],
  categories: {
    text:   { name: '文本工具', icon: '📝' },
    dev:    { name: '开发编码', icon: '💻' },
    color:  { name: '颜色图像', icon: '🎨' },
    css:    { name: 'CSS 生成器', icon: '🧩' },
    calc:   { name: '计算器', icon: '🧮' },
    pass:   { name: '密码安全', icon: '🔐' },
    conv:   { name: '格式转换', icon: '🔁' },
    math:   { name: '数学计算', icon: '📐' },
    util:   { name: '实用工具', icon: '🛠️' },
  },
  register(t) { this.tools.push(t); },
};

/* 转义 HTML，防止注入 */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* 轻提示 */
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 1800);
}

/* 复制到剪贴板 */
function copyText(text, label) {
  const done = () => toast((label || '已复制') + ' ✓');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败'); }
  document.body.removeChild(ta);
}

/* 数字格式化 */
function fmt(n, d) {
  if (!isFinite(n)) return '—';
  return Number(n).toLocaleString('zh-CN', { maximumFractionDigits: d == null ? 2 : d });
}
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

/* 简易 Markdown 渲染（够用即可，安全转义后处理） */
function miniMarkdown(src) {
  let s = esc(src);
  s = s.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
       .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
       .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
       .replace(/^### (.*)$/gm, '<h3>$1</h3>')
       .replace(/^## (.*)$/gm, '<h2>$1</h2>')
       .replace(/^# (.*)$/gm, '<h1>$1</h1>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
       .replace(/\*(.+?)\*/g, '<em>$1</em>')
       .replace(/`([^`]+?)`/g, '<code>$1</code>');
  /* 列表：整块捕获「连续同类列表行」，各自合成一个 <ul>/<ol>。
     必须放在下面的换行转换之前；有序列表也要在这里处理，
     否则行内标记会被 <br/> 打散，永远拿不到列表容器。 */
  const liBlock = (tag) => (m) =>
    '<' + tag + '>' + m.trimEnd().split('\n').map(l => '<li>' + l + '</li>').join('') + '</' + tag + '>';
  s = s.replace(/(?:^[ \t]*[-*] .*(?:\n|$))+/gm, m => liBlock('ul')(m.replace(/^[ \t]*[-*] /gm, '')));
  s = s.replace(/(?:^[ \t]*\d+\. .*(?:\n|$))+/gm, m => liBlock('ol')(m.replace(/^[ \t]*\d+\. /gm, '')));
  s = s.replace(/<\/(ul|ol)>\n/g, '</$1>');
  s = s.replace(/\n{2,}/g, '<br/><br/>').replace(/\n/g, '<br/>');
  return s;
}

/* 随机整数 */
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

/* HEX -> RGB */
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
/* RGB -> HEX */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join('');
}
/* RGB -> HSL */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
/* HSL -> RGB */
function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}
/* 相对亮度（WCAG） */
function relLum(r, g, b) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/* ============ 工具页 DOM 骨架（浏览器与静态页生成脚本共用） ============
   这里必须是「唯一真源」：app.js 动态进入工具时用它，scripts/gen-static.js
   预渲染静态页时也用它。两边结构一旦分叉，静态页与运行时页面就会不一致。 */

/* 工具页附加内容：面包屑 + 关于本工具 + 同类工具内链。
   同类工具用真实 <a href="/tool/<id>/"> 而非 hash，是为了给爬虫一张内链网
   （hash 链接爬不到，等于没有内链）。 */
function seoSectionHTML(t) {
  const TB = window.TB;
  const cat = TB.categories[t.cat] || { name: '', icon: '' };
  const same = TB.tools.filter(x => x.cat === t.cat && x.id !== t.id);
  const kw = String(t.keywords || '').trim().split(/\s+/).filter(Boolean);
  return `<section class="tb-seo">
      <h2>关于「${esc(t.name)}」</h2>
      <p>${esc(t.name)} 属于${esc(cat.name)}，功能是${esc(t.desc)}。本工具完全在你的浏览器本地运行——不上传、不联网、不留痕，数据自始至终不出本机，断网也能使用。</p>
      ${kw.length ? `<p class="tb-kw">相关关键词：${esc(kw.join('、'))}</p>` : ''}
      <h3>${esc(cat.name)}下的其他工具</h3>
      <div class="tb-same">${same.map(x => `<a href="/tool/${encodeURIComponent(x.id)}/">${x.icon} ${esc(x.name)}</a>`).join('') || '<span class="muted">暂无</span>'}</div>
      <p class="tb-home"><a href="/">← 返回零上传工具箱首页，查看全部 ${TB.tools.length} 个工具</a></p>
    </section>`;
}

/* 面包屑（含页面唯一 h1） */
function crumbHTML(t) {
  const cat = window.TB.categories[t.cat] || { name: '', icon: '' };
  return `<div class="tb-crumb"><a href="/">首页</a><span>›</span><span>${esc(cat.icon || '')} ${esc(cat.name)}</span><span>›</span><h1 class="tb-h1">${esc(t.name)}</h1></div>`;
}

/* 工具视图完整 DOM：#tool-view 的全部子节点 */
function toolViewHTML(t) {
  return `<div class="tool-topbar"><button class="tool-back" id="tb-back">← 返回</button><button class="icon-btn" id="tb-theme" title="切换主题" aria-label="切换主题">🌓</button></div>
    ${crumbHTML(t)}
    <div id="tb-root" data-tool-id="${esc(t.id)}">${t.render()}</div>
    ${seoSectionHTML(t)}`;
}

#!/usr/bin/env node
/* ============================================================
   静态页生成器 —— 让上百个工具页真正能被搜索引擎收录
   ------------------------------------------------------------
   为什么需要它：
     本站线上是 hash 路由 SPA（/#/tool/xxx），而搜索引擎会忽略
     '#' 之后的内容，导致所有工具页在爬虫眼里都等于首页，一个都
     收录不了（提交 155 条 hash URL 还会被判「首页重复提交」）。
     这里在构建期为每个工具预渲染一份真实静态页：
       路径 /tool/<id>/ + 独立 title/description + 可见正文 + 同类内链
     配合 app.js 的「路径优先」路由和 _redirects 兜底，做到一份内容
     两个入口：
       - 爬虫：拿到完整 HTML（含工具界面与说明文字）
       - 用户：JS 接管后功能完全不变（不重复渲染，只补事件）

   用法：
     node scripts/gen-static.js
   注意：
     新增/改名/改描述任何工具后都要重跑本脚本，否则静态页会与线上
     不一致（sitemap.xml 也由它一并重写）。
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'assets', 'js');
const TOOL_DIR = path.join(ROOT, 'tool');
const SITE = 'https://tool.dmi.ccwu.cc';

/* ---------- 1. 从 index.html 提取必须保持一致的公共部分 ----------
   全部靠提取而不是硬编码：一旦首页改了版本号/CSP/脚本列表，静态页
   自动跟随，不会出现「首页变了、静态页还是旧的」。 */
const indexHTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const pick = (re, label) => {
  const m = indexHTML.match(re);
  if (!m) throw new Error('无法从 index.html 提取' + label + '，请检查首页结构');
  return m[1];
};
const VER = pick(/\?v=([\w.\-]+)/, '资源版本号 ?v=');
const CSP = pick(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/, 'CSP');
const FAVICON = pick(/<link rel="icon" href="([^"]*)"/, 'favicon');
const THEME = pick(/<meta name="theme-color" content="([^"]*)"/, 'theme-color');
const SCRIPTS = (indexHTML.match(/<script src="[^"]+"><\/script>/g) || [])
  .map(s => '  ' + s).join('\n');
if (!SCRIPTS) throw new Error('未能在 index.html 中找到任何 <script src>');

/* ---------- 2. 加载工具注册表（与 .workbuddy/audit.js 同款做法） ---------- */
global.window = global;
global.document = {
  getElementById: () => null,
  createElement: () => ({ style: {} }),
  documentElement: { setAttribute() {}, getAttribute: () => 'dark' },
  body: { classList: { add() {}, remove() {} }, appendChild() {}, removeChild() {} },
  querySelectorAll: () => [],
};
eval(fs.readFileSync(path.join(JS_DIR, 'util.js'), 'utf8'));
const toolFiles = fs.readdirSync(JS_DIR).filter(f => f.startsWith('tools-')).sort();
for (const f of toolFiles) {
  try { eval(fs.readFileSync(path.join(JS_DIR, f), 'utf8')); }
  catch (e) { throw new Error('加载 ' + f + ' 失败：' + e.message); }
}
const T = global.TB;
if (!T || !Array.isArray(T.tools) || !T.tools.length) throw new Error('工具注册表为空');

/* ---------- 3. 单页模板 ---------- */
const attr = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;');

function pageHTML(t) {
  const cat = T.categories[t.cat] || { name: '工具', icon: '' };
  const toolPath = '/tool/' + encodeURIComponent(t.id) + '/';
  const url = SITE + toolPath;
  /* 分类名本身可能已含「工具/器」，避免拼出「文本工具工具」这种叠字 */
  const catLabel = /(工具|器)$/.test(cat.name) ? cat.name : cat.name + '工具';
  const title = t.name + ' - 免费在线' + catLabel + ' | 零上传工具箱';
  const desc = t.name + '：' + t.desc
    + '。完全在浏览器本地运行，0 上传、0 服务器，数据不出本机，可离线使用。';
  const kw = [t.name, cat.name]
    .concat(String(t.keywords || '').split(/\s+/))
    .concat(['在线工具', '免费', '本地运行', '不上传', '零上传'])
    .filter(Boolean).join(',');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${CSP}" />
  <title>${attr(title)}</title>
  <meta name="description" content="${attr(desc)}" />
  <meta name="keywords" content="${attr(kw)}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="零上传工具箱 ZeroTrace" />
  <meta property="og:locale" content="zh_CN" />
  <meta property="og:title" content="${attr(t.name + ' · 零上传工具箱')}" />
  <meta property="og:description" content="${attr(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/assets/og-cover.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${attr(t.name + ' · 零上传工具箱')}" />
  <meta name="twitter:description" content="${attr(desc)}" />
  <meta name="twitter:image" content="${SITE}/assets/og-cover.png" />
  <meta name="theme-color" content="${THEME}" />
  <link rel="icon" href="${FAVICON}" />
  <link rel="stylesheet" href="/assets/css/style.css?v=${VER}" />
</head>
<body class="tool-open">
  <main class="wrap main-area">
    <div id="home-view" hidden></div>
    <div id="tool-view">${toolViewHTML(t)}</div>
  </main>

  <div id="toast" class="toast" hidden></div>

${SCRIPTS}
</body>
</html>
`;
}

/* ---------- 4. 清理旧产物并生成 ---------- */
fs.rmSync(TOOL_DIR, { recursive: true, force: true });
const seen = new Set();
let total = 0, maxLen = 0, maxId = '';

for (const t of T.tools) {
  if (seen.has(t.id)) throw new Error('重复工具 ID：' + t.id);
  seen.add(t.id);
  const html = pageHTML(t);
  fs.mkdirSync(path.join(TOOL_DIR, t.id), { recursive: true });
  fs.writeFileSync(path.join(TOOL_DIR, t.id, 'index.html'), html, 'utf8');
  total += Buffer.byteLength(html, 'utf8');
  if (html.length > maxLen) { maxLen = html.length; maxId = t.id; }
}

/* ---------- 5. 重写 sitemap.xml ---------- */
const today = new Date().toISOString().slice(0, 10);
const entry = (loc, pri, freq) =>
  '  <url>\n    <loc>' + loc + '</loc>\n    <lastmod>' + today + '</lastmod>\n'
  + '    <changefreq>' + freq + '</changefreq>\n    <priority>' + pri + '</priority>\n  </url>';
const urls = [entry(SITE + '/', '1.0', 'weekly')].concat(
  T.tools.map(t => entry(SITE + '/tool/' + encodeURIComponent(t.id) + '/', '0.7', 'monthly'))
);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.join('\n') + '\n</urlset>\n', 'utf8');

/* ---------- 6. 自检 ---------- */
const bad = [];
for (const t of T.tools) {
  const s = fs.readFileSync(path.join(TOOL_DIR, t.id, 'index.html'), 'utf8');
  if (!s.includes(attr(t.name))) bad.push(t.id + ' 缺工具名');
  if (!/<h1/.test(s)) bad.push(t.id + ' 缺 h1');
  if (!s.includes('href="/tool/') && T.tools.length > 1) bad.push(t.id + ' 缺同类内链');
  if (/src="(?!\/|https?:|data:)/.test(s)) bad.push(t.id + ' 含相对路径资源');
}

/* ---------- 7. 报告 ---------- */
console.log('[来源] index.html  →  版本号 ' + VER + ' ｜ 脚本 ' + SCRIPTS.split('\n').length + ' 个');
console.log('[生成] 工具页 ' + T.tools.length + ' 个 → tool/<id>/index.html');
console.log('[生成] sitemap.xml ' + urls.length + ' 条 URL（1 首页 + ' + T.tools.length + ' 工具页）');
console.log('[体积] 合计 ' + (total / 1024).toFixed(1) + ' KB，最大页 ' + maxId + '（' + (maxLen / 1024).toFixed(1) + ' KB）');
console.log('[自检] ' + (bad.length ? '发现问题 ' + bad.length + ' 处：' + bad.slice(0, 8).join(' | ') : '全部通过'));
if (bad.length) process.exitCode = 1;

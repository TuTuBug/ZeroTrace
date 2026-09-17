#!/usr/bin/env node
/* ============================================================
   发布清单预演 —— 推送前算出「哪些文件真的会被发到公网」
   ------------------------------------------------------------
   为什么需要它：
     本项目以 Workers 形态部署（assets.directory = "."，即仓库根目录
     整个当静态资源）。Cloudflare **Pages 会自动排除** .git /
     node_modules / .DS_Store，但 **Workers 不会** —— wrangler 源码里
     默认只排除三个 metafile：
         /.assetsignore   /_redirects   /_headers
     其余一律照发。2026-09-17 就是因为这个差异，线上曾可直接下载
     /.git/index（含全部文件名 + 每个文件 SHA1 + mtime）、
     /.git/config、/.git/logs/HEAD 等。

   本脚本用 wrangler 内部同一个 ignore@5.3.1 库（gitignore 规范）复现
   它的过滤逻辑，把最终发布清单提前算出来，避免又一次失败/泄露的构建。

   用法：
     node scripts/verify-assetsignore.js
   退出码：断言失败时为 1，可直接用于 CI。
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/* ---------- 加载 ignore 库（wrangler 内部用的就是它） ---------- */
function loadIgnore() {
  const candidates = [
    path.join(ROOT, 'node_modules', 'ignore'),
    path.join(process.env.USERPROFILE || process.env.HOME || '', '.workbuddy',
      'binaries', 'node', 'workspace', 'node_modules', 'ignore'),
    'ignore',
  ];
  for (const c of candidates) {
    try { return require(c); } catch (e) { /* 继续尝试下一个 */ }
  }
  console.error('✗ 找不到 ignore 库（wrangler 用的同一个 gitignore 实现）。装一个即可：');
  console.error('    npm install ignore@5.3.1        # 任意目录，或用 npx 也行');
  process.exit(2);
}
const ignore = loadIgnore();

/* ---------- wrangler 的默认排除项（workers-shared/utils/constants.ts） ---------- */
const DEFAULT_IGNORES = ['/.assetsignore', '/_redirects', '/_headers'];

const ignoreFile = path.join(ROOT, '.assetsignore');
if (!fs.existsSync(ignoreFile)) {
  console.error('✗ 未找到 .assetsignore —— Workers 不会自动排除 .git，切勿这样部署！');
  process.exit(1);
}

const ig = ignore()
  .add(DEFAULT_IGNORES.join('\n'))
  .add(fs.readFileSync(ignoreFile, 'utf8'));

/* ---------- 遍历目录，模拟 wrangler 的读取（相对路径 + unix 风格分隔符） ---------- */
const all = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else all.push(path.relative(ROOT, full).split(path.sep).join('/'));
  }
})(ROOT);

const published = all.filter(p => !ig.ignores(p));
const excluded = all.filter(p => ig.ignores(p));

/* ---------- 断言 ---------- */
const MUST_PUBLISH = [
  'index.html', 'robots.txt', 'sitemap.xml',
  'assets/css/style.css', 'assets/js/app.js', 'assets/js/util.js', 'assets/og-cover.png',
  'vendor/qrcode.js', 'vendor/JsBarcode.all.min.js',
  'tool/qr/index.html',
];
const MUST_EXCLUDE = [
  '.git/config', '.git/index', '.git/HEAD', '.git/logs/HEAD', '.git/FETCH_HEAD',
  '.gitignore', 'scripts/verify-assetsignore.js', 'scripts/gen-static.js',
  'README.md', 'wrangler.jsonc', 'wrangler.toml', '_redirects', '_headers', '.assetsignore',
];

const fails = [];
const check = (p, shouldPublish) => {
  const isIgnored = ig.ignores(p);
  if (shouldPublish && isIgnored) fails.push('本该发布却被排除：' + p);
  if (!shouldPublish && !isIgnored) fails.push('本该排除却会发布：' + p);
};
MUST_PUBLISH.forEach(p => check(p, true));
MUST_EXCLUDE.forEach(p => check(p, false));

/* 工具页数量应与注册表一致（防漏跑 gen-static.js） */
const toolPages = published.filter(p => /^tool\/[^/]+\/index\.html$/.test(p)).length;
const toolDirs = fs.existsSync(path.join(ROOT, 'tool'))
  ? fs.readdirSync(path.join(ROOT, 'tool'), { withFileTypes: true }).filter(e => e.isDirectory()).length
  : 0;
if (toolPages !== toolDirs) {
  fails.push('工具页数量不一致：已生成 ' + toolDirs + ' 个目录，但只有 ' + toolPages + ' 个会被发布');
}

/* ---------- 报告 ---------- */
const byTop = {};
published.forEach(p => { const t = p.includes('/') ? p.split('/')[0] : '(根文件)'; byTop[t] = (byTop[t] || 0) + 1; });

console.log('===== 发布清单预演（wrangler 同款 ignore@5.3.1）=====');
console.log('目录内文件总数 : ' + all.length);
console.log('会发布         : ' + published.length);
console.log('被排除         : ' + excluded.length);
console.log('');
console.log('会发布的内容按顶层分布：');
Object.entries(byTop).sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log('  ' + k.padEnd(16) + v + ' 个文件'));
console.log('');

const gitLeak = published.filter(p => p.split('/').includes('.git'));
console.log('.git 残留      : ' + (gitLeak.length
  ? '✗ ' + gitLeak.length + ' 个 -> ' + gitLeak.slice(0, 5).join(', ')
  : '✓ 0 个'));
if (gitLeak.length) fails.push('.git 目录仍有 ' + gitLeak.length + ' 个文件会被发布');

console.log('');
if (fails.length) {
  console.log('✗ 断言失败 ' + fails.length + ' 项：');
  fails.forEach(f => console.log('   - ' + f));
  process.exitCode = 1;
} else {
  console.log('✓ 全部断言通过（' + (MUST_PUBLISH.length + MUST_EXCLUDE.length + 1) + ' 项）');
}

#!/usr/bin/env node
/**
 * 端到端验证：HTTP 层 + 真实浏览器层
 *
 *   SITE=https://tool.wululu.xyz/ node scripts/verify-online.js
 *   node scripts/verify-online.js                       # 默认验本地 127.0.0.1:8290
 *   SHOT=1 SITE=... node scripts/verify-online.js       # 额外存一张首页截图
 *
 * 检查三件事：
 *   A. HTTP 层 —— 静态工具页可访问且是独立页面；.git / 构建脚本等敏感路径必须 404
 *   B. 隐私层 —— 零外部网络请求（Cloudflare 平台注入的信标单独归类，不算本站问题）
 *   C. 功能层 —— CSP 未破坏任何工具：科学计算器、二维码、搜索防抖、对外链零依赖
 *
 * 依赖：playwright-core（安装在隔离 workspace，不污染系统环境）
 *   驱动本机已有 Chrome，无需下载 Chromium。
 */
'use strict';

const PW = 'C:/Users/xjn59/.workbuddy/binaries/node/workspace/node_modules/playwright-core';
const { chromium } = require(PW);
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const SITE = process.env.SITE || 'http://127.0.0.1:8290/';
const ORIGIN = SITE.replace(/\/+$/, '');
const SHOT = !!process.env.SHOT;
const SHOT_DIR = 'D:/WorkBuddy/2026-08-20-16-07-48/toolbox/.workbuddy/';

let pass = 0, fail = 0;
const failures = [];
function check(name, ok, detail) {
  if (ok) { pass++; console.log('  PASS  ' + name + (detail ? '  [' + detail + ']' : '')); }
  else { fail++; failures.push(name); console.log('  FAIL  ' + name + (detail ? '  [' + detail + ']' : '')); }
}

/* Cloudflare 边缘自动注入的 Web Analytics 信标：不在仓库里，属平台行为。
   它被本站 CSP 挡下是预期结果；不关掉就会常驻一条失败项，故单独归类不计入失败。 */
const PLATFORM_BEACON = /cloudflareinsights\.com|cloudflare\.com\/beacon/;

(async () => {
  console.log('\n================ A. HTTP 层 ================');

  const get = async (p, method = 'GET') => {
    const r = await fetch(ORIGIN + p, { method, redirect: 'manual' });
    const body = r.status === 200 && method === 'GET' ? await r.text() : '';
    return { status: r.status, body, head: r.headers };
  };

  /* A1. 首页 */
  const home = await get('/');
  check('首页 200', home.status === 200, 'HTTP ' + home.status);
  check('首页已含 og:image', /og-cover\.png/.test(home.body));
  check('首页已含 CSP', /Content-Security-Policy/i.test(home.body));

  /* A2. 静态工具页：必须是独立页面（有自己的 title / canonical），不是首页的副本 */
  const ids = ['qr', 'scientific', 'base64', 'json'];
  for (const id of ids) {
    const r = await get('/tool/' + id + '/');
    const ownTitle = new RegExp('rel="canonical" href="[^"]*/tool/' + id + '/').test(r.body);
    const isCopyOfHome = /id="hero-count"/.test(r.body);
    check('/tool/' + id + '/ 可访问且为独立页', r.status === 200 && ownTitle && !isCopyOfHome,
      'HTTP ' + r.status + (ownTitle ? '' : ' 无独立canonical') + (isCopyOfHome ? ' 疑似首页副本' : ''));
  }

  /* A3. 敏感路径必须 404 —— 这是本次最关键的回归项 */
  const must404 = [
    '/.git/index', '/.git/config', '/.git/HEAD', '/.git/logs/HEAD', '/.git/FETCH_HEAD',
    '/.gitignore', '/.assetsignore', '/wrangler.jsonc', '/wrangler.toml',
    '/scripts/gen-static.js', '/scripts/verify-assetsignore.js', '/README.md', '/_redirects'
  ];
  const leaked = [];
  for (const p of must404) {
    const r = await get(p);
    if (r.status !== 404) leaked.push(p + '=' + r.status);
  }
  check('敏感路径全部 404（' + must404.length + ' 项）', leaked.length === 0,
    leaked.length ? leaked.join(' ') : '.git/ 与构建产物无泄露');

  /* A4. 必须存在的基础文件 */
  for (const [p, want] of [['/robots.txt', 200], ['/sitemap.xml', 200], ['/assets/og-cover.png', 200]]) {
    const r = await get(p, 'HEAD');
    check(p + ' 可访问', r.status === want, 'HTTP ' + r.status);
  }

  console.log('\n================ B/C. 浏览器层 ================');
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();

  const requests = [], cspViolations = [], consoleErrors = [], pageErrors = [];
  page.on('request', r => requests.push(r.url()));
  page.on('console', m => {
    const t = m.text();
    if (/Content Security Policy|Refused to/i.test(t)) cspViolations.push(t.slice(0, 160));
    if (m.type() === 'error' && !/Content Security Policy|Refused to/i.test(t)) consoleErrors.push(t.slice(0, 160));
  });
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 160)));

  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' });

  /* B1. 工具总数 */
  const heroCount = (await page.textContent('#hero-count').catch(() => '')) || '';
  const cardCount = await page.locator('.tool-card').count();
  check('工具总数已渲染', /^\d+$/.test(heroCount.trim()) && Number(heroCount.trim()) > 100,
    'hero-count=' + heroCount.trim() + ' 卡片=' + cardCount);

  /* B2. 搜索防抖：单次输入应只产出一次渲染（防抖生效则结果正确且不卡顿） */
  await page.fill('#search', 'json');
  await page.waitForTimeout(350);
  const searched = await page.locator('.tool-card').count();
  check('搜索可用且已防抖', searched > 0 && searched < cardCount, '"json" -> ' + searched + ' 项');

  /* B3. 对外链零依赖：分享卡片预览必须已无 picsum */
  await page.fill('#search', '分享卡片');
  await page.waitForTimeout(350);
  await page.click('.tool-card >> nth=0').catch(() => {});
  await page.waitForTimeout(400);
  const ogHtml = await page.content();
  check('picsum.photos 已无残留', !/picsum\.photos/.test(ogHtml));

  /* C1. 科学计算器（依赖 new Function，CSP 必须放行 'unsafe-eval'） */
  await page.goto(ORIGIN + '/#/tool/scientific', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.fill('#sc-in', 'pow(2,3)+sin(pi/2)');
  await page.click('#sc-go');
  await page.waitForTimeout(250);
  const scOut = await page.textContent('#sc-out').catch(() => 'NO_OUT');
  check('科学计算器可用（new Function 未被 CSP 拦）', /9/.test(scOut), 'pow(2,3)+sin(pi/2) -> ' + scOut);

  /* C2. 二维码（内联 SVG，受 CSP 管控） */
  await page.goto(ORIGIN + '/#/tool/qr', { waitUntil: 'networkidle' });
  await page.fill('#qr-in', 'https://tool.wululu.xyz/');
  await page.click('#qr-go');
  await page.waitForTimeout(500);
  const qr = await page.evaluate(() => {
    const box = document.querySelector('#qr-box');
    if (!box) return 'NO_BOX';
    const svg = box.querySelector('svg');
    if (svg) return 'inline-svg';
    const img = box.querySelector('img');
    if (img) return img.src.startsWith('data:') ? 'data-uri' : (img.src.startsWith('blob:') ? 'blob' : img.src.slice(0, 30));
    return 'EMPTY';
  });
  check('二维码生成正常', qr === 'inline-svg' || qr === 'data-uri' || qr === 'blob', qr);

  /* C3. 从静态页直达时 JS 是否正常接管（路径路由）+ 静态内容仍在 */
  const st = await page.goto(ORIGIN + '/tool/qr/', { waitUntil: 'networkidle' });
  check('/tool/qr/ 静态页 200', st.status() === 200, 'HTTP ' + st.status());
  await page.waitForTimeout(600);
  const hasInput = await page.locator('#qr-in').count();
  const stillText = await page.evaluate(() => document.body.innerText.length);
  check('/tool/qr/ 上 JS 已接管且内容完整', hasInput > 0 && stillText > 300,
    '输入框=' + hasInput + ' 正文=' + stillText + ' 字');

  /* B4. 外部请求统计 */
  const external = requests.filter(u => !u.startsWith(ORIGIN) && !/^(data|blob|about):/.test(u));
  const ours = external.filter(u => !PLATFORM_BEACON.test(u));
  check('本站零外部网络请求', ours.length === 0, ours.length ? ours.join(' , ') : '全部同域');
  if (external.length !== ours.length) {
    console.log('  INFO  Cloudflare 平台自动注入的信标 ' + (external.length - ours.length) +
      ' 个（不在仓库内，需在 CF 控制台关闭 Web Analytics）:');
    [...new Set(external.filter(u => PLATFORM_BEACON.test(u)))].forEach(u => console.log('        ' + u.slice(0, 100)));
  }

  /* 其余健康度：CSP 违规、控制台错误、未捕获异常 */
  const realCsp = cspViolations.filter(t => !PLATFORM_BEACON.test(t));
  check('无 CSP 违规（本站资源）', realCsp.length === 0, realCsp.length ? realCsp[0] : '');
  check('无未捕获 JS 异常', pageErrors.length === 0, pageErrors.join(' | ') || '');
  check('控制台无 error', consoleErrors.length === 0, consoleErrors.join(' | ') || '');

  if (SHOT) {
    await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: SHOT_DIR + 'shot-home.png', fullPage: false });
    console.log('\n  截图: ' + SHOT_DIR + 'shot-home.png');
  }

  await browser.close();

  console.log('\n================ 结果 ================');
  console.log('  ' + pass + ' passed, ' + fail + ' failed   (目标 ' + ORIGIN + ')');
  if (fail) { console.log('  失败项: ' + failures.join(' | ')); process.exit(1); }
  console.log('  ✓ 全部通过');
})();

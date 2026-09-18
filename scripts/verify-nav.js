#!/usr/bin/env node
/* ============================================================
   导航体验回归测试 —— 专治两类线上体感 bug
   ------------------------------------------------------------
   背景（2026-09-18 老板反馈）：
     ① 工具页底部的「同类工具」链接是真 <a href="/tool/x/">，点击会
        **整页重载**。新文档的 <html> 上没有 data-theme，CSS 先按默认
        深色渲染，等底部 app.js 执行完才翻成浅色 —— 浅色主题用户会看到
        一下「深→浅」的闪屏。
     ② 静态工具页（tool/<id>/index.html）里**没有首页外壳**（site-header /
        hero / site-footer 都不在 DOM 里，见 gen-static.js 的模板）。
        在这类页面上点「返回」走 SPA 渲染，#home-view 确实填满了工具
        卡片，但头部、搜索框、分类导航、页脚全都不存在 → 「首页展示不全」。

   本脚本就盯这两件事，外加「导航不许整页重载」这个根治项。

   用法：
     node scripts/verify-nav.js                 # 默认 127.0.0.1:8290
     SITE=http://127.0.0.1:8290/ node scripts/verify-nav.js
   退出码：断言失败为 1。
   依赖：playwright-core + 本机 Chrome（同 verify-online.js，不下载 Chromium）
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const PW = 'C:/Users/xjn59/.workbuddy/binaries/node/workspace/node_modules/playwright-core';
const { chromium } = require(PW);
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const ROOT = path.resolve(__dirname, '..');
const SITE = (process.env.SITE || 'http://127.0.0.1:8290/').replace(/\/+$/, '');
const THEME = process.env.THEME || 'light'; // 闪屏只在「存了浅色」时才可见
const LIGHT_BG = 'rgb(245, 247, 251)';      // :root 之外的 html[data-theme=light] --bg

let pass = 0, fail = 0;
const failures = [];
function check(name, ok, detail) {
  if (ok) { pass++; console.log('  PASS  ' + name + (detail ? '  [' + detail + ']' : '')); }
  else { fail++; failures.push(name); console.log('  FAIL  ' + name + (detail ? '  [' + detail + ']' : '')); }
}

/** 把 data-theme 的每一次变化记成轨迹。注意：init script 执行时
 *  documentElement 可能还不存在，必须容错，否则探针自己会抛异常。 */
async function watchThemeFlips(page) {
  await page.addInitScript(() => {
    window.__themeLog = [];
    const rec = () => {
      try { window.__themeLog.push(document.documentElement.getAttribute('data-theme') || '(none)'); }
      catch (e) { /* documentElement 还没建好 */ }
    };
    const boot = () => {
      rec();
      new MutationObserver(ms => { for (const m of ms) if (m.attributeName === 'data-theme') rec(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    };
    if (document.documentElement) boot();
    else document.addEventListener('DOMContentLoaded', boot, { once: true });
  });
}

(async () => {
  console.log('\n=========== ⓪ 主题引导的时序（防闪屏的充分条件） ===========');
  /* data-theme 由 JS 写入，唯一能保证「不闪」的就是它在样式表之前同步执行。
     这一条只能静态断言：运行期观察到的最早状态已经在 JS 之后了。 */
  const pages = [path.join(ROOT, 'index.html')].concat(
    fs.readdirSync(path.join(ROOT, 'tool'), { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => path.join(ROOT, 'tool', e.name, 'index.html'))
  );
  const noBoot = [], wrongOrder = [];
  for (const p of pages) {
    const s = fs.readFileSync(p, 'utf8');
    const iBoot = s.indexOf('theme-boot.js');
    const iCss = s.indexOf('style.css');
    if (iBoot < 0) noBoot.push(path.relative(ROOT, p));
    else if (iBoot > iCss) wrongOrder.push(path.relative(ROOT, p));
  }
  check('每个页面都引入了主题引导脚本（' + pages.length + ' 页）',
    noBoot.length === 0, noBoot.length ? noBoot.slice(0, 3).join(' , ') : 'index + 155 工具页');
  check('主题引导都排在样式表之前（否则等于没加）',
    wrongOrder.length === 0, wrongOrder.length ? wrongOrder.slice(0, 3).join(' , ') : '');

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext();
  // 预置浅色主题：这是能看到「深→浅」闪屏的唯一前提
  await ctx.addInitScript(t => { try { localStorage.setItem('tb-theme', t); } catch (e) {} }, THEME);
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 120)));

  console.log('\n=========== ① 工具页 → 同类工具链接（不许闪屏、不许整页重载） ===========');

  await watchThemeFlips(page);
  /* ⚠️ 别用 framenavigated 计数：Playwright 在 pushState/replaceState 这类
     同文档导航上也会触发它，区分不了「SPA 跳转」和「整页重载」。
     load 事件只在真正加载文档时触发，才是我们要的指标。 */
  let loads = 0;
  page.on('load', () => loads++);

  await page.goto(SITE + '/tool/json/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const bootState = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    bg: getComputedStyle(document.body).backgroundColor,
  }));
  check('静态工具页首屏主题即按偏好应用',
    bootState.theme === THEME && bootState.bg === LIGHT_BG,
    'data-theme=' + bootState.theme + ' body背景=' + bootState.bg);

  const loadBefore = loads;
  await page.click('.tb-same a >> nth=0');
  await page.waitForTimeout(700);

  const docLoads = loads - loadBefore;
  check('点击同类工具链接不触发整页重载', docLoads === 0, '文档 load 次数 = ' + docLoads);
  check('点击后 URL 已更新到目标工具',
    /\/tool\/[^/]+\/?$/.test(new URL(page.url()).pathname), page.url().replace(SITE, ''));
  check('目标工具已真正渲染（不是空壳）',
    (await page.locator('#tb-root[data-tool-id]').count()) > 0,
    (await page.locator('#tb-root').getAttribute('data-tool-id')) || '');

  const themeAfter = await page.evaluate(() => (window.__themeLog || []).slice());
  check('全程主题无翻转', themeAfter.every(v => v === THEME) && themeAfter.length > 0,
    'theme 轨迹 = ' + JSON.stringify(themeAfter));

  console.log('\n=========== ② 「返回」必须得到完整首页（头部/搜索/分类/页脚） ===========');

  const homeShell = async () => page.evaluate(() => {
    const vis = el => !!el && getComputedStyle(el).display !== 'none';
    return {
      header: vis(document.querySelector('.site-header')),
      hero: vis(document.querySelector('.hero')),
      search: vis(document.querySelector('#search')),
      catNav: vis(document.querySelector('#cat-nav')),
      footer: vis(document.querySelector('.site-footer')),
      cards: document.querySelectorAll('#home-view .tool-card').length,
      chips: document.querySelectorAll('#cat-nav .cat-chip').length,
      url: location.pathname,
    };
  });

  // ②-1 从首页进工具再返回（SPA 路径）
  await page.goto(SITE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.click('.tool-card >> nth=0');
  await page.waitForTimeout(400);
  await page.click('#tb-back');
  await page.waitForTimeout(400);
  let h = await homeShell();
  check('首页→工具→返回：首页外壳与卡片齐全',
    h.header && h.hero && h.search && h.catNav && h.footer && h.cards > 100,
    `header=${h.header} hero=${h.hero} search=${h.search} catNav=${h.catNav} footer=${h.footer} 卡片=${h.cards} 分类=${h.chips}`);

  // ②-2 直接落在静态工具页再点「返回」（老板实际踩到的路径）
  await page.goto(SITE + '/tool/base64/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.click('#tb-back');
  await page.waitForTimeout(1200);
  h = await homeShell();
  check('静态工具页→返回：首页外壳与卡片齐全',
    h.header && h.hero && h.search && h.catNav && h.footer && h.cards > 100,
    `header=${h.header} hero=${h.hero} search=${h.search} catNav=${h.catNav} footer=${h.footer} 卡片=${h.cards} 分类=${h.chips}`);
  check('返回后 URL 回到站点根', h.url === '/', h.url);

  // ②-3 静态工具页顶部面包屑的「首页」
  await page.goto(SITE + '/tool/json/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.click('.tb-crumb a');
  await page.waitForTimeout(1200);
  h = await homeShell();
  check('面包屑「首页」链接：首页完整',
    h.header && h.hero && h.search && h.footer && h.cards > 100,
    `header=${h.header} hero=${h.hero} search=${h.search} footer=${h.footer} 卡片=${h.cards}`);

  // ②-4 静态工具页底部「← 返回首页」链接
  await page.goto(SITE + '/tool/json/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.click('.tb-home a');
  await page.waitForTimeout(1200);
  h = await homeShell();
  check('页尾「返回首页」链接：首页完整',
    h.header && h.search && h.footer && h.cards > 100,
    `header=${h.header} search=${h.search} footer=${h.footer} 卡片=${h.cards}`);

  // ②-5 老板的实际点击顺序：进工具 → 点同类工具跳另一个 → 再点返回
  await page.goto(SITE + '/tool/json/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.click('.tb-same a >> nth=0');
  await page.waitForTimeout(500);
  const midTool = await page.locator('#tb-root').getAttribute('data-tool-id');
  await page.click('#tb-back');
  await page.waitForTimeout(1200);
  h = await homeShell();
  check('工具→同类工具→返回：首页完整',
    h.header && h.hero && h.search && h.catNav && h.footer && h.cards > 100,
    `中途工具=${midTool} header=${h.header} search=${h.search} footer=${h.footer} 卡片=${h.cards}`);

  console.log('\n=========== ③ 回归：SPA 路由、前进后退、外链、修饰键 ===========');
  await page.goto(SITE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.click('.tool-card >> nth=0');
  await page.waitForTimeout(400);
  const toolUrl = new URL(page.url()).pathname;
  check('首页点卡片进入工具页', /^\/tool\/[^/]+\/$/.test(toolUrl), toolUrl);

  // 首页上的搜索框在工具页不可见，返回后应恢复原状态
  await page.click('#tb-back');
  await page.waitForTimeout(400);
  await page.fill('#search', 'json');
  await page.waitForTimeout(350);
  const searched = await page.locator('.tool-card').count();
  check('返回首页后搜索仍可用', searched > 0 && searched < 100, '"json" -> ' + searched + ' 项');

  await page.click('#search-clear');
  await page.waitForTimeout(300);
  await page.click('.tool-card >> nth=0');
  await page.waitForTimeout(400);
  await page.goBack();
  await page.waitForTimeout(500);
  h = await homeShell();
  check('浏览器后退回到完整首页', h.header && h.cards > 100, `卡片=${h.cards} header=${h.header}`);
  await page.goForward();
  await page.waitForTimeout(500);
  check('浏览器前进回到工具页', (await page.locator('#tb-root[data-tool-id]').count()) > 0,
    (await page.locator('#tb-root').getAttribute('data-tool-id')) || '');

  // 外链不能被接管（GitHub / 问题反馈）
  await page.goto(SITE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const extOk = await page.evaluate(() => {
    const a = document.querySelector('.footer-links a[href^="https://github.com"]');
    return !!a && a.target === '_blank';
  });
  check('页脚外链保留原样（新标签打开）', extOk);

  // 修饰键 + 中键必须放行给浏览器（新标签）。
  // 注意用真链接（.tb-same a）来验：首页卡片是 <div>，它压根不在「链接拦截」
  // 这条链路上（走的是卡片自己的 onclick），拿它验修饰键只会得出错误结论。
  const newTabs = [];
  ctx.on('page', p => newTabs.push(p));
  await page.goto(SITE + '/tool/json/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const linkPath = new URL(page.url()).pathname;
  await page.click('.tb-same a >> nth=0', { modifiers: ['Control'] });
  await page.waitForTimeout(600);
  check('Ctrl+点击同类工具链接由浏览器新开标签', newTabs.length === 1, '新标签数 = ' + newTabs.length);
  check('Ctrl+点击后当前页未跳走', new URL(page.url()).pathname === linkPath,
    linkPath + ' -> ' + new URL(page.url()).pathname);

  check('无未捕获 JS 异常', pageErrors.length === 0, pageErrors.join(' | '));

  await browser.close();
  console.log('\n================ 结果 ================');
  console.log('  ' + pass + ' passed, ' + fail + ' failed   (目标 ' + SITE + ' 主题 ' + THEME + ')');
  if (fail) { console.log('  失败项: ' + failures.join(' | ')); process.exit(1); }
  console.log('  ✓ 全部通过');
})();

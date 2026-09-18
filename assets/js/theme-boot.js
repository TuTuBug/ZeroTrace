/* ============================================================
   首屏主题引导 —— 必须放在 <head>、且在 style.css 之前同步执行
   ------------------------------------------------------------
   解决什么问题（2026-09-18 反馈「切工具时深浅色闪一下」）：
     主题靠 <html data-theme="..."> 驱动，而这个属性原先只由页面**底部**
     的 app.js 写入。整页重载时（例如点工具页底部的同类工具链接），新文档
     会先按 :root 的默认深色把首屏画出来，等 app.js 执行完才翻成浅色 ——
     浅色用户就会看到一下「深 → 浅」的闪屏。

   为什么是独立文件而不是内联 <script>：
     本站 CSP 是 script-src 'self' 'unsafe-eval'，没有 'unsafe-inline'，
     内联脚本会被直接拦掉。而「在 CSS 生效前把属性写到 <html> 上」这件事
     又必须在解析 head 时同步完成，所以只能是一个极小的外链脚本。

   ⚠️ 这个文件的执行时机就是它的全部价值：
      - 必须留在 <head> 内、且排在 <link rel="stylesheet"> 之前；
      - scripts/gen-static.js 会把本标签原样复制进 155 个静态工具页，
        并断言它出现在样式表之前 —— 挪到 </body> 前就等于白加。
   ============================================================ */
(function () {
  var BG = { dark: '#0f1117', light: '#f5f7fb' };
  var theme = 'dark';
  try {
    /* 只认显式的 'light'：没存过、存了脏值、localStorage 被禁用都退回深色（本站默认） */
    if (localStorage.getItem('tb-theme') === 'light') theme = 'light';
  } catch (e) { /* 隐私模式下 localStorage 可能抛异常，忽略即可 */ }

  if (document.documentElement) document.documentElement.setAttribute('data-theme', theme);

  /* 移动端浏览器地址栏/状态栏配色也跟着走，否则浅色页面顶着一条深色顶栏 */
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', BG[theme]);

  /* 交给 app.js 复用，避免两处各读一次 localStorage 后判断不一致 */
  window.TB_THEME = theme;
})();

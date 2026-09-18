/* ============ 应用外壳：首页 / 路由 / 搜索 ============ */
(function () {
  const T = window.TB;
  const homeView = document.getElementById('home-view');
  const toolView = document.getElementById('tool-view');
  const catNav = document.getElementById('cat-nav');
  const search = document.getElementById('search');
  const searchClear = document.getElementById('search-clear');

  let curCat = 'all';
  let query = '';
  let mode = null;
  let homeState = null; // 返回首页时还原：{ curCat, query, search, scrollY }

  /* 我的常用（收藏）：localStorage 持久化，默认 5 个，用户可增删 */
  const FAV_KEY = 'tb-fav';
  const FAV_DEFAULT = ['img-compress', 'json', 'qr', 'mortgage', 'password'];
  let favs = (() => {
    try {
      const v = JSON.parse(localStorage.getItem(FAV_KEY));
      if (Array.isArray(v)) return v.filter(id => T.tools.some(t => t.id === id));
    } catch (e) {}
    return FAV_DEFAULT.slice();
  })();
  const isFav = (id) => favs.includes(id);
  function toggleFav(id) {
    favs = isFav(id) ? favs.filter(x => x !== id) : favs.concat(id);
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    renderCatNav(); renderHome();
  }
  const favTools = () => favs.map(id => T.tools.find(t => t.id === id)).filter(Boolean);

  /* 主题
     首屏已经由 <head> 里的 theme-boot.js 同步写好 data-theme（整页重载时
     才不会先闪一下默认深色），这里只负责「切换 + 持久化」。
     ⚠️ 启动时不要再 setAttribute 一次：属性值没变也会触发一次 mutation，
     在浅色用户那里就是一次无意义的属性抖动。 */
  const THEME_BG = { dark: '#0f1117', light: '#f5f7fb' };
  function applyTheme(next) {
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('tb-theme', next); } catch (e) {}
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_BG[next] || THEME_BG.dark);
    window.TB_THEME = next;
  }
  function toggleTheme() {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.onclick = toggleTheme;

  /* ============ 站内跳转的加载遮罩 ============
     SPA 内部的跳转（首页 ↔ 工具、工具 ↔ 工具）是同步渲染，瞬间完成，
     加遮罩只会闪；真正需要盖一下的是**跨文档跳转**（例：从静态工具页
     回首页），那时页面会被整个替换。兜底超时用于「导航被取消」的情况。 */
  let loadTimer = null;
  function hideLoading() {
    clearTimeout(loadTimer);
    document.body.classList.remove('tb-loading-on');
  }
  function showLoading(text) {
    let el = document.getElementById('tb-loading');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tb-loading';
      el.innerHTML = '<div class="tb-loading-box"><span class="tb-spinner"></span>'
        + '<span class="tb-loading-txt"></span></div>';
      document.body.appendChild(el);
    }
    el.querySelector('.tb-loading-txt').textContent = text || '加载中…';
    document.body.classList.add('tb-loading-on');
    clearTimeout(loadTimer);
    loadTimer = setTimeout(hideLoading, 5000);
  }
  /* 从 bfcache 返回时 DOM 是原样带回来的，遮罩可能还亮着 → 清掉 */
  window.addEventListener('pageshow', hideLoading);

  /* 分类导航（含「我的常用」） */
  function renderCatNav() {
    if (!catNav) return; // 静态工具页没有首页外壳
    const chips = [['all', '全部', '🧰'], ['fav', '我的常用', '⭐', favs.length]];
    Object.entries(T.categories).forEach(([k, v]) => chips.push([k, v.name, v.icon]));
    catNav.innerHTML = chips.map(([k, name, ico, cnt]) =>
      `<span class="cat-chip ${k === curCat ? 'active' : ''}" data-cat="${k}">${ico} ${name}${cnt != null ? ` (${cnt})` : ''}</span>`).join('');
    catNav.querySelectorAll('[data-cat]').forEach(el => el.onclick = () => {
      curCat = el.dataset.cat; query = '';
      if (search) search.value = '';
      if (searchClear) searchClear.hidden = true;
      renderCatNav(); renderHome();
    });
  }

  /* 工具卡片（右上角 ☆ 加入/移出常用） */
  function card(t) {
    const fav = isFav(t.id);
    return `<div class="tool-card" data-id="${t.id}">
      <button class="t-fav ${fav ? 'on' : ''}" data-fav="${t.id}" title="${fav ? '从常用移除' : '加入常用'}" aria-label="收藏">${fav ? '★' : '☆'}</button>
      <div class="t-ico">${t.icon}</div>
      <div class="t-name">${esc(t.name)}</div>
      <div class="t-desc">${esc(t.desc)}</div>
    </div>`;
  }

  function sectionHTML(ico, name, items, count, isFav) {
    const hint = isFav ? '<span class="fav-hint">点卡片右上角 ☆ 增删</span>' : '';
    return `<section class="cat-section ${isFav ? 'fav-section' : ''}"><div class="cat-head"><span class="cat-ico">${ico}</span><h2>${name}</h2>${hint}<span class="cat-count">${count}</span></div>
      <div class="tool-grid">${items.map(card).join('')}</div></section>`;
  }
  function emptyFavHTML() {
    return `<section class="cat-section fav-section"><div class="cat-head"><span class="cat-ico">⭐</span><h2>我的常用</h2></div>
      <div class="empty"><div class="big">☆</div><p>还没有常用工具</p><p class="muted">在任意工具卡片右上角点 ☆ 即可加入</p></div></section>`;
  }
  function attachCardHandlers() {
    homeView.querySelectorAll('[data-id]').forEach(el => el.onclick = (e) => {
      if (e.target.closest('[data-fav]')) return; // 点的是收藏星标，不打开工具
      nav('/tool/' + encodeURIComponent(el.dataset.id) + '/');
    });
    homeView.querySelectorAll('[data-fav]').forEach(el => el.onclick = (e) => { e.stopPropagation(); toggleFav(el.dataset.fav); });
  }

  function filtered() {
    const q = query.trim().toLowerCase();
    return T.tools.filter(t => {
      if (curCat === 'fav' && !isFav(t.id)) return false;
      if (curCat !== 'all' && curCat !== 'fav' && t.cat !== curCat) return false;
      if (!q) return true;
      return (t.name + t.desc + t.keywords + (T.categories[t.cat]?.name || '')).toLowerCase().includes(q);
    });
  }

  /* 首页（returning=true 时还原用户上次停留的位置） */
  function renderHome(returning) {
    document.body.classList.remove('tool-open');
    if (returning && homeState) {
      curCat = homeState.curCat;
      query = homeState.query;
      if (search) search.value = homeState.search;
      if (searchClear) searchClear.hidden = query === '';
    }
    renderCatNav();
    toolView.hidden = true; homeView.hidden = false;
    const list = filtered();
    if (query.trim()) {
      homeView.innerHTML = `<div class="cat-section"><div class="cat-head"><h2>搜索结果</h2><span class="cat-count">${list.length} 个工具</span></div>
        <div class="tool-grid">${list.map(card).join('') || '<div class="empty"><div class="big">🔍</div>没有匹配的工具</div>'}</div></div>`;
    } else if (curCat === 'fav') {
      const items = favTools();
      homeView.innerHTML = items.length ? sectionHTML('⭐', '我的常用', items, items.length, true) : emptyFavHTML();
    } else if (curCat === 'all') {
      const favItems = favTools();
      const favHTML = favItems.length ? sectionHTML('⭐', '我的常用', favItems, favItems.length, true) : '';
      const rest = Object.entries(T.categories).map(([k, v]) => {
        const items = T.tools.filter(t => t.cat === k);
        return sectionHTML(v.icon, v.name, items, items.length, false);
      }).join('');
      homeView.innerHTML = favHTML + rest;
    } else {
      const items = T.tools.filter(t => t.cat === curCat);
      homeView.innerHTML = sectionHTML(T.categories[curCat].icon, T.categories[curCat].name, items, items.length, false);
    }
    attachCardHandlers();
    mode = 'home';
    if (returning && homeState) requestAnimationFrame(() => window.scrollTo(0, homeState.scrollY));
  }

  /* 工具页 */
  function openTool(id) {
    const t = T.tools.find(x => x.id === id);
    if (!t) {
      /* 未知工具 ID：直接回首页，别把用户/爬虫留在白屏上 */
      if (canPush) { try { history.replaceState({}, '', '/'); } catch (e) {} }
      renderHome(false);
      return;
    }
    let root = toolView.querySelector('#tb-root');
    const sameTool = root && root.dataset.toolId === id;
    /* 同一工具已渲染（hashchange 与 popstate 会重复触发路由）→ 不重复 init，
       否则带 setInterval / canvas 的工具会被初始化两次 */
    if (sameTool && mode === 'tool') { window.scrollTo(0, 0); return; }

    // 进入前记录首页状态，供返回时还原。
    // ⚠️ 只在「从首页出发」时记录：工具页之间互跳时若也记录，会把工具页的
    // 滚动位置当成首页的滚动位置存下来，返回首页就跳到莫名其妙的中间位置。
    if (mode === 'home') homeState = { curCat, query, search: search ? search.value : '', scrollY: window.scrollY };
    document.body.classList.add('tool-open');
    toolView.hidden = false; homeView.hidden = true;

    if (!sameTool) {
      /* 未预渲染（或目标工具与当前预渲染页不符）→ 现场构建。
         走 toolViewHTML()，与静态页生成脚本同源，保证两边 DOM 完全一致。 */
      toolView.innerHTML = toolViewHTML(t);
      root = toolView.querySelector('#tb-root');
    }
    /* 静态预渲染页已带 DOM，这里只补事件绑定 */
    try { t.init(root); } catch (e) { root.insertAdjacentHTML('beforeend', `<div class="out err">工具初始化出错：${esc(e.message)}</div>`); }

    const back = toolView.querySelector('#tb-back');
    if (back) back.onclick = () => nav('/');
    const tbTheme = toolView.querySelector('#tb-theme');
    if (tbTheme) tbTheme.onclick = toggleTheme;
    mode = 'tool';
    window.scrollTo(0, 0);
  }

  /* 路由解析：干净路径 /tool/<id>/ 优先，其次兼容老的 #/tool/<id> */
  function parseRoute() {
    const p = (location.pathname || '/').replace(/\/+$/, '') || '/';
    let m = p.match(/^\/tool\/([^/]+)$/);
    if (m) return decodeURIComponent(m[1]);
    const h = (location.hash || '#/').replace(/\/+$/, '');
    m = h.match(/^#\/tool\/([^/]+)$/);
    if (m) return decodeURIComponent(m[1]);
    return null;
  }

  /* 导航：优先 History API（干净 URL 才好被搜索引擎收录）；
     pushState 不可用时（如 file:// 直接打开）自动退化为 hash */
  let canPush = true;
  /* file:// 直接打开时 replaceState/pushState 会抛 SecurityError → 提前探测并退化到 hash */
  try { history.replaceState(history.state, '', location.href); } catch (e) { canPush = false; }

  /* 当前文档里有没有「首页外壳」（页头 / Hero 搜索框与分类导航 / 页脚）。
     index.html 有；tool/<id>/index.html 这份静态页**没有**（见 gen-static.js
     的模板：只有 <main> + #tool-view + #toast）。 */
  const HAS_SHELL = !!document.querySelector('.site-header');
  const IS_HTTP = /^https?:$/.test(location.protocol);

  function nav(path) {
    /* 静态工具页 → 首页必须是**真导航**：这种文档里没有 site-header / hero /
       footer，若走 SPA 只把卡片塞进 #home-view，用户看到的就是一个没有页头、
       没有搜索框、没有分类导航、没有页脚的残缺首页（2026-09-18 反馈的原话
       「返回到首页，首页展示的不全」）。让浏览器去取完整的 index.html。 */
    if (!HAS_SHELL && IS_HTTP && path === '/') {
      /* 从 /tool/<id>/ 反推首页，顺带支持部署在子路径下（/sub/tool/<id>/ → /sub/）。
         反推不出来就老实用 '/'，绝不 assign 到当前地址把自己转成死循环。 */
      const home = /\/tool\/[^/]+\/?$/.test(location.pathname)
        ? location.pathname.replace(/\/tool\/[^/]+\/?$/, '/') : '/';
      showLoading('正在返回首页…');
      location.assign(home);
      return;
    }
    if (canPush) {
      try { history.pushState({}, '', path); route(); return; }
      catch (e) { canPush = false; }
    }
    location.hash = '#' + path;
  }

  /* 接管站内链接的点击，避免整页重载。
     工具页底部的「同类工具」是真 <a href="/tool/x/">（为了给爬虫一张内链网，
     见 util.js 的 seoSectionHTML）。不接管的话每点一次都重载整个应用：慢，
     而且新文档要等底部 app.js 执行完才能把主题写上 —— 就是那个深浅色闪屏。
     静态页里的 <a> 也照样接管（工具视图 = toolViewHTML() 现场重建，两边同源）。
     注意：只拦「普通左键点击」，外链 / 新标签 / 下载 / 修饰键一律放行。 */
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#') return;
    let url;
    try { url = new URL(raw, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;                       // GitHub 等外链照常
    if (url.pathname !== '/' && !/^\/tool\/[^/]+\/$/.test(url.pathname)) return; // 只接管首页与工具页
    e.preventDefault();
    nav(url.pathname + url.search);
  });

  function route() {
    const id = parseRoute();
    if (id) openTool(id); else renderHome(mode === 'tool');
  }

  /* 搜索（120ms 防抖：避免每次按键都全量重绘上百张卡片） */
  let searchTimer = null;
  if (search) search.addEventListener('input', () => {
    query = search.value;
    if (searchClear) searchClear.hidden = query === '';
    clearTimeout(searchTimer);
    if (mode === 'tool') {
      // 在工具页搜索：必须立刻切回首页。若延迟渲染，中间的路由回调
      // 会以 mode==='tool' 调用 renderHome(true)，用首页快照覆盖掉 query。
      nav('/');
      renderCatNav(); renderHome();
      return;
    }
    searchTimer = setTimeout(() => { renderCatNav(); renderHome(); }, 120);
  });
  if (searchClear) searchClear.onclick = () => { search.value = ''; query = ''; searchClear.hidden = true; renderHome(); };

  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);

  /* 启动 */
  const heroCount = document.getElementById('hero-count');
  if (heroCount) heroCount.textContent = T.tools.length;
  /* 老的 hash 链接（#/tool/x）规范化为干净路径，避免同一内容两种 URL */
  if (canPush && /^#\/tool\//.test(location.hash || '')) {
    const sid = parseRoute();
    if (sid) { try { history.replaceState({}, '', '/tool/' + encodeURIComponent(sid) + '/'); } catch (e) {} }
  }
  renderCatNav();
  route();

  /* data-link 等标记的链接统一切回首页 */
  document.querySelectorAll('[data-link]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); nav('/'); }));
})();

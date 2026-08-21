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

  /* 主题 */
  const savedTheme = localStorage.getItem('tb-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('theme-toggle').onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('tb-theme', next);
  };

  /* 分类导航（含「我的常用」） */
  function renderCatNav() {
    const chips = [['all', '全部', '🧰'], ['fav', '我的常用', '⭐', favs.length]];
    Object.entries(T.categories).forEach(([k, v]) => chips.push([k, v.name, v.icon]));
    catNav.innerHTML = chips.map(([k, name, ico, cnt]) =>
      `<span class="cat-chip ${k === curCat ? 'active' : ''}" data-cat="${k}">${ico} ${name}${cnt != null ? ` (${cnt})` : ''}</span>`).join('');
    catNav.querySelectorAll('[data-cat]').forEach(el => el.onclick = () => {
      curCat = el.dataset.cat; query = ''; search.value = ''; searchClear.hidden = true;
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
      location.hash = '#/tool/' + el.dataset.id;
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
      search.value = homeState.search;
      searchClear.hidden = query === '';
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
    if (!t) { location.hash = '#/'; return; }
    // 进入前记录首页状态，供返回时还原
    homeState = { curCat, query, search: search.value, scrollY: window.scrollY };
    document.body.classList.add('tool-open');
    toolView.hidden = false; homeView.hidden = true;
    toolView.innerHTML = `<div class="tool-topbar"><button class="tool-back" id="tb-back">← 返回</button><button class="icon-btn" id="tb-theme" title="切换主题" aria-label="切换主题">🌓</button></div><div id="tb-root"></div>`;
    const root = toolView.querySelector('#tb-root');
    root.innerHTML = t.render();
    try { t.init(root); } catch (e) { root.innerHTML += `<div class="out err">工具初始化出错：${esc(e.message)}</div>`; }
    toolView.querySelector('#tb-back').onclick = () => { location.hash = '#/'; };
    toolView.querySelector('#tb-theme').onclick = () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('tb-theme', next);
    };
    mode = 'tool';
    window.scrollTo(0, 0);
  }

  /* 路由 */
  function route() {
    const h = location.hash || '#/';
    const m = h.match(/^#\/tool\/(.+)$/);
    if (m) openTool(m[1]); else renderHome(mode === 'tool');
  }

  /* 搜索 */
  search.addEventListener('input', () => {
    query = search.value; searchClear.hidden = query === '';
    if (location.hash && location.hash !== '#/') location.hash = '#/';
    renderCatNav(); renderHome();
  });
  searchClear.onclick = () => { search.value = ''; query = ''; searchClear.hidden = true; renderHome(); };

  window.addEventListener('hashchange', route);

  /* 启动 */
  renderCatNav();
  route();

  /* 暴露给卡片点击（data-link 等备用） */
  document.querySelectorAll('[data-link]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); location.hash = '#/'; }));
})();

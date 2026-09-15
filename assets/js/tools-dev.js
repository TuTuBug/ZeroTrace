/* ============ 开发 / 编码工具 ============ */
(function () {
  const T = window.TB;

  // JSON 树视图辅助
  function jsonTreeNode(val, key) {
    const isArr = Array.isArray(val);
    const isObj = val !== null && typeof val === 'object' && !isArr;
    if (!isObj && !isArr) {
      const cls = val === null ? 'jt-null' : typeof val === 'string' ? 'jt-string' : typeof val === 'number' ? 'jt-number' : 'jt-boolean';
      const txt = val === null ? 'null' : typeof val === 'string' ? '"' + esc(val) + '"' : String(val);
      // 字符串里嵌套的 JSON（接口报文常见）：可折叠展开为子树
      if (typeof val === 'string') {
        const nested = tryNestedJSON(val);
        if (nested) {
          const isNestedArr = Array.isArray(nested);
          const entries = isNestedArr ? nested.map((v, i) => [i, v]) : Object.entries(nested);
          const c = jsonCount(nested);
          const kids = entries.map(([k, v]) => jsonTreeNode(v, k)).join('');
          const raw = val.trim();
          const preview = raw.length > 40 ? esc(raw.slice(0, 40)) + '…' : esc(raw);
          const keyPart = key !== null ? `<span class="jt-key">${esc(String(key))}</span>: ` : '';
          return `<div class="jt-node collapsed">${keyPart}<span class="jt-toggle">▾</span><span class="jt-bracket">"</span><span class="jt-summary">嵌套 JSON · ${c.k} 键 · ${preview}</span><div class="jt-children">${kids}</div><span class="jt-bracket">"</span></div>`;
        }
      }
      return `<div class="jt-row">${key !== null ? `<span class="jt-key">${esc(String(key))}</span>: ` : ''}<span class="${cls}">${txt}</span></div>`;
    }
    const entries = isArr ? val.map((v, i) => [i, v]) : Object.entries(val);
    const open = isArr ? '[' : '{', close = isArr ? ']' : '}';
    const label = (isArr ? '数组 ' : '对象 ') + entries.length;
    const kids = entries.map(([k, v]) => jsonTreeNode(v, k)).join('');
    const keyPart = key !== null ? `<span class="jt-key">${esc(String(key))}</span>: ` : '';
    return `<div class="jt-node">${keyPart}<span class="jt-toggle">▾</span><span class="jt-bracket">${open}</span><span class="jt-summary">${label}</span><div class="jt-children">${kids}</div><span class="jt-bracket">${close}</span></div>`;
  }
  function jsonCount(o) {
    let keys = 0, nodes = 0;
    const walk = (v) => { nodes++; if (v && typeof v === 'object') { if (Array.isArray(v)) v.forEach(walk); else { keys += Object.keys(v).length; Object.values(v).forEach(walk); } } };
    walk(o); return { k: keys, n: nodes };
  }

  /* 探测字符串里嵌套的 JSON 对象/数组 */
  function tryNestedJSON(s) {
    const t = String(s).trim();
    if (t.length < 2) return null;
    const head = t[0], tail = t[t.length - 1];
    if (!((head === '{' && tail === '}') || (head === '[' && tail === ']'))) return null;
    try { const v = JSON.parse(t); return (v && typeof v === 'object') ? v : null; } catch (e) { return null; }
  }

  /* 单遍反转义：\" \\ \/ \uXXXX \xXX；keepCtrl=true 时保留 \n \r \t \b \f
     （日志里常见“只转义引号、不转义换行”的串，保留控制符转义才不会破坏 JSON） */
  function unescapeOnce(s, keepCtrl) {
    const CH = { '"': '"', "'": "'", '\\': '\\', '/': '/', n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '0': '\0' };
    const CTRL = { n: 1, r: 1, t: 1, b: 1, f: 1, '0': 1 };
    let out = '', i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === '\\' && i + 1 < s.length) {
        const n = s[i + 1];
        if (n === 'u' && /^[0-9a-fA-F]{4}$/.test(s.slice(i + 2, i + 6))) { out += String.fromCharCode(parseInt(s.slice(i + 2, i + 6), 16)); i += 6; continue; }
        if (n === 'x' && /^[0-9a-fA-F]{2}$/.test(s.slice(i + 2, i + 4))) { out += String.fromCharCode(parseInt(s.slice(i + 2, i + 4), 16)); i += 4; continue; }
        if (n in CH) { out += (keepCtrl && CTRL[n]) ? '\\' + n : CH[n]; i += 2; continue; }
      }
      out += c; i++;
    }
    return out;
  }

  /* 逐层去转义直到可解析（最多 3 层）。
     每层生成多档候选（解开外层字符串 / 保留控制符转义 / 完整反转义），择优取第一个能解析成功的。 */
  function resolveEscaped(text) {
    let cur = String(text).trim(), rounds = 0;
    // 本身已是合法 JSON，且不是“包着引号的字符串” → 无需改动，避免误伤
    try {
      const v0 = JSON.parse(cur);
      if (typeof v0 !== 'string' || !tryNestedJSON(v0)) return { ok: true, text: cur, rounds: 0 };
    } catch (e) {}
    for (let i = 0; i < 3; i++) {
      let unwrapped = null;
      try { const v = JSON.parse(cur); if (typeof v === 'string') unwrapped = v; } catch (e) {}
      const kc = unescapeOnce(cur, true);
      const full = unescapeOnce(cur, false);
      const cands = [];
      if (unwrapped !== null && unwrapped !== cur) cands.push(unwrapped);
      if (kc !== cur) cands.push(kc);
      if (full !== cur && full !== kc) cands.push(full);
      if (!cands.length) break;                       // 已无可去除的转义符
      let picked = null, parsed = false;
      for (const c of cands) { try { JSON.parse(c); picked = c; parsed = true; break; } catch (e) {} }
      if (!picked) picked = cands[0];                 // 都不合法：取最保守的一档，让用户看到结果
      cur = picked; rounds++;
      if (parsed) {
        try { const v = JSON.parse(cur); if (typeof v === 'string' && tryNestedJSON(v)) continue; } catch (e) {}
        return { ok: true, text: cur, rounds };
      }
    }
    let ok = false;
    try { JSON.parse(cur); ok = true; } catch (e) {}
    return { ok, text: cur, rounds };
  }
  /* ---------- 冗余转义清理（内容本身已是合法 JSON 时使用） ----------
     场景：`{"url":"https:\/\/a.com"}`、嵌套 JSON 串里的 `\/` 等。
     这些转义在 JSON 里属于冗余（`\/` 等价于 `/`），但 JSON.parse 出来就已经解码了，
     所以「解析 + 重新序列化」必然生效；为了不打乱用户自己的排版，
     这里做的是文本级定点替换，只重写需要改动的字符串字面量。 */

  /* 扫描合法 JSON 文本里的字符串字面量，返回 [{start, end, raw}]，raw 为不含首尾引号的转义原文 */
  function scanJsonStrings(text) {
    const out = [];
    let i = 0;
    while (i < text.length) {
      if (text[i] !== '"') { i++; continue; }
      const start = i; i++;
      let raw = '';
      while (i < text.length) {
        const c = text[i];
        if (c === '\\') { raw += c + (text[i + 1] || ''); i += 2; continue; }
        if (c === '"') break;
        raw += c; i++;
      }
      out.push({ start, end: i + 1, raw });
      i++;
    }
    return out;
  }

  /* 去掉冗余的 \/（单个未转义反斜杠 + 斜杠 → 斜杠）；\\ \" \n \uXXXX 等一律原样保留 */
  function stripRedundantSlash(raw) {
    let out = '', i = 0;
    while (i < raw.length) {
      const c = raw[i];
      if (c === '\\' && i + 1 < raw.length) {
        const n = raw[i + 1];
        if (n === '/') { out += '/'; i += 2; continue; }  // \/ 冗余，丢掉反斜杠
        out += c + n; i += 2; continue;                   // 其它转义原样保留
      }
      out += c; i++;
    }
    return out;
  }

  /* 把文本转回 JSON 字符串字面量的内部原文（不含首尾引号） */
  function escapeRaw(s) { return JSON.stringify(String(s)).slice(1, -1); }

  /* 统计一段（已解码的）字符串里各层的 \/ 冗余转义数量 */
  function countSlashEscapes(s) { return (String(s).match(/\\+\//g) || []).length; }

  /* 递归展开嵌套 JSON 并清理其冗余转义；原串是多行（含真实换行）时保持缩进层次 */
  function cleanDeepJson(val, stat) {
    if (typeof val === 'string') {
      const inner = tryNestedJSON(val);
      if (inner) {
        stat.unpack++;
        stat.slash += countSlashEscapes(val);
        const pretty = /\n/.test(val);
        return JSON.stringify(cleanDeepJson(inner, stat), null, pretty ? 2 : undefined);
      }
      return val;
    }
    if (Array.isArray(val)) return val.map(v => cleanDeepJson(v, stat));
    if (val && typeof val === 'object') {
      const o = {};
      for (const k of Object.keys(val)) o[k] = cleanDeepJson(val[k], stat);
      return o;
    }
    return val;
  }

  /* 清理合法 JSON 文本里的冗余转义（定点替换，保留外围排版）。
     返回 { changed, text, stat, error }；任何异常都退回原文，绝不交出坏 JSON */
  function cleanRedundantEscapes(text) {
    const stat = { slash: 0, unpack: 0 };
    const lits = scanJsonStrings(text);
    let out = '', last = 0, changed = false;
    for (const lit of lits) {
      let decoded;
      try { decoded = JSON.parse('"' + lit.raw + '"'); } catch (e) { continue; }
      let newRaw = lit.raw;
      if (typeof decoded === 'string') {
        const inner = tryNestedJSON(decoded);
        if (inner) {
          stat.unpack++;
          stat.slash += countSlashEscapes(decoded);
          const pretty = /\n/.test(decoded);
          newRaw = escapeRaw(JSON.stringify(cleanDeepJson(inner, stat), null, pretty ? 2 : undefined));
        } else {
          const s = stripRedundantSlash(lit.raw);
          if (s !== lit.raw) { stat.slash += lit.raw.length - s.length; newRaw = s; }
        }
      }
      if (newRaw !== lit.raw) { out += text.slice(last, lit.start) + '"' + newRaw + '"'; last = lit.end; changed = true; }
    }
    out += text.slice(last);
    if (!changed) return { changed: false, text, stat };
    try { JSON.parse(out); } catch (e) { return { changed: false, text, stat, error: e.message }; }
    return { changed: true, text: out, stat };
  }

  const JSON_SAMPLE = JSON.stringify({ name: '工具箱', version: 2, free: true, tools: ['json', 'image', 'css'], meta: { author: 'WorkBuddy', year: 2026, ok: null } }, null, 2);

  // 1. JSON 格式化 / 校验 / 树视图
  T.register({
    id: 'json', cat: 'dev', icon: '🧾', name: 'JSON 格式化',
    desc: '美化 / 压缩 / 校验 / 树视图 / 去转义', keywords: 'json format validate escape unescape 格式化 校验 美化 树 视图 转义 去转义 反转义 嵌套 冗余 斜杠 反斜杠 slash 清理',
    render: () => `
      <div class="tool-panel">
        <h2>🧾 JSON 格式化 / 视图</h2>
        <p class="t-sub">左侧编辑 JSON，右侧实时树形视图。支持格式化、压缩、校验、<b>去转义 / 转义</b>、清空、复制、示例；视图右上角可<b>全部展开 / 全部折叠</b>，也可点单个节点的 ▾ 折叠。字符串里嵌套的 JSON（如接口报文中的 content 字段）可直接展开；内容本身合法但带着 <b>\\/</b> 这类冗余转义时，点「去转义」即可清理（嵌套层内部同样生效）。</p>
        <div class="json-split">
          <div class="json-pane">
            <div class="pane-bar">
              <span>JSON 输入</span>
              <div class="btn-row" style="margin:0">
                <button class="mini" data-f="pretty">格式化</button>
                <button class="mini" data-f="min">压缩</button>
                <button class="mini" data-f="validate">校验</button>
                <button class="mini" data-f="unescape" title="合法 JSON：清理字符串里的冗余转义（\\/ → /），嵌套 JSON 内部同样生效；非法 JSON：逐层剥离 \\&quot; \\n \\uXXXX 等转义符，自动识别多层">去转义</button>
                <button class="mini" data-f="escape" title="把内容转成转义后的字符串字面量，便于嵌入代码/日志">转义</button>
                <button class="mini" id="j-sample">示例</button>
                <button class="mini" id="j-copy">复制</button>
                <button class="mini" id="j-clear">清空</button>
              </div>
            </div>
            <textarea id="j-in" spellcheck="false" placeholder='{"name":"工具箱","ok":true}'>${JSON_SAMPLE}</textarea>
            <div id="j-status" class="j-status"></div>
          </div>
          <div class="json-pane">
            <div class="pane-bar">
              <span>JSON 视图（点 ▾ 折叠）</span>
              <div class="j-tools">
                <span id="j-stat" class="cmp-meta"></span>
                <button class="mini" id="j-expand" title="展开所有节点">全部展开</button>
                <button class="mini" id="j-collapse" title="折叠所有节点">全部折叠</button>
              </div>
            </div>
            <div id="j-view" class="json-view"></div>
          </div>
        </div>
      </div>`,
    init: (r) => {
      const inp = r.querySelector('#j-in'), view = r.querySelector('#j-view'), status = r.querySelector('#j-status'), stat = r.querySelector('#j-stat');
      let timer = null;
      const setStatus = (cls, html) => { status.className = 'j-status' + (cls ? ' ' + cls : ''); status.innerHTML = html; };
      const render = () => {
        const txt = inp.value.trim();
        if (!txt) { view.innerHTML = '<span class="muted">在左侧输入 JSON，这里会显示树形视图</span>'; setStatus('', ''); stat.textContent = ''; return; }
        try {
          const obj = JSON.parse(txt);
          view.innerHTML = jsonTreeNode(obj, null);
          if (obj && typeof obj === 'object') { const c = jsonCount(obj); stat.textContent = `${c.k} 个键 · ${c.n} 个节点`; }
          else stat.textContent = typeof obj === 'string' ? '字符串（非对象）' : typeof obj;
          // 合法 JSON 也可能带着冗余转义（如 \/、嵌套 JSON 串），这里给出可点击的清理入口
          const chk = cleanRedundantEscapes(txt);
          setStatus('ok', '✓ 合法 JSON' + (chk.changed
            ? ` · <span class="j-fix" id="j-fix">检测到 ${chk.stat.slash} 处冗余转义（\\/ → /）${chk.stat.unpack ? `，含 ${chk.stat.unpack} 处嵌套 JSON` : ''}，点此清理</span>`
            : ''));
        } catch (e) {
          view.innerHTML = '<span class="muted">JSON 有误，修正后自动显示树形</span>';
          stat.textContent = '';
          // 解析失败时探测是否只是转义问题，给出可点击的一键修复
          const fixed = resolveEscaped(txt);
          const tip = (fixed.ok && fixed.rounds > 0)
            ? ` · <span class="j-fix" id="j-fix">检测到 ${fixed.rounds} 层转义，点此去转义</span>`
            : '';
          setStatus('err', '✗ ' + esc(e.message) + tip);
        }
      };
      inp.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(render, 180); });
      view.addEventListener('click', (e) => {
        const t = e.target.closest('.jt-toggle');
        if (t) { const node = t.closest('.jt-node'); if (node) node.classList.toggle('collapsed'); }
      });
      const parseAnd = (fn) => { try { inp.value = fn(JSON.parse(inp.value)); render(); } catch (e) { setStatus('err', '✗ ' + esc(e.message)); } };
      r.querySelector('[data-f="pretty"]').onclick = () => parseAnd(o => JSON.stringify(o, null, 2));
      r.querySelector('[data-f="min"]').onclick = () => parseAnd(o => JSON.stringify(o));
      r.querySelector('[data-f="validate"]').onclick = () => { try { JSON.parse(inp.value); setStatus('ok', '✓ JSON 合法'); } catch (e) { setStatus('err', '✗ ' + esc(e.message)); } };
      // 去转义：合法 JSON → 清理字符串值内部的冗余转义（\/ 等）；非法 JSON → 逐层剥离转义（最多 3 层）
      const doUnescape = () => {
        const raw = inp.value.trim();
        if (!raw) { setStatus('', '请先输入内容'); return; }
        let valid = false;
        try { JSON.parse(raw); valid = true; } catch (e) {}
        if (valid) {
          const r1 = cleanRedundantEscapes(raw);
          if (r1.error) { setStatus('err', '✗ 清理后不再是合法 JSON，已放弃改动：' + esc(r1.error)); return; }
          if (!r1.changed) { setStatus('', '当前内容已是合法 JSON，没有冗余转义（如 \\/）可清理'); return; }
          inp.value = r1.text;
          render();
          setStatus('ok', `✓ 已是合法 JSON；已清理 <b>${r1.stat.slash}</b> 处冗余转义（\\/ → /）`
            + (r1.stat.unpack ? `，其中展开 <b>${r1.stat.unpack}</b> 处嵌套 JSON` : ''));
          return;
        }
        const res = resolveEscaped(raw);
        if (res.text === raw) { setStatus('err', '未检测到可去除的转义符'); return; }
        inp.value = res.text;
        render();
        if (res.ok) setStatus('ok', `✓ 已去除 ${res.rounds} 层转义，JSON 合法`);
        else setStatus('err', '✗ 已去转义，但仍不是合法 JSON，请检查内容');
      };
      // 转义：把内容转成转义后的字符串字面量（可直接嵌入 Java/JS 代码或日志）
      const doEscape = () => {
        const raw = inp.value.trim();
        if (!raw) { setStatus('', '请先输入内容'); return; }
        let compact = raw;
        try { compact = JSON.stringify(JSON.parse(raw)); } catch (e) {}
        inp.value = JSON.stringify(compact);
        render();
        setStatus('ok', '✓ 已转义为字符串字面量（可直接嵌入代码 / 日志）');
      };
      r.querySelector('[data-f="unescape"]').onclick = doUnescape;
      r.querySelector('[data-f="escape"]').onclick = doEscape;
      // 全部展开 / 全部折叠：一次性切换视图里所有节点的折叠态
      const setAllCollapsed = (collapse) => {
        const nodes = view.querySelectorAll('.jt-node');
        if (!nodes.length) { toast('当前没有可折叠的节点'); return; }
        nodes.forEach((n) => { collapse ? n.classList.add('collapsed') : n.classList.remove('collapsed'); });
        toast((collapse ? '已折叠 ' : '已展开 ') + nodes.length + ' 个节点');
      };
      r.querySelector('#j-expand').onclick = () => setAllCollapsed(false);
      r.querySelector('#j-collapse').onclick = () => setAllCollapsed(true);
      // 状态栏里的「点此清理 / 点此去转义」提示（事件委托，避免每次渲染重复绑定）
      status.addEventListener('click', (e) => { if (e.target.closest('#j-fix')) doUnescape(); });
      r.querySelector('#j-copy').onclick = () => copyText(inp.value, '已复制');
      r.querySelector('#j-clear').onclick = () => { inp.value = ''; render(); inp.focus(); };
      r.querySelector('#j-sample').onclick = () => { inp.value = JSON_SAMPLE; render(); };
      render();
    }
  });

  // 2. Base64
  T.register({
    id: 'base64', cat: 'dev', icon: '🔣', name: 'Base64 编解码',
    desc: 'Base64 编码与解码（支持中文）', keywords: 'base64 encode decode 编解码',
    render: () => `
      <div class="tool-panel">
        <h2>🔣 Base64 编解码</h2>
        <p class="t-sub">支持 UTF-8 中文。可切换编码/解码方向。</p>
        <div class="field"><label>输入</label><textarea id="b64-in" style="min-height:120px" placeholder="输入文本或 Base64…"></textarea></div>
        <div class="btn-row">
          <button class="btn" data-f="enc">编码 →</button>
          <button class="btn" data-f="dec">← 解码</button>
        </div>
        <div class="field"><label>结果</label><textarea id="b64-out" readonly style="min-height:120px"></textarea></div>
      </div>`,
    init: (r) => {
      const inp = r.querySelector('#b64-in'), out = r.querySelector('#b64-out');
      const u8 = s => new TextEncoder().encode(s);
      const dec = b => new TextDecoder().decode(b);
      r.querySelector('[data-f="enc"]').onclick = () => {
        try { out.value = btoa(String.fromCharCode(...u8(inp.value))); }
        catch (e) { out.value = '编码失败：' + e.message; }
      };
      r.querySelector('[data-f="dec"]').onclick = () => {
        try { out.value = dec(Uint8Array.from(atob(inp.value.trim()), c => c.charCodeAt(0))); }
        catch (e) { out.value = '解码失败：' + e.message; }
      };
    }
  });

  // 3. UUID
  T.register({
    id: 'uuid', cat: 'dev', icon: '🆔', name: 'UUID 生成',
    desc: '生成 UUID v4（可批量）', keywords: 'uuid guid 生成 随机',
    render: () => `
      <div class="tool-panel">
        <h2>🆔 UUID 生成器</h2>
        <p class="t-sub">基于 crypto 的安全随机 UUID v4。</p>
        <div class="row">
          <div class="field"><label>数量</label><input type="number" id="u-n" value="5" min="1" max="200"></div>
          <div class="field"><label>大写</label>
            <select id="u-case"><option value="lower">小写</option><option value="upper">大写</option></select>
          </div>
        </div>
        <div class="btn-row"><button class="btn" id="u-go">生成</button><button class="btn secondary" id="u-copy">复制全部</button></div>
        <div class="field"><label>结果</label><textarea id="u-out" readonly style="min-height:160px"></textarea></div>
      </div>`,
    init: (r) => {
      const out = r.querySelector('#u-out');
      const gen = () => {
        const n = clamp(+r.querySelector('#u-n').value || 1, 1, 200);
        const up = r.querySelector('#u-case').value === 'upper';
        const arr = [];
        for (let i = 0; i < n; i++) {
          const id = crypto.randomUUID();
          arr.push(up ? id.toUpperCase() : id);
        }
        out.value = arr.join('\n');
      };
      r.querySelector('#u-go').onclick = gen;
      r.querySelector('#u-copy').onclick = () => copyText(out.value, '已复制');
      gen();
    }
  });

  // 4. 单位换算
  T.register({
    id: 'unit', cat: 'dev', icon: '📐', name: '单位换算',
    desc: '长度/重量/温度/数据等换算', keywords: 'unit convert 换算 长度 重量 温度 数据',
    render: () => `
      <div class="tool-panel">
        <h2>📐 单位换算</h2>
        <p class="t-sub">长度、重量、温度、数据存储、时间、速度、面积、体积。</p>
        <div class="row">
          <div class="field"><label>类别</label><select id="uc-cat"></select></div>
          <div class="field"><label>数值</label><input type="number" id="uc-val" value="1" step="any"></div>
          <div class="field"><label>从</label><select id="uc-from"></select></div>
          <div class="field"><label>到</label><select id="uc-to"></select></div>
        </div>
        <div class="field"><label>结果</label><div class="out" id="uc-out"></div></div>
      </div>`,
    init: (r) => {
      const cats = {
        '长度': { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
        '重量': { kg: 1, g: 0.001, mg: 1e-6, t: 1000, '斤': 0.5, '两': 0.05, lb: 0.453592, oz: 0.0283495 },
        '数据存储': { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776, '位': 0.125 },
        '时间': { s: 1, min: 60, h: 3600, d: 86400, wk: 604800 },
        '速度': { 'm/s': 1, 'km/h': 0.277778, 'mph': 0.44704 },
        '面积': { 'm²': 1, 'km²': 1e6, 'cm²': 1e-4, '公顷': 10000, '亩': 666.667, 'ft²': 0.092903 },
        '体积': { 'L': 1, 'mL': 0.001, 'm³': 1000, 'gal(美)': 3.78541, '杯': 0.236588 },
      };
      const catSel = r.querySelector('#uc-cat'), from = r.querySelector('#uc-from'), to = r.querySelector('#uc-to'), val = r.querySelector('#uc-val'), out = r.querySelector('#uc-out');
      Object.keys(cats).forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o); });
      const fill = () => {
        const units = Object.keys(cats[catSel.value]);
        [from, to].forEach(s => { s.innerHTML = ''; units.forEach(u => { const o = document.createElement('option'); o.value = u; o.textContent = u; s.appendChild(o); }); });
        to.selectedIndex = 1;
      };
      const calc = () => {
        const t = cats[catSel.value]; const v = +val.value || 0;
        const res = v * t[from.value] / t[to.value];
        out.textContent = fmt(res, 8) + ' ' + to.value;
      };
      catSel.onchange = () => { fill(); calc(); };
      [from, to, val].forEach(e => e.oninput = calc);
      fill(); calc();
    }
  });

  // 5. 正则测试
  T.register({
    id: 'regex', cat: 'dev', icon: '🧬', name: '正则测试',
    desc: '实时高亮正则匹配结果', keywords: 'regex 正则 匹配 测试',
    render: () => `
      <div class="tool-panel">
        <h2>🧬 正则表达式测试</h2>
        <p class="t-sub">输入正则与测试文本，实时高亮匹配。</p>
        <div class="field"><label>正则（不含斜杠）</label><input type="text" id="rx-p" value="\\d+" placeholder="例如 \\d+"></div>
        <div class="field"><label>修饰符</label><input type="text" id="rx-f" value="g" placeholder="g i m s"></div>
        <div class="field"><label>测试文本</label><textarea id="rx-t" style="min-height:120px">订单号 12345，金额 678.9 元</textarea></div>
        <div class="field"><label>匹配结果（<span id="rx-c">0</span> 处）</label><div class="out" id="rx-out" style="min-height:100px"></div></div>
      </div>`,
    init: (r) => {
      const p = r.querySelector('#rx-p'), f = r.querySelector('#rx-f'), t = r.querySelector('#rx-t'), out = r.querySelector('#rx-out'), c = r.querySelector('#rx-c');
      const run = () => {
        if (!p.value) { out.textContent = ''; c.textContent = '0'; return; }
        let re; try { re = new RegExp(p.value, f.value.includes('g') ? f.value : f.value + 'g'); }
        catch (e) { out.innerHTML = '<span style="color:var(--danger)">正则错误：' + esc(e.message) + '</span>'; return; }
        let m, html = '', n = 0, last = 0;
        const flags = f.value.replace('g', '');
        const re2 = new RegExp(p.value, flags);
        const text = t.value;
        while ((m = re.exec(text)) !== null) {
          if (m.index < last) break;
          html += esc(text.slice(last, m.index));
          html += '<mark style="background:var(--accent-soft);color:var(--accent);padding:0 2px;border-radius:3px">' + esc(m[0]) + '</mark>';
          last = m.index + m[0].length; n++;
          if (m[0] === '') re.lastIndex++;
          if (n > 5000) break;
        }
        html += esc(text.slice(last));
        out.innerHTML = html; c.textContent = n;
      };
      [p, f, t].forEach(e => e.addEventListener('input', run)); run();
    }
  });

  // 6/7/8. 压缩（HTML/CSS/JS）
  function minifier(id, icon, title, sub, fn) {
    T.register({
      id, cat: 'dev', icon, name: title, desc: sub,
      render: () => `
        <div class="tool-panel"><h2>${icon} ${title}</h2><p class="t-sub">${sub}</p>
        <div class="field"><label>输入</label><textarea id="${id}-in" style="min-height:160px"></textarea></div>
        <div class="btn-row"><button class="btn" id="${id}-go">压缩</button><button class="btn secondary" id="${id}-copy">复制</button></div>
        <div class="field"><label>结果</label><textarea id="${id}-out" readonly style="min-height:140px"></textarea></div></div>`,
      init: (r) => {
        const inp = r.querySelector(`#${id}-in`), out = r.querySelector(`#${id}-out`);
        r.querySelector(`#${id}-go`).onclick = () => { try { out.value = fn(inp.value); } catch (e) { out.value = '错误：' + e.message; } };
        r.querySelector(`#${id}-copy`).onclick = () => copyText(out.value, '已复制');
      }
    });
  }
  minifier('html-min', '🌐', 'HTML 压缩', '去除多余空白与注释，缩小体积', (s) => {
    return s.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\n\s*\n/g, '').replace(/\s{2,}/g, ' ').trim();
  });
  minifier('css-min', '🎨', 'CSS 压缩', '去除注释与冗余空格', (s) => {
    return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').replace(/;}/g, '}').trim();
  });
  minifier('js-min', '📜', 'JS 压缩', '去除注释并压缩空白（保守）', (s) => {
    let out = '', i = 0, n = s.length, inStr = null, strEsc = false;
    while (i < n) {
      const ch = s[i];
      if (inStr) {
        out += ch;
        if (strEsc) strEsc = false;
        else if (ch === '\\') strEsc = true;
        else if (ch === inStr) inStr = null;
        i++; continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; out += ch; i++; continue; }
      if (ch === '/' && s[i + 1] === '/') { while (i < n && s[i] !== '\n') i++; continue; }
      if (ch === '/' && s[i + 1] === '*') { i += 2; while (i < n && !(s[i] === '*' && s[i + 1] === '/')) i++; i += 2; continue; }
      if (/\s/.test(ch)) {
        // collapse whitespace to one space, but trim around punctuation
        let j = i; while (j < n && /\s/.test(s[j])) j++;
        const prev = out[out.length - 1], next = s[j];
        if ('()[]{};,:+-*/%<>=!&|?'.includes(prev) || '()[]{};,:+-*/%<>=!&|?'.includes(next)) out += '';
        else out += ' ';
        i = j; continue;
      }
      out += ch; i++;
    }
    return out.replace(/\n/g, '').trim();
  });

  // 9. 时间戳转换
  T.register({
    id: 'timestamp', cat: 'dev', icon: '⏱️', name: '时间戳转换',
    desc: 'Unix 时间戳 ↔ 日期', keywords: 'timestamp unix 时间 日期 转换',
    render: () => `
      <div class="tool-panel"><h2>⏱️ 时间戳转换</h2><p class="t-sub">在 Unix 时间戳与日期之间互转（支持秒/毫秒）。</p>
      <div class="field"><label>当前时间戳（秒）</label><div class="out" id="ts-now"></div></div>
      <div class="grid-2">
        <div class="field"><label>Unix 时间戳</label><input type="text" id="ts-in" placeholder="例如 1700000000"></div>
        <div class="field"><label>单位</label><select id="ts-unit"><option value="s">秒</option><option value="ms">毫秒</option></select></div>
      </div>
      <div class="btn-row"><button class="btn" id="ts-to-date">→ 转日期</button><button class="btn" id="ts-to-ts">日期 → 时间戳</button><button class="btn secondary" id="ts-now-btn">填入当前</button></div>
      <div class="row">
        <div class="field"><label>年-月-日 时:分:秒</label><input type="text" id="ts-date" placeholder="2026-08-20 16:07:50"></div>
      </div>
      <div class="field"><label>结果</label><div class="out" id="ts-out"></div></div></div>`,
    init: (r) => {
      const now = r.querySelector('#ts-now'), inp = r.querySelector('#ts-in'), unit = r.querySelector('#ts-unit'),
        date = r.querySelector('#ts-date'), out = r.querySelector('#ts-out');
      const tick = () => now.textContent = Math.floor(Date.now() / 1000) + ' 秒  /  ' + Date.now() + ' 毫秒';
      tick(); setInterval(tick, 1000);
      r.querySelector('#ts-to-date').onclick = () => {
        const v = +inp.value; if (!v) { out.className = 'out err'; out.textContent = '请输入时间戳'; return; }
        const ms = unit.value === 'ms' ? v : v * 1000;
        const d = new Date(ms);
        out.className = 'out ok';
        out.textContent = `本地：${d.toLocaleString('zh-CN')}\nUTC：${d.toISOString()}`;
      };
      r.querySelector('#ts-to-ts').onclick = () => {
        const d = new Date(date.value.replace(' ', 'T'));
        if (isNaN(d)) { out.className = 'out err'; out.textContent = '日期格式无效'; return; }
        out.className = 'out ok';
        out.textContent = `秒：${Math.floor(d.getTime() / 1000)}\n毫秒：${d.getTime()}`;
      };
      r.querySelector('#ts-now-btn').onclick = () => { inp.value = Math.floor(Date.now() / 1000); unit.value = 's'; };
    }
  });

  // 10. 哈希生成
  T.register({
    id: 'hash', cat: 'dev', icon: '🔐', name: '哈希生成',
    desc: 'SHA-1/256/512 摘要', keywords: 'hash sha md5 哈希 摘要 校验',
    render: () => `
      <div class="tool-panel"><h2>🔐 哈希生成（Web Crypto）</h2><p class="t-sub">使用浏览器原生加密 API，数据不出本地。</p>
      <div class="field"><label>输入</label><textarea id="h-in" style="min-height:100px">ToolBox</textarea></div>
      <div class="field"><label>算法</label><select id="h-alg"><option>SHA-1</option><option selected>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select></div>
      <div class="btn-row"><button class="btn" id="h-go">计算</button><button class="btn secondary" id="h-copy">复制</button></div>
      <div class="field"><label>结果（十六进制）</label><textarea id="h-out" readonly style="min-height:80px"></textarea></div></div>`,
    init: (r) => {
      const inp = r.querySelector('#h-in'), alg = r.querySelector('#h-alg'), out = r.querySelector('#h-out');
      const go = async () => {
        const buf = await crypto.subtle.digest(alg.value, new TextEncoder().encode(inp.value));
        const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
        out.value = hex;
      };
      r.querySelector('#h-go').onclick = go;
      r.querySelector('#h-copy').onclick = () => copyText(out.value, '已复制');
      go();
    }
  });

  // 11. JWT 解码
  T.register({
    id: 'jwt', cat: 'dev', icon: '🎫', name: 'JWT 解码',
    desc: '解析与解码 JWT（不校验签名）', keywords: 'jwt token 解码 解析',
    render: () => `
      <div class="tool-panel"><h2>🎫 JWT 解码</h2><p class="t-sub">仅解码 Payload，不会也不校验签名。</p>
      <div class="field"><label>JWT（header.payload.signature）</label><textarea id="jwt-in" style="min-height:90px" placeholder="eyJhbGci... .eyJzdWIi... .签名"></textarea></div>
      <div class="btn-row"><button class="btn" id="jwt-go">解码</button></div>
      <div class="field"><label>结果</label><pre class="out" id="jwt-out"></pre></div></div>`,
    init: (r) => {
      const inp = r.querySelector('#jwt-in'), out = r.querySelector('#jwt-out');
      const b64url = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); return atob(s + '==='.slice((s.length + 3) % 4)); };
      r.querySelector('#jwt-go').onclick = () => {
        const parts = inp.value.trim().split('.');
        if (parts.length < 2) { out.className = 'out err'; out.textContent = '无效的 JWT 格式'; return; }
        try {
          const dec = p => { try { return JSON.stringify(JSON.parse(b64url(p)), null, 2); } catch (e) { return '（无法解析为 JSON）\n' + b64url(p); } };
          out.className = 'out';
          out.textContent = '=== HEADER ===\n' + dec(parts[0]) + '\n\n=== PAYLOAD ===\n' + dec(parts[1]);
        } catch (e) { out.className = 'out err'; out.textContent = '解码失败：' + e.message; }
      };
    }
  });

  // 12. URL 编解码
  T.register({
    id: 'url', cat: 'dev', icon: '🔗', name: 'URL 编解码',
    desc: 'encodeURIComponent / decodeURIComponent', keywords: 'url encode decode 编码',
    render: () => `
      <div class="tool-panel"><h2>🔗 URL 编解码</h2>
      <div class="field"><label>输入</label><textarea id="url-in" style="min-height:90px" placeholder="https://例.com/搜索?q=你好"></textarea></div>
      <div class="btn-row"><button class="btn" data-f="enc">编码</button><button class="btn" data-f="dec">解码</button></div>
      <div class="field"><label>结果</label><textarea id="url-out" readonly style="min-height:90px"></textarea></div></div>`,
    init: (r) => {
      const inp = r.querySelector('#url-in'), out = r.querySelector('#url-out');
      r.querySelector('[data-f="enc"]').onclick = () => { try { out.value = encodeURIComponent(inp.value); } catch (e) { out.value = '错误：' + e.message; } };
      r.querySelector('[data-f="dec"]').onclick = () => { try { out.value = decodeURIComponent(inp.value); } catch (e) { out.value = '解码失败：' + e.message; } };
    }
  });

  // 13. Cron 生成
  T.register({
    id: 'cron', cat: 'dev', icon: '⏰', name: 'Cron 表达式',
    desc: '生成并预览 Cron 的下次执行时间', keywords: 'cron 定时 计划 表达式',
    render: () => `
      <div class="tool-panel"><h2>⏰ Cron 表达式</h2><p class="t-sub">标准 5 段：分 时 日 月 周（周 0=周日）。</p>
      <div class="btn-row" id="cron-presets"></div>
      <div class="grid-3">
        <div class="field"><label>分钟</label><input type="text" id="c-m" value="*"></div>
        <div class="field"><label>小时</label><input type="text" id="c-h" value="*"></div>
        <div class="field"><label>日</label><input type="text" id="c-d" value="*"></div>
        <div class="field"><label>月</label><input type="text" id="c-mo" value="*"></div>
        <div class="field"><label>周</label><input type="text" id="c-w" value="*"></div>
      </div>
      <div class="field"><label>表达式</label><div class="out" id="c-expr"></div></div>
      <div class="field"><label>说明</label><div class="out" id="c-desc"></div></div>
      <div class="field"><label>未来 5 次执行</label><div class="out" id="c-next"></div></div></div>`,
    init: (r) => {
      const ids = ['c-m', 'c-h', 'c-d', 'c-mo', 'c-w'];
      const get = () => ids.map(i => r.querySelector('#' + i).value.trim());
      const expr = r.querySelector('#c-expr'), desc = r.querySelector('#c-desc'), next = r.querySelector('#c-next');
      const dw = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const expand = (field, min, max) => {
        if (field === '*') return Array.from({ length: max - min + 1 }, (_, i) => min + i);
        const set = new Set();
        field.split(',').forEach(part => {
          if (part.includes('/')) { const [rng, step] = part.split('/'); const st = +step; const [a, b] = rng === '*' ? [min, max] : rng.split('-').map(Number); for (let v = a; v <= b; v += st) set.add(v); }
          else if (part.includes('-')) { const [a, b] = part.split('-').map(Number); for (let v = a; v <= b; v++) set.add(v); }
          else set.add(+part);
        });
        return [...set].filter(v => v >= min && v <= max).sort((a, b) => a - b);
      };
      const describe = (f) => {
        const [mVal, hVal, dVal, moVal, wVal] = f;
        if (mVal === '*' && hVal === '*' && dVal === '*' && moVal === '*' && wVal === '*') return '每分钟';
        if (mVal === '*/5' || mVal === '*/10' || mVal === '*/15' || mVal === '*/30') return `每 ${mVal.slice(2)} 分钟`;
        if (hVal !== '*' && mVal !== '*' && dVal === '*' && moVal === '*' && wVal === '*') return `每天 ${hVal}:${String(mVal).padStart(2, '0')}`;
        if (hVal !== '*' && mVal === '0' && dVal === '*' && moVal === '*' && wVal !== '*') return `每${dw[+wVal]} ${hVal}:00`;
        return '自定义计划';
      };
      const calc = () => {
        const f = get();
        expr.textContent = f.join(' ');
        desc.textContent = describe(f);
        const mins = expand(f[0], 0, 59), hours = expand(f[1], 0, 23), days = expand(f[2], 1, 31),
          mons = expand(f[3], 1, 12), dows = expand(f[4], 0, 6);
        let d = new Date(), count = 0, lines = [], guard = 0;
        d.setSeconds(0, 0); d.setMinutes(d.getMinutes() + 1);
        while (count < 5 && guard < 600000) {
          guard++;
          const dow = d.getDay();
          const inMonth = mons.includes(d.getMonth() + 1);
          const inDay = days.includes(d.getDate());
          const inDow = dows.includes(dow);
          // day-of-month OR day-of-week (* means any)
          const dayOk = (f[2] === '*' || f[4] === '*') ? (f[2] === '*' ? inDow : inDay) : (inDay && inDow);
          if (inMonth && dayOk && hours.includes(d.getHours()) && mins.includes(d.getMinutes())) {
            lines.push(d.toLocaleString('zh-CN'));
            d.setMinutes(d.getMinutes() + 1); count++;
            continue;
          }
          d.setMinutes(d.getMinutes() + 1);
        }
        next.textContent = lines.join('\n') || '（无匹配，请检查表达式）';
      };
      ids.forEach(i => r.querySelector('#' + i).addEventListener('input', calc));
      const presets = [['每分钟', '* * * * *'], ['每 5 分钟', '*/5 * * * *'], ['每小时', '0 * * * *'], ['每天 09:00', '0 9 * * *'], ['每周一 09:00', '0 9 * * 1']];
      const pc = r.querySelector('#cron-presets');
      presets.forEach(([name, ex]) => {
        const b = document.createElement('button'); b.className = 'btn ghost'; b.textContent = name;
        b.onclick = () => { const p = ex.split(' '); ids.forEach((i, k) => r.querySelector('#' + i).value = p[k]); calc(); };
        pc.appendChild(b);
      });
      calc();
    }
  });

  // 14. HTML 实体
  T.register({
    id: 'entity', cat: 'dev', icon: '🔤', name: 'HTML 实体',
    desc: 'HTML 实体编解码', keywords: 'entity html 实体 转义',
    render: () => `
      <div class="tool-panel"><h2>🔤 HTML 实体编解码</h2>
      <div class="field"><label>输入</label><textarea id="en-in" style="min-height:90px"><div>你好 & "世界"</div></textarea></div>
      <div class="btn-row"><button class="btn" data-f="enc">编码</button><button class="btn" data-f="dec">解码</button></div>
      <div class="field"><label>结果</label><textarea id="en-out" readonly style="min-height:90px"></textarea></div></div>`,
    init: (r) => {
      const inp = r.querySelector('#en-in'), out = r.querySelector('#en-out');
      r.querySelector('[data-f="enc"]').onclick = () => { out.value = inp.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
      r.querySelector('[data-f="dec"]').onclick = () => { const ta = document.createElement('textarea'); ta.innerHTML = inp.value; out.value = ta.value; };
    }
  });

  // 15. Chmod 计算器
  T.register({
    id: 'chmod', cat: 'dev', icon: '🛡️', name: 'Chmod 计算',
    desc: '数字权限 ↔ 符号权限', keywords: 'chmod 权限 755 rwx',
    render: () => `
      <div class="tool-panel"><h2>🛡️ Chmod 权限计算器</h2>
      <div class="grid-3" id="chm-box"></div>
      <div class="field"><label>数字表示</label><input type="text" id="chm-num" value="755" maxlength="4"></div>
      <div class="field"><label>符号表示</label><div class="out" id="chm-sym"></div></div></div>`,
    init: (r) => {
      const classes = ['拥有者', '同组', '其他'];
      const box = r.querySelector('#chm-box');
      const keyOrder = ['r', 'w', 'x'];
      classes.forEach((label, ci) => {
        const wrap = document.createElement('div'); wrap.className = 'tool-card'; wrap.style.minHeight = 'auto';
        wrap.innerHTML = `<div class="t-name" style="font-size:13px">${label}</div>` + keyOrder.map(k =>
          `<label style="display:flex;gap:6px;align-items:center;font-size:13px;color:var(--text-soft)"><input type="checkbox" data-ci="${ci}" data-k="${k}" checked> ${k.toUpperCase()}</label>`).join('');
        box.appendChild(wrap);
      });
      const num = r.querySelector('#chm-num'), sym = r.querySelector('#chm-sym');
      const val = c => c.reduce((a, b) => a + b, 0);
      const boxes = () => [...box.querySelectorAll('input')];
      const fromBoxes = () => {
        const per = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        boxes().forEach(b => { if (b.checked) per[+b.dataset.ci][{ r: 0, w: 1, x: 2 }[b.dataset.k]] = { r: 4, w: 2, x: 1 }[b.dataset.k]; });
        return per.map(val).join('');
      };
      const toBoxes = (n) => {
        const s = String(n).padStart(3, '0');
        boxes().forEach(b => { const bit = { r: 4, w: 2, x: 1 }[b.dataset.k]; b.checked = (bit & +s[+b.dataset.ci]) > 0; });
      };
      const up = () => { const p = fromBoxes(); num.value = p; sym.textContent = p.split('').map((d, i) => classes[i] + ':' + (d & 4 ? 'r' : '-') + (d & 2 ? 'w' : '-') + (d & 1 ? 'x' : '-')).join('  '); };
      const upNum = () => { if (/^\d{1,4}$/.test(num.value)) { toBoxes(num.value.slice(-3)); up(); } };
      boxes().forEach(b => b.onchange = up);
      num.oninput = upNum;
      up();
    }
  });

  // 16. JSON 转 CSV
  T.register({
    id: 'json-csv', cat: 'dev', icon: '📊', name: 'JSON 转 CSV',
    desc: '数组对象 → CSV 表格', keywords: 'json csv 转换 表格',
    render: () => `
      <div class="tool-panel"><h2>📊 JSON 转 CSV</h2><p class="t-sub">输入 JSON 数组（对象或数组均可），导出 CSV。</p>
      <div class="field"><label>JSON 数组</label><textarea id="jc-in" style="min-height:140px" placeholder='[{"name":"张三","age":20},{"name":"李四","age":25}]'></textarea></div>
      <div class="btn-row"><button class="btn" id="jc-go">转换</button><button class="btn secondary" id="jc-dl">下载 CSV</button></div>
      <div class="field"><label>CSV</label><textarea id="jc-out" readonly style="min-height:120px"></textarea></div></div>`,
    init: (r) => {
      const inp = r.querySelector('#jc-in'), out = r.querySelector('#jc-out');
      const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      let csv = '';
      const go = () => {
        try {
          const data = JSON.parse(inp.value);
          const arr = Array.isArray(data) ? data : [data];
          if (!arr.length) { out.value = ''; return; }
          const keys = [...new Set(arr.flatMap(o => Array.isArray(o) ? o.map((_, i) => i) : Object.keys(o)))];
          csv = [keys.join(',')];
          arr.forEach(o => { csv.push(keys.map(k => csvCell(Array.isArray(o) ? o[k] : o[k])).join(',')); });
          csv = csv.join('\n');
          out.value = csv;
        } catch (e) { out.value = '错误：' + e.message; }
      };
      r.querySelector('#jc-go').onclick = go;
      r.querySelector('#jc-dl').onclick = () => {
        if (!csv) return;
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'data.csv'; a.click();
      };
    }
  });

  // 17. Slug 生成
  T.register({
    id: 'slug', cat: 'dev', icon: '🪪', name: 'URL Slug 生成',
    desc: '把标题转换为 SEO 友好链接', keywords: 'slug url seo 链接 生成',
    render: () => `
      <div class="tool-panel"><h2>🪪 URL Slug 生成</h2>
      <div class="field"><label>标题文本</label><input type="text" id="sl-in" value="2026 年最佳在线工具箱！"></div>
      <div class="row">
        <div class="field"><label>分隔符</label><select id="sl-sep"><option value="-">-（横线）</option><option value="_">_（下划线）</option></select></div>
        <div class="field"><label>最大长度</label><input type="number" id="sl-max" value="60" min="0"></div>
      </div>
      <div class="btn-row"><button class="btn" id="sl-go">生成</button><button class="btn secondary" id="sl-copy">复制</button></div>
      <div class="field"><label>结果</label><div class="out" id="sl-out"></div></div></div>`,
    init: (r) => {
      const inp = r.querySelector('#sl-in'), sep = r.querySelector('#sl-sep'), max = r.querySelector('#sl-max'), out = r.querySelector('#sl-out');
      const go = () => {
        let s = inp.value.toLowerCase().trim()
          .replace(/[^\w\s一-龥-]/g, '').replace(/\s+/g, sep.value);
        // 中文保留，英文/数字转小写，其它转分隔符
        s = s.replace(/[^一-龥\w]+/g, sep.value).replace(new RegExp(sep.value + '+', 'g'), sep.value).replace(new RegExp('^' + sep.value + '|' + sep.value + '$', 'g'), '');
        const m = +max.value; if (m > 0 && s.length > m) s = s.slice(0, m).replace(new RegExp(sep.value + '$'), '');
        out.textContent = s;
      };
      [inp, sep, max].forEach(e => e.addEventListener('input', go));
      r.querySelector('#sl-copy').onclick = () => copyText(out.textContent, '已复制');
      go();
    }
  });
})();

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
  const JSON_SAMPLE = JSON.stringify({ name: '工具箱', version: 2, free: true, tools: ['json', 'image', 'css'], meta: { author: 'WorkBuddy', year: 2026, ok: null } }, null, 2);

  // 1. JSON 格式化 / 校验 / 树视图
  T.register({
    id: 'json', cat: 'dev', icon: '🧾', name: 'JSON 格式化',
    desc: '美化 / 压缩 / 校验 / 树视图', keywords: 'json format validate 格式化 校验 美化 树 视图',
    render: () => `
      <div class="tool-panel">
        <h2>🧾 JSON 格式化 / 视图</h2>
        <p class="t-sub">左侧编辑 JSON，右侧实时树形视图（点击 ▾ 折叠/展开）。支持格式化、压缩、校验、清空、复制、示例。</p>
        <div class="json-split">
          <div class="json-pane">
            <div class="pane-bar">
              <span>JSON 输入</span>
              <div class="btn-row" style="margin:0">
                <button class="mini" data-f="pretty">格式化</button>
                <button class="mini" data-f="min">压缩</button>
                <button class="mini" data-f="validate">校验</button>
                <button class="mini" id="j-sample">示例</button>
                <button class="mini" id="j-copy">复制</button>
                <button class="mini" id="j-clear">清空</button>
              </div>
            </div>
            <textarea id="j-in" spellcheck="false" placeholder='{"name":"工具箱","ok":true}'>${JSON_SAMPLE}</textarea>
            <div id="j-status" class="j-status"></div>
          </div>
          <div class="json-pane">
            <div class="pane-bar"><span>JSON 视图（点击 ▾ 折叠 / 展开）</span><span id="j-stat" class="cmp-meta"></span></div>
            <div id="j-view" class="json-view"></div>
          </div>
        </div>
      </div>`,
    init: (r) => {
      const inp = r.querySelector('#j-in'), view = r.querySelector('#j-view'), status = r.querySelector('#j-status'), stat = r.querySelector('#j-stat');
      let timer = null;
      const render = () => {
        const txt = inp.value.trim();
        if (!txt) { view.innerHTML = '<span class="muted">在左侧输入 JSON，这里会显示树形视图</span>'; status.textContent = ''; status.className = 'j-status'; stat.textContent = ''; return; }
        try {
          const obj = JSON.parse(txt);
          view.innerHTML = jsonTreeNode(obj, null);
          const c = jsonCount(obj);
          stat.textContent = `${c.k} 个键 · ${c.n} 个节点`;
          status.className = 'j-status ok'; status.textContent = '✓ 合法 JSON';
        } catch (e) { view.innerHTML = '<span class="muted">JSON 有误，修正后自动显示树形</span>'; status.className = 'j-status err'; status.textContent = '✗ ' + e.message; stat.textContent = ''; }
      };
      inp.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(render, 180); });
      view.addEventListener('click', (e) => {
        const t = e.target.closest('.jt-toggle');
        if (t) { const node = t.closest('.jt-node'); if (node) node.classList.toggle('collapsed'); }
      });
      const parseAnd = (fn) => { try { inp.value = fn(JSON.parse(inp.value)); render(); } catch (e) { status.className = 'j-status err'; status.textContent = '✗ ' + e.message; } };
      r.querySelector('[data-f="pretty"]').onclick = () => parseAnd(o => JSON.stringify(o, null, 2));
      r.querySelector('[data-f="min"]').onclick = () => parseAnd(o => JSON.stringify(o));
      r.querySelector('[data-f="validate"]').onclick = () => { try { JSON.parse(inp.value); status.className = 'j-status ok'; status.textContent = '✓ JSON 合法'; } catch (e) { status.className = 'j-status err'; status.textContent = '✗ ' + e.message; } };
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

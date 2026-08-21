/* ============ 数学计算 ============ */
(function () {
  const T = window.TB;
  const N = s => { const x = parseFloat(s); return isNaN(x) ? 0 : x; };

  // 科学计算器
  T.register({
    id: 'scientific', cat: 'math', icon: '🧮', name: '科学计算器',
    desc: '支持函数与常量的表达式计算', keywords: 'scientific calculator 科学 计算 表达式',
    render: () => `
      <div class="tool-panel">
        <h2>🧮 科学计算器</h2>
        <p class="t-sub">支持 + - * / ^ 以及 sin cos tan sqrt log abs pow exp 等，常量 pi、e。</p>
        <div class="field"><label>表达式</label><input type="text" id="sc-in" value="sqrt(2)*cos(pi/4)"></div>
        <div class="btn-row"><button class="btn" id="sc-go">= 计算</button><button class="btn secondary" id="sc-copy">复制结果</button></div>
        <div class="out" id="sc-out"></div>
        <div class="hint">示例：pow(2,10) 、 log(100) 、 (1+2)*3-4</div>
      </div>`,
    init: (r) => {
      const calc = () => {
        const expr = r.querySelector('#sc-in').value;
        try {
          const sin = Math.sin, cos = Math.cos, tan = Math.tan, sqrt = Math.sqrt, log = Math.log10, ln = Math.log, abs = Math.abs, pow = Math.pow, exp = Math.exp, pi = Math.PI, e = Math.E;
          const round = (x, d) => { const f = Math.pow(10, d); return Math.round(x * f) / f; };
          const fn = new Function('sin', 'cos', 'tan', 'sqrt', 'log', 'ln', 'abs', 'pow', 'exp', 'pi', 'e', 'round', 'return (' + expr + ');');
          const res = fn(sin, cos, tan, sqrt, log, ln, abs, pow, exp, pi, e, round);
          if (!isFinite(res)) throw new Error('结果不是有限数');
          r.querySelector('#sc-out').textContent = '= ' + round(res, 10);
          r.querySelector('#sc-out').className = 'out ok';
        } catch (err) {
          r.querySelector('#sc-out').textContent = '错误：' + err.message;
          r.querySelector('#sc-out').className = 'out err';
        }
      };
      r.querySelector('#sc-go').onclick = calc;
      r.querySelector('#sc-in').addEventListener('keydown', e => { if (e.key === 'Enter') calc(); });
      r.querySelector('#sc-copy').onclick = () => { const t = r.querySelector('#sc-out').textContent.replace(/^=\s*/, ''); if (t && !t.startsWith('错误')) copyText(t, '已复制'); };
      calc();
    }
  });

  // 分数计算
  T.register({
    id: 'fraction', cat: 'math', icon: '➗', name: '分数计算',
    desc: '分数加减乘除与化简', keywords: 'fraction 分数 运算',
    render: () => `
      <div class="tool-panel">
        <h2>➗ 分数计算</h2>
        <p class="t-sub">输入两个分数与运算符。</p>
        <div class="row">
          <div class="field"><label>分子1</label><input type="number" id="fr-a1" value="1"></div>
          <div class="field"><label>分母1</label><input type="number" id="fr-b1" value="2"></div>
          <div class="field"><label>运算</label><select id="fr-op"><option value="+">+</option><option value="-">-</option><option value="*">×</option><option value="/">÷</option></select></div>
          <div class="field"><label>分子2</label><input type="number" id="fr-a2" value="1"></div>
          <div class="field"><label>分母2</label><input type="number" id="fr-b2" value="3"></div>
        </div>
        <div class="field"><label>结果</label><div class="out" id="fr-out"></div></div>
      </div>`,
    init: (r) => {
      const gcd = (a, b) => b ? gcd(b, a % b) : a;
      const go = () => {
        let a = N(r.querySelector('#fr-a1').value), b = N(r.querySelector('#fr-b1').value), c = N(r.querySelector('#fr-a2').value), d = N(r.querySelector('#fr-b2').value), op = r.querySelector('#fr-op').value;
        if (b === 0 || d === 0) { r.querySelector('#fr-out').textContent = '分母不能为 0'; return; }
        let n, m;
        if (op === '+') { n = a * d + c * b; m = b * d; }
        else if (op === '-') { n = a * d - c * b; m = b * d; }
        else if (op === '*') { n = a * c; m = b * d; }
        else { n = a * d; m = b * c; }
        const g = gcd(Math.abs(n), Math.abs(m)) || 1;
        r.querySelector('#fr-out').textContent = `${n}/${m} = ${n / g}/${m / g} ≈ ${(n / m).toFixed(4)}`;
      };
      r.querySelectorAll('input,select').forEach(el => el.addEventListener('input', go)); go();
    }
  });

  // 开方 / 根
  T.register({
    id: 'root', cat: 'math', icon: '√', name: '开方计算',
    desc: '平方根、立方根与任意次根', keywords: 'sqrt root 开方 根号',
    render: () => `
      <div class="tool-panel">
        <h2>√ 开方计算</h2>
        <p class="t-sub">计算 n 次方根。</p>
        <div class="row">
          <div class="field"><label>被开方数</label><input type="number" id="rt-x" value="27"></div>
          <div class="field"><label>根次数 n（2=平方,3=立方）</label><input type="number" id="rt-n" value="3" min="1"></div>
        </div>
        <div class="grid-3" id="rt-out"></div>
      </div>`,
    init: (r) => {
      const go = () => { const x = N(r.querySelector('#rt-x').value), n = N(r.querySelector('#rt-n').value) || 1; const v = Math.pow(Math.abs(x), 1 / n) * (x < 0 && n % 2 === 1 ? -1 : 1); r.querySelector('#rt-out').innerHTML = [['结果', v.toFixed(6)], ['平方', (v * v).toFixed(4)], ['立方', (v * v * v).toFixed(4)]].map(([k, val]) => `<div class="tool-card" style="min-height:auto"><div class="t-desc">${k}</div><div class="result-num" style="font-size:18px">${val}</div></div>`).join(''); };
      r.querySelectorAll('input').forEach(el => el.addEventListener('input', go)); go();
    }
  });

  // 均值 / 中位数 / 众数
  T.register({
    id: 'stats', cat: 'math', icon: '📊', name: '均值中位数众数',
    desc: '一组数的平均值、中位数、众数、极值', keywords: 'mean median mode 均值 中位数 众数 统计',
    render: () => `
      <div class="tool-panel">
        <h2>📊 描述统计</h2>
        <p class="t-sub">输入以逗号或空格分隔的数字。</p>
        <div class="field"><label>数据</label><textarea id="st-in" style="min-height:90px">3, 7, 2, 7, 5, 9, 1</textarea></div>
        <div class="grid-3" id="st-out"></div>
      </div>`,
    init: (r) => {
      const go = () => {
        const arr = r.querySelector('#st-in').value.split(/[\s,]+/).map(N).filter(x => !isNaN(x));
        if (!arr.length) { r.querySelector('#st-out').innerHTML = '<div class="muted">请输入数据</div>'; return; }
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        const freq = {}; arr.forEach(x => freq[x] = (freq[x] || 0) + 1);
        const maxF = Math.max(...Object.values(freq));
        const modes = Object.keys(freq).filter(k => freq[k] === maxF).map(Number);
        r.querySelector('#st-out').innerHTML = [
          ['平均值', mean.toFixed(3)], ['中位数', median], ['众数', modes.join(', ')],
          ['最小值', sorted[0]], ['最大值', sorted[sorted.length - 1]], ['总和', arr.reduce((a, b) => a + b, 0)]
        ].map(([k, v]) => `<div class="tool-card" style="min-height:auto"><div class="t-desc">${k}</div><div class="result-num" style="font-size:18px">${v}</div></div>`).join('');
      };
      r.querySelector('#st-in').addEventListener('input', go); go();
    }
  });

  // 标准差 / 方差
  T.register({
    id: 'stddev', cat: 'math', icon: '📐', name: '标准差方差',
    desc: '样本/总体标准差与方差', keywords: 'standard deviation 标准差 方差',
    render: () => `
      <div class="tool-panel">
        <h2>📐 标准差与方差</h2>
        <p class="t-sub">输入数字（逗号或空格分隔）。</p>
        <div class="field"><label>数据</label><textarea id="sd-in" style="min-height:90px">10, 12, 14, 11, 13</textarea></div>
        <div class="grid-3" id="sd-out"></div>
      </div>`,
    init: (r) => {
      const go = () => {
        const arr = r.querySelector('#sd-in').value.split(/[\s,]+/).map(N).filter(x => !isNaN(x));
        if (arr.length < 2) { r.querySelector('#sd-out').innerHTML = '<div class="muted">至少需 2 个数</div>'; return; }
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const ss = arr.reduce((a, b) => a + (b - mean) ** 2, 0);
        const popVar = ss / arr.length, sampVar = ss / (arr.length - 1);
        r.querySelector('#sd-out').innerHTML = [
          ['均值', mean.toFixed(3)], ['总体标准差', Math.sqrt(popVar).toFixed(4)], ['样本标准差', Math.sqrt(sampVar).toFixed(4)],
          ['总体方差', popVar.toFixed(4)], ['样本方差', sampVar.toFixed(4)]
        ].map(([k, v]) => `<div class="tool-card" style="min-height:auto"><div class="t-desc">${k}</div><div class="result-num" style="font-size:16px">${v}</div></div>`).join('');
      };
      r.querySelector('#sd-in').addEventListener('input', go); go();
    }
  });

  // 进制转换
  T.register({
    id: 'base-conv', cat: 'math', icon: '🔢', name: '进制转换',
    desc: '二进制 / 八进制 / 十进制 / 十六进制互转', keywords: 'binary hex 进制 转换 二进制 十六进制',
    render: () => `
      <div class="tool-panel">
        <h2>🔢 进制转换</h2>
        <p class="t-sub">输入一个数值，自动换算到 2/8/10/16 进制。</p>
        <div class="field"><label>输入（可填任意进制，需选进制）</label><input type="text" id="bc-in" value="255"></div>
        <div class="field"><label>当前进制</label><select id="bc-base"><option value="10">十进制</option><option value="2">二进制</option><option value="8">八进制</option><option value="16">十六进制</option></select></div>
        <div class="grid-2" id="bc-out"></div>
      </div>`,
    init: (r) => {
      const go = () => {
        const val = r.querySelector('#bc-in').value.trim(), base = +r.querySelector('#bc-base').value;
        const dec = parseInt(val, base);
        const out = r.querySelector('#bc-out');
        if (isNaN(dec)) { out.innerHTML = '<div class="muted">无法解析</div>'; return; }
        out.innerHTML = [
          ['二进制', '0b' + dec.toString(2)],
          ['八进制', '0o' + dec.toString(8)],
          ['十进制', String(dec)],
          ['十六进制', '0x' + dec.toString(16).toUpperCase()]
        ].map(([k, v]) => `<div class="tool-card" style="min-height:auto"><div class="t-desc">${k}</div><div class="result-num" style="font-size:15px;word-break:break-all">${v}</div></div>`).join('');
      };
      r.querySelector('#bc-in').addEventListener('input', go); r.querySelector('#bc-base').addEventListener('change', go); go();
    }
  });
})();

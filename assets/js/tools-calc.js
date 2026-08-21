/* ============ 计算器 / 密码 ============ */
(function () {
  const T = window.TB;
  const money = v => '¥' + fmt(v);

  // 1. 房贷
  T.register({
    id: 'mortgage', cat: 'calc', icon: '🏠', name: '房贷计算器',
    desc: '等额本息 / 等额本金月供', keywords: 'mortgage 房贷 月供 贷款',
    render: () => `
      <div class="tool-panel"><h2>🏠 房贷计算器</h2>
      <div class="row">
        <div class="field"><label>贷款总额（元）</label><input type="number" id="mg-p" value="1000000"></div>
        <div class="field"><label>年利率（%）</label><input type="number" id="mg-r" value="3.95" step="0.01"></div>
        <div class="field"><label>期限（年）</label><input type="number" id="mg-y" value="30"></div>
      </div>
      <div class="field"><label>还款方式</label><select id="mg-m"><option value="eq">等额本息</option><option value="pr">等额本金</option></select></div>
      <div id="mg-out"></div></div>`,
    init: (r) => {
      const p = r.querySelector('#mg-p'), rate = r.querySelector('#mg-r'), y = r.querySelector('#mg-y'), m = r.querySelector('#mg-m'), out = r.querySelector('#mg-out');
      const calc = () => {
        const P = +p.value, R = +rate.value / 100 / 12, N = +y.value * 12;
        if (m.value === 'eq') {
          const pow = Math.pow(1 + R, N);
          const mp = P * R * pow / (pow - 1);
          const total = mp * N, interest = total - P;
          out.innerHTML = kv([['每月月供', money(mp)], ['还款总额', money(total)], ['支付利息', money(interest)]]);
        } else {
          const principal = P / N; let interest = 0, first = 0;
          for (let i = 0; i < N; i++) { const rem = P - principal * i; interest += rem * R; if (i === 0) first = principal + rem * R; }
          out.innerHTML = kv([['首月月供', money(first)], ['每月递减', money(principal * R)], ['支付利息总额', money(interest)], ['还款总额', money(P + interest)]]);
        }
      };
      [p, rate, y, m].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 2. 复利
  T.register({
    id: 'compound', cat: 'calc', icon: '📈', name: '复利计算器',
    desc: '本金 + 定投的未来价值', keywords: 'compound interest 复利 定投',
    render: () => `
      <div class="tool-panel"><h2>📈 复利计算器</h2>
      <div class="row">
        <div class="field"><label>初始本金（元）</label><input type="number" id="cp-p" value="10000"></div>
        <div class="field"><label>年化利率（%）</label><input type="number" id="cp-r" value="5" step="0.1"></div>
        <div class="field"><label>年限</label><input type="number" id="cp-y" value="10"></div>
        <div class="field"><label>每月追加（元）</label><input type="number" id="cp-a" value="500"></div>
      </div>
      <div class="field"><label>复利频率</label><select id="cp-f"><option value="12">按月</option><option value="4">按季</option><option value="1">按年</option><option value="365">按日</option></select></div>
      <div id="cp-out"></div></div>`,
    init: (r) => {
      const p = r.querySelector('#cp-p'), rate = r.querySelector('#cp-r'), y = r.querySelector('#cp-y'), a = r.querySelector('#cp-a'), f = r.querySelector('#cp-f'), out = r.querySelector('#cp-out');
      const calc = () => {
        const P = +p.value, i = +rate.value / 100 / +f.value, n = +y.value * +f.value, PMT = +a.value * (+f.value / 12);
        const fvP = P * Math.pow(1 + i, n);
        const fvA = i === 0 ? PMT * n : PMT * (Math.pow(1 + i, n) - 1) / i;
        const fv = fvP + fvA;
        const contributed = P + PMT * n;
        out.innerHTML = kv([['未来价值', money(fv)], ['累计投入', money(contributed)], ['利息收益', money(fv - contributed)]]);
      };
      [p, rate, y, a, f].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 3. 贷款（等额本息）
  T.register({
    id: 'loan', cat: 'calc', icon: '💳', name: '贷款计算器',
    desc: '通用等额本息月供', keywords: 'loan 贷款 月供',
    render: () => `
      <div class="tool-panel"><h2>💳 贷款计算器（等额本息）</h2>
      <div class="row">
        <div class="field"><label>贷款金额（元）</label><input type="number" id="ln-p" value="50000"></div>
        <div class="field"><label>年利率（%）</label><input type="number" id="ln-r" value="6" step="0.1"></div>
        <div class="field"><label>期限（月）</label><input type="number" id="ln-n" value="24"></div>
      </div>
      <div id="ln-out"></div></div>`,
    init: (r) => {
      const p = r.querySelector('#ln-p'), rate = r.querySelector('#ln-r'), n = r.querySelector('#ln-n'), out = r.querySelector('#ln-out');
      const calc = () => {
        const P = +p.value, R = +rate.value / 100 / 12, N = +n.value;
        const pow = Math.pow(1 + R, N); const mp = P * R * pow / (pow - 1);
        out.innerHTML = kv([['每月月供', money(mp)], ['还款总额', money(mp * N)], ['支付利息', money(mp * N - P)]]);
      };
      [p, rate, n].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 4. 百分比
  T.register({
    id: 'percentage', cat: 'calc', icon: '％', name: '百分比计算器',
    desc: '百分数 / 占比 / 增减', keywords: 'percentage 百分比 占比',
    render: () => `
      <div class="tool-panel"><h2>％ 百分比计算器</h2>
      <div class="field"><label>模式</label><select id="pc-m">
        <option value="of">A 的 B% 是多少</option><option value="is">A 是 B 的百分之几</option><option value="chg">A 增减 B% 后是多少</option></select></div>
      <div class="row">
        <div class="field"><label>A</label><input type="number" id="pc-a" value="200"></div>
        <div class="field"><label>B</label><input type="number" id="pc-b" value="15"></div>
      </div>
      <div class="field"><label>结果</label><div class="out" id="pc-out"></div></div></div>`,
    init: (r) => {
      const m = r.querySelector('#pc-m'), a = r.querySelector('#pc-a'), b = r.querySelector('#pc-b'), out = r.querySelector('#pc-out');
      const calc = () => {
        const A = +a.value, B = +b.value; let res;
        if (m.value === 'of') res = A * B / 100;
        else if (m.value === 'is') res = A / B * 100;
        else res = A * (1 + B / 100);
        out.textContent = fmt(res, 4) + (m.value === 'is' ? '%' : '');
      };
      [m, a, b].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 5. 小费
  T.register({
    id: 'tip', cat: 'calc', icon: '🍽️', name: '小费计算器',
    desc: '按人数均摊小费', keywords: 'tip 小费 均摊',
    render: () => `
      <div class="tool-panel"><h2>🍽️ 小费计算器</h2>
      <div class="row">
        <div class="field"><label>账单金额（元）</label><input type="number" id="tp-b" value="200"></div>
        <div class="field"><label>小费比例（%）</label><input type="number" id="tp-r" value="10"></div>
        <div class="field"><label>人数</label><input type="number" id="tp-n" value="2"></div>
      </div>
      <div id="tp-out"></div></div>`,
    init: (r) => {
      const b = r.querySelector('#tp-b'), rate = r.querySelector('#tp-r'), n = r.querySelector('#tp-n'), out = r.querySelector('#tp-out');
      const calc = () => {
        const tip = +b.value * +rate.value / 100, total = +b.value + tip, per = total / (+n.value || 1);
        out.innerHTML = kv([['小费金额', money(tip)], ['总金额', money(total)], ['人均', money(per)]]);
      };
      [b, rate, n].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 6. 折扣
  T.register({
    id: 'discount', cat: 'calc', icon: '🏷️', name: '折扣计算器',
    desc: '原价 / 折扣 → 实付', keywords: 'discount 折扣 优惠',
    render: () => `
      <div class="tool-panel"><h2>🏷️ 折扣计算器</h2>
      <div class="row">
        <div class="field"><label>原价（元）</label><input type="number" id="dc-o" value="199"></div>
        <div class="field"><label>折扣（折，如 8.5 折）</label><input type="number" id="dc-d" value="8.5" step="0.1"></div>
      </div>
      <div class="field"><label>结果</label><div id="dc-out"></div></div></div>`,
    init: (r) => {
      const o = r.querySelector('#dc-o'), d = r.querySelector('#dc-d'), out = r.querySelector('#dc-out');
      const calc = () => { const pay = +o.value * +d.value / 10, saved = +o.value - pay; out.innerHTML = kv([['实付', money(pay)], ['节省', money(saved)], ['折扣率', (+d.value) + ' 折']]); };
      [o, d].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 7. ROI
  T.register({
    id: 'roi', cat: 'calc', icon: '📊', name: 'ROI 计算',
    desc: '投资回报率', keywords: 'roi 投资 回报',
    render: () => `
      <div class="tool-panel"><h2>📊 投资回报率（ROI）</h2>
      <div class="row">
        <div class="field"><label>投入成本（元）</label><input type="number" id="ro-c" value="10000"></div>
        <div class="field"><label>最终价值（元）</label><input type="number" id="ro-v" value="15000"></div>
      </div>
      <div id="ro-out"></div></div>`,
    init: (r) => {
      const c = r.querySelector('#ro-c'), v = r.querySelector('#ro-v'), out = r.querySelector('#ro-out');
      const calc = () => { const gain = +v.value - +c.value, roi = +c.value ? gain / +c.value * 100 : 0; out.innerHTML = kv([['收益', money(gain)], ['ROI', fmt(roi, 2) + '%'], ['倍率', fmt(+v.value / (+c.value || 1), 2) + '×']]); };
      [c, v].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 8. 利润
  T.register({
    id: 'profit', cat: 'calc', icon: '💰', name: '利润计算器',
    desc: '收入成本 → 利润/利润率', keywords: 'profit margin 利润 利润率',
    render: () => `
      <div class="tool-panel"><h2>💰 利润计算器</h2>
      <div class="row">
        <div class="field"><label>收入（元）</label><input type="number" id="pf-r" value="1200"></div>
        <div class="field"><label>成本（元）</label><input type="number" id="pf-c" value="800"></div>
      </div>
      <div id="pf-out"></div></div>`,
    init: (r) => {
      const rev = r.querySelector('#pf-r'), cost = r.querySelector('#pf-c'), out = r.querySelector('#pf-out');
      const calc = () => { const profit = +rev.value - +cost.value, margin = +rev.value ? profit / +rev.value * 100 : 0, cm = +cost.value ? profit / +cost.value * 100 : 0; out.innerHTML = kv([['利润', money(profit)], ['销售利润率', fmt(margin, 2) + '%'], ['成本利润率', fmt(cm, 2) + '%']]); };
      [rev, cost].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 9. 工资/时薪
  T.register({
    id: 'salary', cat: 'calc', icon: '💼', name: '工资 / 时薪',
    desc: '月薪 ↔ 时薪互算', keywords: 'salary 工资 时薪',
    render: () => `
      <div class="tool-panel"><h2>💼 工资 / 时薪换算</h2>
      <div class="row">
        <div class="field"><label>月薪（元）</label><input type="number" id="sa-m" value="10000"></div>
        <div class="field"><label>每月工作日</label><input type="number" id="sa-d" value="22"></div>
        <div class="field"><label>每天工时</label><input type="number" id="sa-h" value="8"></div>
      </div>
      <div id="sa-out"></div></div>`,
    init: (r) => {
      const m = r.querySelector('#sa-m'), d = r.querySelector('#sa-d'), h = r.querySelector('#sa-h'), out = r.querySelector('#sa-out');
      const calc = () => { const hour = (+m.value || 0) / ((+d.value || 1) * (+h.value || 1)); out.innerHTML = kv([['时薪', money(hour)], ['日薪', money(+m.value / (+d.value || 1))], ['年薪（×12）', money(+m.value * 12)]]); };
      [m, d, h].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 10. 储蓄
  T.register({
    id: 'savings', cat: 'calc', icon: '🐖', name: '储蓄计算器',
    desc: '每月定存到期总额', keywords: 'savings 储蓄 定存',
    render: () => `
      <div class="tool-panel"><h2>🐖 储蓄计算器（零存整取）</h2>
      <div class="row">
        <div class="field"><label>每月存入（元）</label><input type="number" id="sv-a" value="1000"></div>
        <div class="field"><label>年化利率（%）</label><input type="number" id="sv-r" value="2" step="0.1"></div>
        <div class="field"><label>年限</label><input type="number" id="sv-y" value="5"></div>
      </div>
      <div id="sv-out"></div></div>`,
    init: (r) => {
      const a = r.querySelector('#sv-a'), rate = r.querySelector('#sv-r'), y = r.querySelector('#sv-y'), out = r.querySelector('#sv-out');
      const calc = () => {
        const i = +rate.value / 100 / 12, n = +y.value * 12, PMT = +a.value;
        const fv = i === 0 ? PMT * n : PMT * (Math.pow(1 + i, n) - 1) / i;
        out.innerHTML = kv([['到期总额', money(fv)], ['累计存入', money(PMT * n)], ['利息', money(fv - PMT * n)]]);
      };
      [a, rate, y].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 11. BMI
  T.register({
    id: 'bmi', cat: 'calc', icon: '⚖️', name: 'BMI 计算',
    desc: '身体质量指数', keywords: 'bmi 体重 身高',
    render: () => `
      <div class="tool-panel"><h2>⚖️ BMI 计算</h2>
      <div class="row">
        <div class="field"><label>体重（kg）</label><input type="number" id="bm-w" value="65"></div>
        <div class="field"><label>身高（cm）</label><input type="number" id="bm-h" value="170"></div>
      </div>
      <div id="bm-out"></div>
      <div class="hint">参考中国标准：偏瘦 &lt;18.5，正常 18.5–23.9，超重 24–27.9，肥胖 ≥28。</div></div>`,
    init: (r) => {
      const w = r.querySelector('#bm-w'), h = r.querySelector('#bm-h'), out = r.querySelector('#bm-out');
      const calc = () => {
        const bmi = +w.value / Math.pow(+h.value / 100, 2);
        let cat, col;
        if (bmi < 18.5) { cat = '偏瘦'; col = 'var(--accent)'; }
        else if (bmi < 24) { cat = '正常'; col = 'var(--ok)'; }
        else if (bmi < 28) { cat = '超重'; col = '#e6a23c'; }
        else { cat = '肥胖'; col = 'var(--danger)'; }
        out.innerHTML = `<div class="kv"><span class="k">BMI</span><span class="v" style="color:${col};font-size:22px">${fmt(bmi, 1)}</span></div><div class="kv"><span class="k">分类</span><span class="v" style="color:${col}">${cat}</span></div>`;
      };
      [w, h].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 12. 热量（BMR / TDEE）
  T.register({
    id: 'calorie', cat: 'calc', icon: '🔥', name: '热量需求',
    desc: '基础代谢与每日热量', keywords: 'calorie bmr tdee 热量 代谢',
    render: () => `
      <div class="tool-panel"><h2>🔥 每日热量需求（BMR / TDEE）</h2>
      <div class="row">
        <div class="field"><label>性别</label><select id="cl-s"><option value="m">男</option><option value="f">女</option></select></div>
        <div class="field"><label>年龄</label><input type="number" id="cl-a" value="30"></div>
        <div class="field"><label>身高（cm）</label><input type="number" id="cl-h" value="170"></div>
        <div class="field"><label>体重（kg）</label><input type="number" id="cl-w" value="65"></div>
        <div class="field"><label>活动水平</label><select id="cl-act">
          <option value="1.2">久坐</option><option value="1.375">轻度</option><option value="1.55" selected>中度</option><option value="1.725">高强度</option><option value="1.9">极高</option></select></div>
      </div>
      <div id="cl-out"></div></div>`,
    init: (r) => {
      const s = r.querySelector('#cl-s'), a = r.querySelector('#cl-a'), h = r.querySelector('#cl-h'), w = r.querySelector('#cl-w'), act = r.querySelector('#cl-act'), out = r.querySelector('#cl-out');
      const calc = () => {
        const bmr = s.value === 'm' ? 10 * +w.value + 6.25 * +h.value - 5 * +a.value + 5 : 10 * +w.value + 6.25 * +h.value - 5 * +a.value - 161;
        const tdee = bmr * +act.value;
        out.innerHTML = kv([['基础代谢 BMR', fmt(bmr, 0) + ' kcal'], ['每日消耗 TDEE', fmt(tdee, 0) + ' kcal'],
          ['减脂（−500）', fmt(tdee - 500, 0) + ' kcal'], ['增肌（+300）', fmt(tdee + 300, 0) + ' kcal']]);
      };
      [s, a, h, w, act].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 13. 体脂率
  T.register({
    id: 'bodyfat', cat: 'calc', icon: '🩸', name: '体脂率估算',
    desc: '基于 BMI 的体脂率估算', keywords: 'bodyfat 体脂 脂肪',
    render: () => `
      <div class="tool-panel"><h2>🩸 体脂率估算</h2><p class="t-sub">Deurenberg 公式估算，仅供参考。</p>
      <div class="row">
        <div class="field"><label>性别</label><select id="bf-s"><option value="m">男</option><option value="f">女</option></select></div>
        <div class="field"><label>年龄</label><input type="number" id="bf-a" value="30"></div>
        <div class="field"><label>身高（cm）</label><input type="number" id="bf-h" value="170"></div>
        <div class="field"><label>体重（kg）</label><input type="number" id="bf-w" value="65"></div>
      </div>
      <div id="bf-out"></div></div>`,
    init: (r) => {
      const s = r.querySelector('#bf-s'), a = r.querySelector('#bf-a'), h = r.querySelector('#bf-h'), w = r.querySelector('#bf-w'), out = r.querySelector('#bf-out');
      const calc = () => {
        const bmi = +w.value / Math.pow(+h.value / 100, 2);
        const sex = s.value === 'm' ? 1 : 0;
        const bf = 1.20 * bmi + 0.23 * +a.value - 10.8 * sex - 5.4;
        out.innerHTML = kv([['BMI', fmt(bmi, 1)], ['估算体脂率', fmt(bf, 1) + '%']]);
      };
      [s, a, h, w].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 14. 宏量营养
  T.register({
    id: 'macro', cat: 'calc', icon: '🥗', name: '宏量营养',
    desc: '按热量分配蛋白/碳水/脂肪', keywords: 'macro 宏量 营养 蛋白',
    render: () => `
      <div class="tool-panel"><h2>🥗 宏量营养分配</h2>
      <div class="row">
        <div class="field"><label>每日热量（kcal）</label><input type="number" id="mc-cal" value="2000"></div>
        <div class="field"><label>蛋白质占比 %</label><input type="number" id="mc-p" value="30"></div>
        <div class="field"><label>碳水占比 %</label><input type="number" id="mc-c" value="40"></div>
        <div class="field"><label>脂肪占比 %</label><input type="number" id="mc-f" value="30"></div>
      </div>
      <div id="mc-out"></div>
      <div class="hint">蛋白质/碳水 4 kcal/g，脂肪 9 kcal/g。</div></div>`,
    init: (r) => {
      const cal = r.querySelector('#mc-cal'), p = r.querySelector('#mc-p'), c = r.querySelector('#mc-c'), f = r.querySelector('#mc-f'), out = r.querySelector('#mc-out');
      const calc = () => {
        const C = +cal.value, P = +p.value, CB = +c.value, F = +f.value;
        out.innerHTML = kv([['蛋白质', fmt(C * P / 100 / 4, 0) + ' g'], ['碳水', fmt(C * CB / 100 / 4, 0) + ' g'], ['脂肪', fmt(C * F / 100 / 9, 0) + ' g']]);
      };
      [cal, p, c, f].forEach(e => e.addEventListener('input', calc)); calc();
    }
  });

  // 15. 密码生成器
  T.register({
    id: 'password', cat: 'pass', icon: '🔑', name: '密码生成器',
    desc: '高强度随机密码', keywords: 'password 密码 生成 随机',
    render: () => `
      <div class="tool-panel"><h2>🔑 密码生成器</h2>
      <div class="field"><label>密码</label><div class="out" id="pw-out" style="font-size:18px;letter-spacing:1px"></div></div>
      <div class="field"><label>强度</label><div id="pw-meter" style="height:8px;border-radius:6px;background:var(--border)"></div></div>
      <div class="row">
        <div class="field"><label>长度</label><input type="number" id="pw-len" value="16" min="4" max="64"></div>
        <div class="field"><label>数量</label><input type="number" id="pw-n" value="1" min="1" max="20"></div>
      </div>
      <div class="field">
        <label style="display:flex;gap:14px;flex-wrap:wrap;color:var(--text-soft);font-size:13px">
          <span><input type="checkbox" id="pw-u" checked> 大写</span>
          <span><input type="checkbox" id="pw-lo" checked> 小写</span>
          <span><input type="checkbox" id="pw-d" checked> 数字</span>
          <span><input type="checkbox" id="pw-s" checked> 符号</span>
          <span><input type="checkbox" id="pw-ex"> 排除易混字符</span>
        </label>
      </div>
      <div class="btn-row"><button class="btn" id="pw-go">生成</button><button class="btn secondary" id="pw-copy">复制</button></div></div>`,
    init: (r) => {
      const len = r.querySelector('#pw-len'), n = r.querySelector('#pw-n'), out = r.querySelector('#pw-out'), meter = r.querySelector('#pw-meter');
      const sets = {
        u: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lo: 'abcdefghijklmnopqrstuvwxyz',
        d: '0123456789', s: '!@#$%^&*()-_=+[]{};:,.<>?'
      };
      const excl = new Set('O0l1I|`\'"'.split(''));
      const gen = () => {
        let pool = ''; const chosen = [];
        ['u', 'lo', 'd', 's'].forEach(k => { if (r.querySelector('#pw-' + k).checked) { let s = sets[k]; if (r.querySelector('#pw-ex').checked) s = s.split('').filter(c => !excl.has(c)).join(''); pool += s; chosen.push(s); } });
        if (!pool) { out.textContent = '请至少选择一种字符'; meter.style.background = 'var(--danger)'; return; }
        const L = clamp(+len.value || 16, 4, 64), count = clamp(+n.value || 1, 1, 20);
        const res = [];
        for (let c = 0; c < count; c++) {
          let pwd = '';
          for (let i = 0; i < L; i++) pwd += pool[Math.floor(Math.random() * pool.length)];
          // 保证每种选中类型至少出现一次
          chosen.forEach(s => { const pos = Math.floor(Math.random() * L); pwd = pwd.slice(0, pos) + s[Math.floor(Math.random() * s.length)] + pwd.slice(pos + 1); });
          res.push(pwd);
        }
        out.textContent = res.join('\n');
        const has = k => r.querySelector('#pw-' + k).checked;
        const variety = [has('u'), has('lo'), has('d'), has('s')].filter(Boolean).length;
        const score = Math.min(4, Math.floor(L / 6) + variety - 1);
        const colors = ['var(--danger)', '#e6a23c', 'var(--accent)', 'var(--ok)'];
        meter.style.background = colors[clamp(score, 0, 3)];
      };
      r.querySelector('#pw-go').onclick = gen;
      r.querySelector('#pw-copy').onclick = () => copyText(out.textContent, '已复制');
      ['u', 'lo', 'd', 's', 'ex', 'len', 'n'].forEach(k => r.querySelector('#pw-' + k).addEventListener('input', gen));
      gen();
    }
  });

  /* 通用键值渲染 */
  function kv(pairs) {
    return pairs.map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');
  }
})();

/* ============ 扩展计算器：财务 + 健康（工厂模式批量生成） ============ */
(function () {
  const T = window.TB;
  const N = s => { const x = parseFloat(s); return isNaN(x) ? 0 : x; };
  const money = x => fmt(x, 2);

  // 等额本息月供
  function loanPMT(P, aPct, nMonths) {
    const r = aPct / 100 / 12;
    if (r === 0) return { pay: P / nMonths, total: P, interest: 0 };
    const pay = P * r / (1 - Math.pow(1 + r, -nMonths));
    const total = pay * nMonths;
    return { pay, total, interest: total - P };
  }
  // 复利未来值（期初本金 + 每月定投）
  function fvWithContrib(P0, monthly, years, aPct) {
    const r = aPct / 100 / 12, n = years * 12;
    const fvP = P0 * Math.pow(1 + r, n);
    const fvC = r === 0 ? monthly * n : monthly * (Math.pow(1 + r, n) - 1) / r;
    return fvP + fvC;
  }

  /* 通用计算器工厂 */
  function mkCalc(spec) {
    const id = spec.id;
    T.register({
      id, cat: spec.cat || 'calc', icon: spec.icon, name: spec.name, desc: spec.desc, keywords: spec.keywords || '',
      render: () => {
        const fields = (spec.fields || []).map(f => {
          if (f.type === 'select') return `<div class="field"><label>${f.label}</label><select id="${id}-${f.k}">${(f.opts || []).map(o => `<option value="${o.v}" ${String(o.v) === String(f.val) ? 'selected' : ''}>${o.t}</option>`).join('')}</select></div>`;
          if (f.type === 'date') return `<div class="field"><label>${f.label}</label><input type="date" id="${id}-${f.k}" value="${f.val || ''}"></div>`;
          return `<div class="field"><label>${f.label}${f.unit ? ` (${f.unit})` : ''}</label><input type="number" id="${id}-${f.k}" value="${f.val != null ? f.val : ''}" ${f.step ? `step="${f.step}"` : ''} ${f.min != null ? `min="${f.min}"` : ''}></div>`;
        }).join('');
        return `<div class="tool-panel"><h2>${spec.icon} ${spec.name}</h2><p class="t-sub">${spec.desc}</p>
          <div class="grid-2">${fields}</div>
          <div class="btn-row"><button class="btn" id="${id}-go">计算</button></div>
          <div class="${spec.outCols === 2 ? 'grid-2' : 'grid-3'}" id="${id}-out"></div>
          ${spec.note ? `<div class="hint">${spec.note}</div>` : ''}</div>`;
      },
      init: (r) => {
        const go = () => {
          const v = {}; (spec.fields || []).forEach(f => v[f.k] = r.querySelector('#' + id + '-' + f.k).value);
          const res = spec.compute(v, N);
          const out = r.querySelector('#' + id + '-out');
          if (Array.isArray(res)) out.innerHTML = res.map(([k, val, unit]) =>
            `<div class="tool-card" style="min-height:auto"><div class="t-desc">${k}</div><div class="result-num">${val}${unit ? ` <small style="font-size:12px;color:var(--text-muted)">${unit}</small>` : ''}</div></div>`).join('');
          else out.innerHTML = res;
        };
        (spec.fields || []).forEach(f => { const el = r.querySelector('#' + id + '-' + f.k); if (el) { el.addEventListener('input', go); el.addEventListener('change', go); } });
        const b = r.querySelector('#' + id + '-go'); if (b) b.onclick = go;
        go();
      }
    });
  }

  /* ---------- 财务：贷款 / 月供 ---------- */
  mkCalc({ id: 'auto-loan', icon: '🚗', name: '车贷计算器', desc: '计算车贷月供、总利息与总还款', keywords: 'auto loan 车贷 月供 利息',
    fields: [{ k: 'p', label: '贷款金额', unit: '元', val: 150000 }, { k: 'r', label: '年利率', unit: '%', val: 5 }, { k: 'n', label: '期限', unit: '月', val: 36 }],
    compute: (v) => { const x = loanPMT(N(v.p), N(v.r), N(v.n)); return [['月供', money(x.pay), '元'], ['总还款', money(x.total), '元'], ['总利息', money(x.interest), '元']]; } });

  mkCalc({ id: 'loan-payment', icon: '💳', name: '贷款月供计算', desc: '通用等额本息月供计算', keywords: 'payment loan 贷款 月供 还款',
    fields: [{ k: 'p', label: '贷款本金', unit: '元', val: 500000 }, { k: 'r', label: '年利率', unit: '%', val: 4.9 }, { k: 'n', label: '期限', unit: '月', val: 240 }],
    compute: (v) => { const x = loanPMT(N(v.p), N(v.r), N(v.n)); return [['月供', money(x.pay), '元'], ['总还款', money(x.total), '元'], ['总利息', money(x.interest), '元']]; } });

  mkCalc({ id: 'emi', icon: '📋', name: 'EMI 分期计算', desc: '等额月供（EMI）计算', keywords: 'emi 分期 月供',
    fields: [{ k: 'p', label: '本金', unit: '元', val: 100000 }, { k: 'r', label: '月利率', unit: '%', val: 1 }, { k: 'n', label: '期数', val: 12 }],
    compute: (v) => { const x = loanPMT(N(v.p), N(v.r) * 12, N(v.n)); return [['每期还款', money(x.pay), '元'], ['总还款', money(x.total), '元'], ['总利息', money(x.interest), '元']]; } });

  mkCalc({ id: 'student-loan', icon: '🎓', name: '助学贷款计算', desc: '助学贷款月供与总利息', keywords: 'student loan 助学 贷款',
    fields: [{ k: 'p', label: '贷款总额', unit: '元', val: 80000 }, { k: 'r', label: '年利率', unit: '%', val: 3.45 }, { k: 'n', label: '期限', unit: '月', val: 120 }],
    compute: (v) => { const x = loanPMT(N(v.p), N(v.r), N(v.n)); return [['月供', money(x.pay), '元'], ['总还款', money(x.total), '元'], ['总利息', money(x.interest), '元']]; } });

  mkCalc({ id: 'business-loan', icon: '🏢', name: '经营贷计算', desc: '企业经营贷款月供测算', keywords: 'business loan 经营贷 企业',
    fields: [{ k: 'p', label: '贷款金额', unit: '元', val: 1000000 }, { k: 'r', label: '年利率', unit: '%', val: 4.35 }, { k: 'n', label: '期限', unit: '月', val: 36 }],
    compute: (v) => { const x = loanPMT(N(v.p), N(v.r), N(v.n)); return [['月供', money(x.pay), '元'], ['总还款', money(x.total), '元'], ['总利息', money(x.interest), '元']]; } });

  mkCalc({ id: 'down-payment', icon: '🏠', name: '首付计算', desc: '按房价与首付比例算首付与贷款额', keywords: 'down payment 首付 房价',
    fields: [{ k: 'price', label: '房价', unit: '元', val: 3000000 }, { k: 'pct', label: '首付比例', unit: '%', val: 30 }],
    compute: (v) => { const dp = N(v.price) * N(v.pct) / 100; return [['首付金额', money(dp), '元'], ['贷款金额', money(N(v.price) - dp), '元'], ['贷款成数', (100 - N(v.pct)).toFixed(0), '成']]; } });

  mkCalc({ id: 'apr', icon: '📈', name: 'APR 实际利率', desc: '含手续费的贷款实际年化利率', keywords: 'apr 实际利率 费率',
    fields: [{ k: 'p', label: '贷款本金', unit: '元', val: 100000 }, { k: 'fee', label: '一次性费用', unit: '元', val: 2000 }, { k: 'r', label: '名义年利率', unit: '%', val: 5 }, { k: 'n', label: '期限', unit: '月', val: 12 }],
    compute: (v) => { const P = N(v.p), fee = N(v.fee), n = N(v.n), r = N(v.r) / 100 / 12; const pay = (P - fee) * r / (1 - Math.pow(1 + r, -n)); const apr = (Math.pow(pay / (P - fee), 12) - 1) * 100; return [['实际月供', money(pay), '元'], ['实际年化(APR)', apr.toFixed(2), '%']]; } });

  /* ---------- 财务：投资 / 退休 ---------- */
  mkCalc({ id: 'retirement', icon: '🌅', name: '退休金测算', desc: '估算退休时累计资产', keywords: 'retirement 退休 养老金 储蓄',
    fields: [{ k: 'ca', label: '当前年龄', val: 30 }, { k: 'ra', label: '退休年龄', val: 60 }, { k: 'bal', label: '当前储蓄', unit: '元', val: 100000 }, { k: 'm', label: '每月定投', unit: '元', val: 3000 }, { k: 'r', label: '年化收益', unit: '%', val: 6 }],
    compute: (v) => { const yrs = Math.max(0, N(v.ra) - N(v.ca)); const fv = fvWithContrib(N(v.bal), N(v.m), yrs, N(v.r)); return [['退休时资产', money(fv), '元'], ['累计定投', money(N(v.m) * 12 * yrs), '元'], ['累计收益', money(fv - N(v.bal) - N(v.m) * 12 * yrs), '元']]; } });

  mkCalc({ id: 'k401', icon: '🪙', name: '401k/年金测算', desc: '含雇主配比的退休账户积累', keywords: '401k 年金 配比 退休',
    fields: [{ k: 'sal', label: '年薪', unit: '元', val: 300000 }, { k: 'c', label: '个人缴存比例', unit: '%', val: 6 }, { k: 'em', label: '雇主配比上限', unit: '%', val: 4 }, { k: 'ca', label: '当前年龄', val: 30 }, { k: 'ra', label: '退休年龄', val: 60 }, { k: 'bal', label: '当前余额', unit: '元', val: 50000 }, { k: 'r', label: '年化收益', unit: '%', val: 6 }],
    compute: (v) => { const yrs = Math.max(0, N(v.ra) - N(v.ca)); const mc = N(v.sal) / 12 * N(v.c) / 100; const me = N(v.sal) / 12 * Math.min(N(v.em), N(v.c)) / 100; const fv = fvWithContrib(N(v.bal), mc + me, yrs, N(v.r)); return [['退休时账户', money(fv), '元'], ['每月个人缴存', money(mc), '元'], ['每月雇主配比', money(me), '元']]; } });

  mkCalc({ id: 'investment', icon: '📊', name: '投资复利测算', desc: '本金 + 每月定投的未来值', keywords: 'investment 投资 复利 定投',
    fields: [{ k: 'p', label: '初始本金', unit: '元', val: 50000 }, { k: 'm', label: '每月定投', unit: '元', val: 2000 }, { k: 'y', label: '投资年限', val: 10 }, { k: 'r', label: '年化收益', unit: '%', val: 7 }],
    compute: (v) => { const fv = fvWithContrib(N(v.p), N(v.m), N(v.y), N(v.r)); const inv = N(v.p) + N(v.m) * 12 * N(v.y); return [['未来价值', money(fv), '元'], ['累计投入', money(inv), '元'], ['累计收益', money(fv - inv), '元']]; } });

  mkCalc({ id: 'future-value', icon: '⏳', name: '复利终值', desc: '单笔本金按复利增长到未来值', keywords: 'future value 终值 复利',
    fields: [{ k: 'p', label: '本金', unit: '元', val: 100000 }, { k: 'y', label: '年限', val: 10 }, { k: 'r', label: '年化', unit: '%', val: 5 }],
    compute: (v) => { const fv = N(v.p) * Math.pow(1 + N(v.r) / 100, N(v.y)); return [['未来值', money(fv), '元'], ['利息收益', money(fv - N(v.p)), '元']]; } });

  mkCalc({ id: 'present-value', icon: '💡', name: '现值计算', desc: '未来一笔钱的当前价值', keywords: 'present value 现值 pv',
    fields: [{ k: 'fv', label: '未来金额', unit: '元', val: 200000 }, { k: 'y', label: '年限', val: 5 }, { k: 'r', label: '贴现率', unit: '%', val: 5 }],
    compute: (v) => { const pv = N(v.fv) / Math.pow(1 + N(v.r) / 100, N(v.y)); return [['现值', money(pv), '元'], ['贴现额', money(N(v.fv) - pv), '元']]; } });

  mkCalc({ id: 'annuity', icon: '🔁', name: '年金终值', desc: '每期等额缴存的年金终值', keywords: 'annuity 年金 终值',
    fields: [{ k: 'pmt', label: '每期金额', unit: '元', val: 1000 }, { k: 'n', label: '期数', val: 120 }, { k: 'r', label: '每期利率', unit: '%', val: 0.5 }],
    compute: (v) => { const r = N(v.r) / 100; const fv = r === 0 ? N(v.pmt) * N(v.n) : N(v.pmt) * (Math.pow(1 + r, N(v.n)) - 1) / r; return [['年金终值', money(fv), '元'], ['累计缴存', money(N(v.pmt) * N(v.n)), '元']]; } });

  mkCalc({ id: 'simple-interest', icon: '🧮', name: '单利计算', desc: '本金按单利计息', keywords: 'simple interest 单利',
    fields: [{ k: 'p', label: '本金', unit: '元', val: 10000 }, { k: 'r', label: '年利率', unit: '%', val: 5 }, { k: 'y', label: '年限', val: 3 }],
    compute: (v) => { const si = N(v.p) * N(v.r) / 100 * N(v.y); return [['利息', money(si), '元'], ['本息和', money(N(v.p) + si), '元']]; } });

  mkCalc({ id: 'cd', icon: '🏦', name: '定期存款收益', desc: '整存整取到期本息（按月复利）', keywords: 'cd 定期 存款 利息',
    fields: [{ k: 'p', label: '本金', unit: '元', val: 100000 }, { k: 'r', label: '年利率', unit: '%', val: 2 }, { k: 'n', label: '存期', unit: '月', val: 12 }],
    compute: (v) => { const fv = N(v.p) * Math.pow(1 + N(v.r) / 100 / 12, N(v.n)); return [['到期本息', money(fv), '元'], ['利息', money(fv - N(v.p)), '元']]; } });

  mkCalc({ id: 'inflation', icon: '🔥', name: '通胀计算器', desc: '按通胀率折算未来购买力', keywords: 'inflation 通胀 购买力',
    fields: [{ k: 'a', label: '当前金额', unit: '元', val: 10000 }, { k: 'r', label: '年通胀率', unit: '%', val: 3 }, { k: 'y', label: '年数', val: 20 }],
    compute: (v) => { const f = N(v.a) * Math.pow(1 + N(v.r) / 100, N(v.y)); return [['未来名义金额', money(f), '元'], ['购买力缩水', money(f - N(v.a)), '元']]; } });

  mkCalc({ id: 'fire', icon: '🔥', name: 'FIRE 早退测算', desc: '财务独立所需资产与达成年限', keywords: 'fire 财务自由 早退 储蓄',
    fields: [{ k: 'exp', label: '年支出', unit: '元', val: 120000 }, { k: 'wr', label: '提取率', unit: '%', val: 4 }, { k: 'bal', label: '当前资产', unit: '元', val: 200000 }, { k: 'save', label: '年储蓄', unit: '元', val: 100000 }, { k: 'r', label: '年化收益', unit: '%', val: 6 }],
    compute: (v) => { const target = N(v.exp) / (N(v.wr) / 100); let bal = N(v.bal), yrs = 0; while (bal < target && yrs < 200) { bal = bal * (1 + N(v.r) / 100) + N(v.save); yrs++; } return [['目标资产', money(target), '元'], ['达成年限', yrs, '年'], ['进度', (N(v.bal) / target * 100).toFixed(1), '%']]; } });

  /* ---------- 财务：税 / 费 / 盈亏 ---------- */
  mkCalc({ id: 'sales-tax', icon: '🧾', name: '消费税计算', desc: '按金额与税率算税额', keywords: 'sales tax 消费税 税额',
    fields: [{ k: 'a', label: '金额', unit: '元', val: 100 }, { k: 'r', label: '税率', unit: '%', val: 13 }],
    compute: (v) => { const t = N(v.a) * N(v.r) / 100; return [['税额', money(t), '元'], ['含税总价', money(N(v.a) + t), '元']]; } });

  mkCalc({ id: 'vat', icon: '🧾', name: '增值税计算', desc: '不含税金额与增值税互算', keywords: 'vat 增值税 含税',
    fields: [{ k: 'a', label: '不含税金额', unit: '元', val: 1000 }, { k: 'r', label: '税率', unit: '%', val: 13 }],
    compute: (v) => { const t = N(v.a) * N(v.r) / 100; return [['增值税额', money(t), '元'], ['含税价', money(N(v.a) + t), '元']]; } });

  mkCalc({ id: 'capital-gains', icon: '📉', name: '资本利得税', desc: '按收益与税率算应纳税额', keywords: 'capital gains 资本利得 税',
    fields: [{ k: 'g', label: '收益额', unit: '元', val: 50000 }, { k: 'r', label: '税率', unit: '%', val: 20 }],
    compute: (v) => { const t = N(v.g) * N(v.r) / 100; return [['应纳税额', money(t), '元'], ['税后收益', money(N(v.g) - t), '元']]; } });

  mkCalc({ id: 'income-tax', icon: '💰', name: '累进个税估算', desc: '按示例级距估算（仅供演示，非真实税表）', keywords: 'income tax 个税 所得税',
    note: '采用示例级距，仅作演示，请以当地实际税表为准。',
    fields: [{ k: 'inc', label: '税前月收入', unit: '元', val: 30000 }],
    compute: (v) => { const inc = N(v.inc) * 12; const brackets = [[36000, 0.03], [144000, 0.1], [300000, 0.2], [420000, 0.25], [660000, 0.3], [960000, 0.35], [Infinity, 0.45]]; let taxable = Math.max(0, inc - 60000), tax = 0, prev = 0; for (const [cap, rt] of brackets) { if (taxable <= prev) break; const slice = Math.min(taxable, cap) - prev; tax += slice * rt; prev = cap; } const monthly = tax / 12; return [['全年应纳税额', money(tax), '元'], ['每月税额', money(monthly), '元'], ['税后月收入', money(N(v.inc) - monthly), '元']]; } });

  mkCalc({ id: 'paycheck', icon: '🧮', name: '工资到手计算', desc: '税前月薪估算到手金额', keywords: 'paycheck 工资 到手 税后',
    fields: [{ k: 'g', label: '税前月薪', unit: '元', val: 30000 }, { k: 'tr', label: '估算税率', unit: '%', val: 20 }],
    compute: (v) => { const net = N(v.g) * (1 - N(v.tr) / 100); return [['到手月薪', money(net), '元'], ['月缴税(估算)', money(N(v.g) - net), '元'], ['年薪(税前)', money(N(v.g) * 12), '元']]; } });

  mkCalc({ id: 'commission', icon: '🤝', name: '提成计算', desc: '按销售额与提成点算提成', keywords: 'commission 提成 佣金',
    fields: [{ k: 's', label: '销售额', unit: '元', val: 100000 }, { k: 'r', label: '提成点', unit: '%', val: 5 }],
    compute: (v) => { const c = N(v.s) * N(v.r) / 100; return [['提成金额', money(c), '元']]; } });

  mkCalc({ id: 'break-even', icon: '⚖️', name: '盈亏平衡', desc: '计算保本销量与保本收入', keywords: 'break even 盈亏平衡 保本',
    fields: [{ k: 'f', label: '固定成本', unit: '元', val: 50000 }, { k: 'p', label: '单价', unit: '元', val: 100 }, { k: 'vc', label: '单位变动成本', unit: '元', val: 60 }],
    compute: (v) => { const u = N(v.f) / (N(v.p) - N(v.vc)); return [['保本销量', Math.ceil(u), '件'], ['保本收入', money(u * N(v.p)), '元']]; } });

  mkCalc({ id: 'depreciation', icon: '📉', name: '直线折旧', desc: '固定资产年均折旧额', keywords: 'depreciation 折旧 资产',
    fields: [{ k: 'c', label: '原值', unit: '元', val: 100000 }, { k: 's', label: '残值', unit: '元', val: 10000 }, { k: 'y', label: '使用年限', val: 5 }],
    compute: (v) => { const d = (N(v.c) - N(v.s)) / N(v.y); return [['年折旧额', money(d), '元'], ['月折旧额', money(d / 12), '元']]; } });

  mkCalc({ id: 'net-worth', icon: '🏦', name: '净资产计算', desc: '资产减负债', keywords: 'net worth 净资产 资产',
    fields: [{ k: 'a', label: '总资产', unit: '元', val: 2000000 }, { k: 'l', label: '总负债', unit: '元', val: 800000 }],
    compute: (v) => { const nw = N(v.a) - N(v.l); return [['净资产', money(nw), '元'], ['负债率', (N(v.l) / N(v.a) * 100).toFixed(1), '%']]; } });

  mkCalc({ id: 'stock-profit', icon: '📈', name: '股票收益', desc: '按买卖价与数量算盈亏', keywords: 'stock profit 股票 收益 盈亏',
    fields: [{ k: 'q', label: '股数', val: 1000 }, { k: 'b', label: '买入价', unit: '元', val: 10 }, { k: 's', label: '卖出价', unit: '元', val: 12 }, { k: 'fee', label: '手续费', unit: '元', val: 10 }],
    compute: (v) => { const p = (N(v.s) - N(v.b)) * N(v.q) - N(v.fee) * 2; return [['盈亏', money(p), '元'], ['收益率', ((N(v.s) - N(v.b)) / N(v.b) * 100).toFixed(2), '%']]; } });

  mkCalc({ id: 'dividend', icon: '💸', name: '股息收益', desc: '估算年度股息与股息率', keywords: 'dividend 股息 分红 收益率',
    fields: [{ k: 'q', label: '持股数', val: 1000 }, { k: 'dps', label: '每股年股息', unit: '元', val: 0.5 }, { k: 'price', label: '现价', unit: '元', val: 10 }],
    compute: (v) => { const inc = N(v.q) * N(v.dps); const y = N(v.dps) / N(v.price) * 100; return [['年股息', money(inc), '元'], ['股息率', y.toFixed(2), '%']]; } });

  mkCalc({ id: 'electricity', icon: '⚡', name: '电费估算', desc: '按功率与使用时间算电费', keywords: 'electricity 电费 功率 能耗',
    fields: [{ k: 'w', label: '功率', unit: 'W', val: 1500 }, { k: 'h', label: '每天小时', val: 2 }, { k: 'd', label: '天数', val: 30 }, { k: 'price', label: '电价', unit: '元/kWh', val: 0.6 }],
    compute: (v) => { const kwh = N(v.w) / 1000 * N(v.h) * N(v.d); return [['耗电量', kwh.toFixed(1), 'kWh'], ['电费', money(kwh * N(v.price)), '元']]; } });

  mkCalc({ id: 'life-insurance', icon: '🛡️', name: '寿险保额', desc: '按收入倍数估算保障需求', keywords: 'life insurance 寿险 保额',
    fields: [{ k: 'inc', label: '年收入', unit: '元', val: 300000 }, { k: 'mult', label: '保障倍数', val: 10 }],
    compute: (v) => { return [['建议保额', money(N(v.inc) * N(v.mult)), '元']]; } });

  mkCalc({ id: 'debt-to-income', icon: '📊', name: '负债收入比', desc: '月度债务占收入比例', keywords: 'dti 负债率 债务',
    fields: [{ k: 'd', label: '月债务支出', unit: '元', val: 8000 }, { k: 'i', label: '月收入', unit: '元', val: 30000 }],
    compute: (v) => { const d = N(v.d) / N(v.i) * 100; return [['负债收入比', d.toFixed(1), '%'], ['风险', d > 43 ? '偏高' : '正常']]; } });

  mkCalc({ id: 'grade', icon: '🎓', name: '成绩等级', desc: '百分制分数转等级与绩点', keywords: 'grade 成绩 等级 绩点',
    fields: [{ k: 's', label: '分数', val: 85 }],
    compute: (v) => { const s = N(v.s); const g = s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : 'F'; const gp = s >= 90 ? 4 : s >= 80 ? 3 : s >= 70 ? 2 : s >= 60 ? 1 : 0; return [['等级', g], ['绩点(GPA)', gp.toFixed(1)]]; } });

  /* ---------- 健康 ---------- */
  mkCalc({ id: 'pace', icon: '🏃', name: '配速计算', desc: '跑步配速与速度', keywords: 'pace 配速 跑步 速度',
    fields: [{ k: 'd', label: '距离', unit: 'km', val: 5 }, { k: 't', label: '用时', unit: '分钟', val: 30 }],
    compute: (v) => { const pace = N(v.t) / N(v.d); const sp = N(v.d) / (N(v.t) / 60); return [['配速', pace.toFixed(2), '分/km'], ['速度', sp.toFixed(2), 'km/h']]; } });

  mkCalc({ id: 'waist-hip', icon: '⚖️', name: '腰臀比', desc: '评估中心性肥胖风险', keywords: 'waist hip 腰臀比 肥胖',
    fields: [{ k: 'w', label: '腰围', unit: 'cm', val: 85 }, { k: 'h', label: '臀围', unit: 'cm', val: 100 }, { k: 'g', label: '性别', type: 'select', val: 'm', opts: [{ v: 'm', t: '男' }, { v: 'f', t: '女' }] }],
    compute: (v) => { const r = N(v.w) / N(v.h); const hi = v.g === 'm' ? r > 0.9 : r > 0.85; return [['腰臀比', r.toFixed(2)], ['风险提示', hi ? '偏高，注意' : '正常']]; } });

  mkCalc({ id: 'water', icon: '💧', name: '饮水量', desc: '每日建议饮水量', keywords: 'water 饮水 水量',
    fields: [{ k: 'w', label: '体重', unit: 'kg', val: 65 }, { k: 'a', label: '活动量', type: 'select', val: '1', opts: [{ v: '0.8', t: '久坐' }, { v: '1', t: '中等' }, { v: '1.2', t: '高强度' }] }],
    compute: (v) => { const l = N(v.w) * 0.033 * N(v.a); return [['建议饮水', l.toFixed(2), '升/天']]; } });

  mkCalc({ id: 'calorie-deficit', icon: '🔥', name: '减重热量缺口', desc: '按目标体重与周期算每日缺口', keywords: 'calorie deficit 减重 热量',
    fields: [{ k: 'cw', label: '当前体重', unit: 'kg', val: 80 }, { k: 'gw', label: '目标体重', unit: 'kg', val: 70 }, { k: 'wk', label: '周期', unit: '周', val: 12 }],
    compute: (v) => { const tot = (N(v.cw) - N(v.gw)) * 7700; const day = tot / (N(v.wk) * 7); return [['需减少热量', Math.round(tot).toLocaleString(), 'kcal'], ['每日缺口', Math.round(day).toLocaleString(), 'kcal/天']]; } });

  mkCalc({ id: 'protein', icon: '🥚', name: '蛋白质需求', desc: '按体重与运动量估算每日蛋白', keywords: 'protein 蛋白质 营养',
    fields: [{ k: 'w', label: '体重', unit: 'kg', val: 70 }, { k: 'a', label: '强度', type: 'select', val: '1.6', opts: [{ v: '1.2', t: '久坐' }, { v: '1.6', t: '一般运动' }, { v: '2', t: '力量训练' }, { v: '2.2', t: '高强度' }] }],
    compute: (v) => { const g = N(v.w) * N(v.a); return [['每日蛋白质', g.toFixed(0), 'g']]; } });

  mkCalc({ id: 'ideal-weight', icon: '⚖️', name: '理想体重', desc: '按身高与性别估算（多种公式）', keywords: 'ideal weight 理想体重',
    fields: [{ k: 'h', label: '身高', unit: 'cm', val: 175 }, { k: 'g', label: '性别', type: 'select', val: 'm', opts: [{ v: 'm', t: '男' }, { v: 'f', t: '女' }] }],
    compute: (v) => { const h = N(v.h) / 100; const bmiW = 22 * h * h; const rob = v.g === 'm' ? 50 + 0.91 * (N(v.h) - 152.4) : 45.5 + 0.91 * (N(v.h) - 152.4); return [['BMI 标准(22)', bmiW.toFixed(1), 'kg'], ['Robinson 公式', rob.toFixed(1), 'kg']]; } });

  mkCalc({ id: 'one-rep-max', icon: '🏋️', name: '单次最大重量', desc: '按重量与次数估算 1RM（Epley）', keywords: '1rm one rep max 力量',
    fields: [{ k: 'w', label: '重量', unit: 'kg', val: 100 }, { k: 'r', label: '次数', val: 5 }],
    compute: (v) => { const rm = N(v.w) * (1 + N(v.r) / 30); return [['估算 1RM', rm.toFixed(1), 'kg'], ['训练建议 80%', (rm * 0.8).toFixed(1), 'kg']]; } });

  mkCalc({ id: 'heart-rate', icon: '❤️', name: '心率区间', desc: '按年龄计算最大心率与训练区间', keywords: 'heart rate 心率 区间',
    fields: [{ k: 'age', label: '年龄', val: 30 }],
    compute: (v) => { const max = 220 - N(v.age); const z = (lo, hi) => `${Math.round(max * lo)}-${Math.round(max * hi)}`; return [['最大心率', max, 'bpm'], ['热身 50-60%', z(0.5, 0.6)], ['燃脂 60-70%', z(0.6, 0.7)], ['有氧 70-80%', z(0.7, 0.8)], ['无氧 80-90%', z(0.8, 0.9)]]; } });

  mkCalc({ id: 'keto', icon: '🥑', name: '生酮饮食配比', desc: '按热量算生酮宏量营养', keywords: 'keto 生酮 宏量 饮食',
    fields: [{ k: 'cal', label: '每日热量', unit: 'kcal', val: 2000 }],
    compute: (v) => { const c = N(v.cal); const fat = c * 0.72 / 9, pro = c * 0.23 / 4, carb = c * 0.05 / 4; return [['脂肪', fat.toFixed(0), 'g'], ['蛋白质', pro.toFixed(0), 'g'], ['碳水', carb.toFixed(0), 'g']]; } });

  mkCalc({ id: 'calorie-burn', icon: '🔥', name: '运动消耗', desc: '按 MET 与体重估算消耗', keywords: 'calorie burn 运动 消耗',
    fields: [{ k: 'w', label: '体重', unit: 'kg', val: 65 }, { k: 'met', label: 'MET 强度', val: 7 }, { k: 'min', label: '时长', unit: '分钟', val: 30 }],
    compute: (v) => { const k = N(v.met) * N(v.w) * N(v.min) / 60; return [['消耗热量', k.toFixed(0), 'kcal']]; } });

  mkCalc({ id: 'walking-calorie', icon: '🚶', name: '步行消耗', desc: '按步数与体重估算消耗', keywords: 'walking 步行 消耗 步数',
    fields: [{ k: 'steps', label: '步数', val: 10000 }, { k: 'w', label: '体重', unit: 'kg', val: 65 }],
    compute: (v) => { const k = N(v.steps) * 0.04 * (N(v.w) / 70) * 1.4; return [['估算消耗', k.toFixed(0), 'kcal']]; } });

  mkCalc({ id: 'dog-age', icon: '🐶', name: '狗龄换算', desc: '狗龄换算人类年龄', keywords: 'dog age 狗龄 宠物',
    fields: [{ k: 'y', label: '狗龄', unit: '年', val: 3 }],
    compute: (v) => { const y = N(v.y); const h = y <= 1 ? 15 : y === 2 ? 24 : 24 + (y - 2) * 5; return [['人类年龄(估)', h, '岁']]; } });

  mkCalc({ id: 'blood-alcohol', icon: '🍺', name: '血液酒精估算', desc: '粗略估算 BAC（Widmark）', keywords: 'bac 酒精 血液',
    note: '仅为粗略估算，请勿用于判断是否可驾驶。',
    fields: [{ k: 'drinks', label: '标准杯数', val: 3 }, { k: 'w', label: '体重', unit: 'kg', val: 70 }, { k: 'h', label: '经过小时', val: 2 }, { k: 'g', label: '性别', type: 'select', val: 'm', opts: [{ v: 'm', t: '男' }, { v: 'f', t: '女' }] }],
    compute: (v) => { const bw = v.g === 'm' ? 0.68 : 0.55; const bac = (N(v.drinks) * 14 * 1000) / (N(v.w) * 1000 * bw) * 100 - 0.015 * N(v.h); return [['估算 BAC', Math.max(0, bac).toFixed(2), '‰'], ['是否超标', bac > 0.2 ? '超标' : '未超标(估)']]; } });

  mkCalc({ id: 'square-footage', icon: '📐', name: '面积计算', desc: '矩形面积（平方英尺）', keywords: 'square footage 面积 平方英尺',
    fields: [{ k: 'l', label: '长', unit: 'ft', val: 20 }, { k: 'w', label: '宽', unit: 'ft', val: 15 }],
    compute: (v) => { return [['面积', N(v.l) * N(v.w), 'ft²']]; } });

  mkCalc({ id: 'concrete', icon: '🧱', name: '混凝土用量', desc: '按尺寸算混凝土方量', keywords: 'concrete 混凝土 方量',
    fields: [{ k: 'l', label: '长', unit: 'ft', val: 10 }, { k: 'w', label: '宽', unit: 'ft', val: 10 }, { k: 't', label: '厚', unit: 'in', val: 4 }],
    compute: (v) => { const cy = N(v.l) * N(v.w) * (N(v.t) / 12) / 27; return [['混凝土', cy.toFixed(2), '立方码']]; } });

  mkCalc({ id: 'paint', icon: '🎨', name: '油漆用量', desc: '按面积与覆盖率算桶数', keywords: 'paint 油漆 用量',
    fields: [{ k: 'a', label: '面积', unit: 'm²', val: 100 }, { k: 'cov', label: '每升可刷', unit: 'm²/L', val: 10 }],
    compute: (v) => { const g = N(v.a) / N(v.cov); return [['需油漆', g.toFixed(1), '升'], ['整桶(5L)', Math.ceil(g / 5), '桶']]; } });

  mkCalc({ id: 'tile', icon: '🔲', name: '瓷砖用量', desc: '按面积与砖尺寸算块数', keywords: 'tile 瓷砖 用量',
    fields: [{ k: 'a', label: '面积', unit: 'm²', val: 20 }, { k: 's', label: '砖边长', unit: 'cm', val: 60 }],
    compute: (v) => { const one = N(v.s) / 100 * (N(v.s) / 100); const n = N(v.a) / one * 1.1; return [['需瓷砖', Math.ceil(n), '块(含损耗)']]; } });

  mkCalc({ id: 'ohms', icon: '🔌', name: '欧姆定律', desc: '已知两项求第三项', keywords: 'ohm 欧姆 电压 电流',
    fields: [{ k: 'v', label: '电压 V (留空则求)', val: 12 }, { k: 'i', label: '电流 I (留空则求)', val: '' }, { k: 'r', label: '电阻 R (留空则求)', val: 4 }],
    compute: (v) => { const V = v.v === '' ? null : N(v.v), I = v.i === '' ? null : N(v.i), R = v.r === '' ? null : N(v.r); if (V != null && I != null) return [['电阻 R', (V / I).toFixed(2), 'Ω']]; if (V != null && R != null) return [['电流 I', (V / R).toFixed(2), 'A']]; if (I != null && R != null) return [['电压 V', (I * R).toFixed(2), 'V']]; return [['请至少填两项', '']]; } });

  /* ---------- 自定义（日期 / 表格 / 对比） ---------- */
  // 年龄计算
  T.register({ id: 'age', cat: 'calc', icon: '🎂', name: '年龄计算', desc: '按出生日期算精确年龄', keywords: 'age 年龄 生日',
    render: () => `<div class="tool-panel"><h2>🎂 年龄计算</h2><p class="t-sub">选择出生日期，计算精确年龄。</p>
      <div class="field"><label>出生日期</label><input type="date" id="age-bd"></div>
      <div class="grid-3" id="age-out"></div></div>`,
    init: (r) => {
      const go = () => { const bd = r.querySelector('#age-bd').value; const out = r.querySelector('#age-out'); if (!bd) { out.innerHTML = '<div class="muted">请选择日期</div>'; return; } const b = new Date(bd), n = new Date(); let y = n.getFullYear() - b.getFullYear(), m = n.getMonth() - b.getMonth(), d = n.getDate() - b.getDate(); if (m < 0 || (m === 0 && d < 0)) y--; if (d < 0) { m--; d += new Date(n.getFullYear(), n.getMonth(), 0).getDate(); } if (m < 0) { y--; m += 12; } const totalDays = Math.floor((n - b) / 86400000); out.innerHTML = [['周岁', y + ' 岁 ' + m + ' 月 ' + d + ' 天'], ['总天数', totalDays.toLocaleString(), '天'], ['出生年', b.getFullYear()]].map(([k, v]) => `<div class="tool-card" style="min-height:auto"><div class="t-desc">${k}</div><div class="result-num" style="font-size:18px">${v}</div></div>`).join(''); };
      r.querySelector('#age-bd').addEventListener('change', go); go();
    } });

  // 孕期
  T.register({ id: 'pregnancy', cat: 'calc', icon: '🤰', name: '预产期计算', desc: '按末次月经推算预产期与孕周', keywords: 'pregnancy 孕期 预产期',
    render: () => `<div class="tool-panel"><h2>🤰 预产期计算</h2><p class="t-sub">输入末次月经(LMP)日期。</p>
      <div class="field"><label>末次月经日期</label><input type="date" id="pg-lmp"></div>
      <div class="grid-3" id="pg-out"></div></div>`,
    init: (r) => {
      const go = () => { const lmp = r.querySelector('#pg-lmp').value; const out = r.querySelector('#pg-out'); if (!lmp) { out.innerHTML = ''; return; } const b = new Date(lmp); const due = new Date(b.getTime() + 280 * 86400000); const now = new Date(); const days = Math.floor((now - b) / 86400000); const wk = Math.floor(days / 7); const out2 = []; out2.push(['预产期', due.toISOString().slice(0, 10)]); out2.push(['当前孕周', wk + ' 周 + ' + (days % 7) + ' 天']); out2.push(['已过去', days, '天']); out.innerHTML = out2.map(([k, v]) => `<div class="tool-card" style="min-height:auto"><div class="t-desc">${k}</div><div class="result-num" style="font-size:18px">${v}</div></div>`).join(''); };
      r.querySelector('#pg-lmp').addEventListener('change', go); go();
    } });

  // 排卵期 / 经期
  T.register({ id: 'ovulation', cat: 'calc', icon: '🌸', name: '排卵期计算', desc: '按末次月经与周期推算易孕窗口', keywords: 'ovulation 排卵 经期 易孕',
    render: () => `<div class="tool-panel"><h2>🌸 排卵期 / 经期计算</h2><p class="t-sub">输入末次月经与周期长度。</p>
      <div class="row"><div class="field"><label>末次月经</label><input type="date" id="ov-lmp"></div>
      <div class="field"><label>周期长度(天)</label><input type="number" id="ov-c" value="28"></div></div>
      <div class="grid-3" id="ov-out"></div></div>`,
    init: (r) => {
      const go = () => { const lmp = r.querySelector('#ov-lmp').value, c = N(r.querySelector('#ov-c').value); const out = r.querySelector('#ov-out'); if (!lmp) { out.innerHTML = ''; return; } const b = new Date(lmp); const ov = new Date(b.getTime() + (c - 14) * 86400000); const fertS = new Date(ov.getTime() - 4 * 86400000); const fertE = new Date(ov.getTime() + 1 * 86400000); const next = new Date(b.getTime() + c * 86400000); out.innerHTML = [['排卵日', ov.toISOString().slice(0, 10)], ['易孕窗口', fertS.toISOString().slice(0, 10) + ' ~ ' + fertE.toISOString().slice(0, 10)], ['下次经期', next.toISOString().slice(0, 10)]].map(([k, v]) => `<div class="tool-card" style="min-height:auto"><div class="t-desc">${k}</div><div class="result-num" style="font-size:16px">${v}</div></div>`).join(''); };
      r.querySelector('#ov-lmp').addEventListener('change', go); r.querySelector('#ov-c').addEventListener('input', go); go();
    } });

  // 睡眠
  T.register({ id: 'sleep', cat: 'calc', icon: '😴', name: '睡眠时钟', desc: '按起床时间反推入睡时间', keywords: 'sleep 睡眠 入睡 起床',
    render: () => `<div class="tool-panel"><h2>😴 睡眠时钟</h2><p class="t-sub">选择起床时间与所需睡眠时长。</p>
      <div class="row"><div class="field"><label>起床时间</label><input type="time" id="sl-wake" value="07:00"></div>
      <div class="field"><label>所需睡眠(小时)</label><input type="number" id="sl-h" value="8"></div></div>
      <div class="field"><label>建议入睡时间</label><div class="out" id="sl-out"></div></div></div>`,
    init: (r) => {
      const go = () => { const [hh, mm] = r.querySelector('#sl-wake').value.split(':').map(Number); const h = N(r.querySelector('#sl-h').value); let t = hh * 60 + mm - h * 60; if (t < 0) t += 1440; const o = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); r.querySelector('#sl-out').textContent = o; };
      r.querySelector('#sl-wake').addEventListener('input', go); r.querySelector('#sl-h').addEventListener('input', go); go();
    } });

  // GPA
  T.register({ id: 'gpa', cat: 'calc', icon: '🎓', name: 'GPA 计算', desc: '按课程学分与绩点算总 GPA', keywords: 'gpa 绩点 成绩',
    render: () => `<div class="tool-panel"><h2>🎓 GPA 计算</h2><p class="t-sub">逐行添加课程（学分、绩点 0-4）。</p>
      <div id="gpa-rows"></div>
      <div class="btn-row"><button class="btn secondary" id="gpa-add">+ 添加课程</button><button class="btn" id="gpa-go">计算</button></div>
      <div class="out" id="gpa-out"></div></div>`,
    init: (r) => {
      const rows = r.querySelector('#gpa-rows');
      const add = () => { const d = document.createElement('div'); d.className = 'row'; d.style.marginBottom = '8px'; d.innerHTML = `<div class="field" style="margin:0"><input type="number" placeholder="学分" class="g-credit"></div><div class="field" style="margin:0"><input type="number" placeholder="绩点 0-4" step="0.1" class="g-grade"></div>`; rows.appendChild(d); };
      r.querySelector('#gpa-add').onclick = add; add(); add();
      r.querySelector('#gpa-go').onclick = () => { let cp = 0, gp = 0; rows.querySelectorAll('.row').forEach(d => { const c = N(d.querySelector('.g-credit').value), g = N(d.querySelector('.g-grade').value); cp += c; gp += c * g; }); r.querySelector('#gpa-out').textContent = cp ? '总 GPA：' + (gp / cp).toFixed(2) + '（总学分 ' + cp + '）' : '请填写课程'; };
    } });

  // 还款计划表
  T.register({ id: 'amortization', cat: 'calc', icon: '📑', name: '还款计划表', desc: '生成逐期还款明细（等额本息）', keywords: 'amortization 还款 计划 明细',
    render: () => `<div class="tool-panel"><h2>📑 还款计划表</h2><p class="t-sub">生成等额本息逐期本金/利息明细。</p>
      <div class="grid-2"><div class="field"><label>贷款本金(元)</label><input type="number" id="am-p" value="500000"></div>
      <div class="field"><label>年利率(%)</label><input type="number" id="am-r" value="4.9" step="0.01"></div>
      <div class="field"><label>期限(月)</label><input type="number" id="am-n" value="240"></div></div>
      <div class="btn-row"><button class="btn" id="am-go">生成</button></div>
      <div class="out" id="am-out" style="max-height:360px;overflow:auto"></div></div>`,
    init: (r) => {
      const go = () => { const P = N(r.querySelector('#am-p').value), a = N(r.querySelector('#am-r').value), n = N(r.querySelector('#am-n').value); const rate = a / 100 / 12; const pay = rate === 0 ? P / n : P * rate / (1 - Math.pow(1 + rate, -n)); let bal = P, html = '期次\t月供\t本金\t利息\t剩余本金\n'; for (let i = 1; i <= n; i++) { const intr = bal * rate, prin = pay - intr; bal -= prin; html += i + '\t' + pay.toFixed(2) + '\t' + prin.toFixed(2) + '\t' + intr.toFixed(2) + '\t' + Math.max(0, bal).toFixed(2) + '\n'; } const box = r.querySelector('#am-out'); box.textContent = html; box.style.whiteSpace = 'pre'; box.style.fontSize = '12px'; };
      r.querySelector('#am-go').onclick = go; go();
    } });

  // 租 vs 买
  T.register({ id: 'rent-vs-buy', cat: 'calc', icon: '🏘️', name: '租买对比', desc: '对比租房与买房一段时间成本', keywords: 'rent buy 租房 买房 对比',
    render: () => `<div class="tool-panel"><h2>🏘️ 租买对比</h2><p class="t-sub">对比 N 年内的租房总成本与买房总成本。</p>
      <div class="grid-2"><div class="field"><label>房价(元)</label><input type="number" id="rb-price" value="3000000"></div>
      <div class="field"><label>首付比例(%)</label><input type="number" id="rb-dp" value="30"></div>
      <div class="field"><label>房贷年利率(%)</label><input type="number" id="rb-r" value="4.9" step="0.01"></div>
      <div class="field"><label>期限(年)</label><input type="number" id="rb-y" value="20"></div>
      <div class="field"><label>月租金(元)</label><input type="number" id="rb-rent" value="5000"></div>
      <div class="field"><label>房价年涨幅(%)</label><input type="number" id="rb-ap" value="3" step="0.1"></div></div>
      <div class="btn-row"><button class="btn" id="rb-go">对比</button></div>
      <div class="grid-2" id="rb-out"></div></div>`,
    init: (r) => {
      const go = () => { const price = N(r.querySelector('#rb-price').value), dpPct = N(r.querySelector('#rb-dp').value), a = N(r.querySelector('#rb-r').value), y = N(r.querySelector('#rb-y').value), rent = N(r.querySelector('#rb-rent').value), ap = N(r.querySelector('#rb-ap').value); const loan = price * (1 - dpPct / 100); const rate = a / 100 / 12, n = y * 12; const pay = loan * rate / (1 - Math.pow(1 + rate, -n)); const buyCost = price * dpPct / 100 + pay * n; const rentCost = rent * 12 * y; const sellValue = price * Math.pow(1 + ap / 100, y); const netBuy = sellValue - buyCost; const out = r.querySelector('#rb-out'); out.innerHTML = [['租房总成本', money(rentCost), '元'], ['买房总成本', money(buyCost), '元'], ['N 年后房产估值', money(sellValue), '元'], ['买房净权益(估)', money(netBuy), '元']].map(([k, v, u]) => `<div class="tool-card" style="min-height:auto"><div class="t-desc">${k}</div><div class="result-num" style="font-size:18px">${v}${u ? ' <small style="font-size:11px;color:var(--text-muted)">' + u + '</small>' : ''}</div></div>`).join(''); }; r.querySelector('#rb-go').onclick = go; go();
    } });
})();

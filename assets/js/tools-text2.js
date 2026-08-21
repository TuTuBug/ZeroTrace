/* ============ 文本工具补充 ============ */
(function () {
  const T = window.TB;

  // 字符计数（含字符频率）
  T.register({
    id: 'char-counter', cat: 'text', icon: '🔣', name: '字符计数',
    desc: '逐字符统计与频率分析', keywords: 'character count 字符 频率 计数',
    render: () => `
      <div class="tool-panel">
        <h2>🔣 字符计数</h2>
        <p class="t-sub">统计每个字符出现次数，并给出总数 / 行数。</p>
        <div class="field"><label>输入文本</label><textarea id="cc-in" style="min-height:160px" placeholder="在此输入…"></textarea></div>
        <div class="grid-3" id="cc-basic"></div>
        <div class="field"><label>字符频率（Top 20）</label><div class="out" id="cc-freq" style="max-height:240px;overflow:auto"></div></div>
      </div>`,
    init: (r) => {
      const inp = r.querySelector('#cc-in');
      const go = () => {
        const t = inp.value;
        const map = {}; for (const ch of t) map[ch] = (map[ch] || 0) + 1;
        const freq = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 20)
          .map(([c, n]) => (c === ' ' ? '␣' : c === '\n' ? '↵' : esc(c)) + ' : ' + n).join('\n');
        r.querySelector('#cc-basic').innerHTML = [['字符总数', t.length], ['行数', t === '' ? 0 : t.split('\n').length], ['去重字符', Object.keys(map).length]]
          .map(([k, v]) => `<div class="tool-card" style="min-height:auto"><div class="t-desc">${k}</div><div class="result-num">${v}</div></div>`).join('');
        r.querySelector('#cc-freq').textContent = freq || '—';
      };
      inp.addEventListener('input', go); go();
    }
  });

  // 文本重复
  T.register({
    id: 'text-repeat', cat: 'text', icon: '🔁', name: '文本重复',
    desc: '把文本重复指定次数/分隔符', keywords: 'repeat 重复 文本',
    render: () => `
      <div class="tool-panel">
        <h2>🔁 文本重复</h2>
        <p class="t-sub">将一段文本按次数与分隔符拼接。</p>
        <div class="field"><label>文本</label><input type="text" id="tr-in" value="你好"></div>
        <div class="row"><div class="field"><label>重复次数</label><input type="number" id="tr-n" value="5" min="1" max="1000"></div>
        <div class="field"><label>分隔符</label><input type="text" id="tr-sep" value=" "></div></div>
        <div class="btn-row"><button class="btn" id="tr-go">生成</button><button class="btn secondary" id="tr-copy">复制</button></div>
        <div class="field"><label>结果</label><textarea id="tr-out" readonly style="min-height:120px"></textarea></div>
      </div>`,
    init: (r) => {
      const go = () => { const t = r.querySelector('#tr-in').value, n = clamp(+r.querySelector('#tr-n').value || 1, 1, 1000), sep = r.querySelector('#tr-sep').value; r.querySelector('#tr-out').value = Array(n).fill(t).join(sep); };
      r.querySelector('#tr-go').onclick = go; r.querySelector('#tr-copy').onclick = () => copyText(r.querySelector('#tr-out').value, '已复制'); go();
    }
  });

  // 仿生阅读（bionic reading）
  T.register({
    id: 'bionic', cat: 'text', icon: '🧠', name: '仿生阅读',
    desc: '加粗每个单词首部，提升阅读速度', keywords: 'bionic reading 仿生 阅读 加粗',
    render: () => `
      <div class="tool-panel">
        <h2>🧠 仿生阅读（Bionic）</h2>
        <p class="t-sub">把每个单词的前半部分加粗，常用于速读。</p>
        <div class="field"><label>输入文本</label><textarea id="bn-in" style="min-height:120px">The quick brown fox jumps over the lazy dog.</textarea></div>
        <div class="field"><label>加粗比例</label><input type="range" id="bn-r" min="30" max="70" value="50"></div>
        <div class="field"><label>预览</label><div class="out" id="bn-out" style="font-size:17px;line-height:2"></div></div>
      </div>`,
    init: (r) => {
      const go = () => {
        const t = r.querySelector('#bn-in').value, ratio = +r.querySelector('#bn-r').value / 100;
        const html = esc(t).replace(/[A-Za-zÀ-ɏ]+/g, m => {
          const cut = Math.max(1, Math.ceil(m.length * ratio));
          return '<b>' + m.slice(0, cut) + '</b>' + m.slice(cut);
        });
        r.querySelector('#bn-out').innerHTML = html;
      };
      r.querySelector('#bn-in').addEventListener('input', go); r.querySelector('#bn-r').addEventListener('input', go); go();
    }
  });
})();

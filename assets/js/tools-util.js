/* ============ 实用工具 ============ */
(function () {
  const T = window.TB;
  const N = s => { const x = parseFloat(s); return isNaN(x) ? 0 : x; };

  // 随机数生成
  T.register({
    id: 'random', cat: 'util', icon: '🎲', name: '随机数生成',
    desc: '生成指定范围与个数的随机数', keywords: 'random 随机数 生成',
    render: () => `
      <div class="tool-panel">
        <h2>🎲 随机数生成</h2>
        <p class="t-sub">生成区间内的随机数，可去重。</p>
        <div class="row"><div class="field"><label>最小值</label><input type="number" id="rd-min" value="1"></div>
        <div class="field"><label>最大值</label><input type="number" id="rd-max" value="100"></div>
        <div class="field"><label>数量</label><input type="number" id="rd-n" value="5" min="1" max="500"></div></div>
        <div class="field"><label><input type="checkbox" id="rd-uniq"> 不重复</label></div>
        <div class="btn-row"><button class="btn" id="rd-go">生成</button><button class="btn secondary" id="rd-copy">复制</button></div>
        <div class="out" id="rd-out"></div>
      </div>`,
    init: (r) => {
      const go = () => {
        const min = Math.ceil(N(r.querySelector('#rd-min').value)), max = Math.floor(N(r.querySelector('#rd-max').value)), n = clamp(+r.querySelector('#rd-n').value || 1, 1, 500), uniq = r.querySelector('#rd-uniq').checked;
        let res = [];
        if (uniq) { const pool = []; for (let i = min; i <= max; i++) pool.push(i); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; } res = pool.slice(0, n); }
        else { for (let i = 0; i < n; i++) res.push(Math.floor(Math.random() * (max - min + 1)) + min); }
        r.querySelector('#rd-out').textContent = res.join(', ');
      };
      r.querySelectorAll('input').forEach(el => el.addEventListener('input', go)); r.querySelector('#rd-uniq').addEventListener('change', go); r.querySelector('#rd-go').onclick = go; r.querySelector('#rd-copy').onclick = () => copyText(r.querySelector('#rd-out').textContent, '已复制'); go();
    }
  });

  // 倒计时
  let _timer = null;
  T.register({
    id: 'countdown', cat: 'util', icon: '⏳', name: '倒计时',
    desc: '设定时长进行倒计时', keywords: 'countdown 倒计时 计时',
    render: () => `
      <div class="tool-panel">
        <h2>⏳ 倒计时</h2>
        <p class="t-sub">设定分钟数开始倒计时。</p>
        <div class="row"><div class="field"><label>分钟</label><input type="number" id="cd-min" value="5" min="0"></div>
        <div class="field"><label>秒</label><input type="number" id="cd-sec" value="0" min="0" max="59"></div></div>
        <div class="field"><div class="result-num" id="cd-disp" style="font-size:48px;text-align:center">05:00</div></div>
        <div class="btn-row" style="justify-content:center"><button class="btn" id="cd-start">开始</button><button class="btn secondary" id="cd-reset">重置</button></div>
      </div>`,
    init: (r) => {
      let remain = 0, running = false;
      const disp = r.querySelector('#cd-disp');
      const fmtT = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      const tick = () => { if (remain <= 0) { running = false; if (_timer) clearInterval(_timer); disp.textContent = '00:00'; toast('倒计时结束'); return; } remain--; disp.textContent = fmtT(remain); };
      const reset = () => { if (_timer) clearInterval(_timer); running = false; remain = N(r.querySelector('#cd-min').value) * 60 + N(r.querySelector('#cd-sec').value); disp.textContent = fmtT(remain); };
      r.querySelector('#cd-start').onclick = () => { if (running) return; if (remain <= 0) reset(); running = true; _timer = setInterval(tick, 1000); };
      r.querySelector('#cd-reset').onclick = reset; reset();
    }
  });

  // 秒表
  let _sw = null;
  T.register({
    id: 'stopwatch', cat: 'util', icon: '⏱️', name: '秒表',
    desc: '开始 / 暂停 / 计圈', keywords: 'stopwatch 秒表 计时',
    render: () => `
      <div class="tool-panel">
        <h2>⏱️ 秒表</h2>
        <div class="field"><div class="result-num" id="sw-disp" style="font-size:48px;text-align:center">00:00.00</div></div>
        <div class="btn-row" style="justify-content:center"><button class="btn" id="sw-start">开始</button><button class="btn secondary" id="sw-lap">计圈</button><button class="btn secondary" id="sw-reset">清零</button></div>
        <div class="out" id="sw-laps" style="min-height:20px"></div>
      </div>`,
    init: (r) => {
      let ms = 0, last = 0, running = false;
      const disp = r.querySelector('#sw-disp'), laps = r.querySelector('#sw-laps');
      const fmtT = m => { const m2 = Math.floor(m / 60000), s = Math.floor((m % 60000) / 1000), cs = Math.floor((m % 1000) / 10); return String(m2).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(cs).padStart(2, '0'); };
      const loop = () => { if (!running) return; ms += Date.now() - last; last = Date.now(); disp.textContent = fmtT(ms); _sw = requestAnimationFrame(loop); };
      r.querySelector('#sw-start').onclick = (e) => { running = !running; e.target.textContent = running ? '暂停' : '继续'; if (running) { last = Date.now(); loop(); } else if (_sw) cancelAnimationFrame(_sw); };
      r.querySelector('#sw-lap').onclick = () => { if (ms > 0) laps.textContent = (laps.textContent ? laps.textContent + '\n' : '') + '圈 ' + fmtT(ms); };
      r.querySelector('#sw-reset').onclick = () => { running = false; if (_sw) cancelAnimationFrame(_sw); ms = 0; disp.textContent = '00:00.00'; laps.textContent = ''; r.querySelector('#sw-start').textContent = '开始'; };
    }
  });

  // 打字速度测试
  T.register({
    id: 'typing', cat: 'util', icon: '⌨️', name: '打字测速',
    desc: '测试打字速度与准确率', keywords: 'typing 打字 速度 测试',
    render: () => `
      <div class="tool-panel">
        <h2>⌨️ 打字测速</h2>
        <p class="t-sub">在下方输入示例文本，完成后查看成绩。</p>
        <div class="out" id="ty-src" style="white-space:pre-wrap;line-height:1.8"></div>
        <div class="field" style="margin-top:14px"><textarea id="ty-in" style="min-height:90px" placeholder="在此开始输入上面的文字…"></textarea></div>
        <div class="grid-3" id="ty-out"></div>
        <div class="btn-row"><button class="btn secondary" id="ty-reset">换一段</button></div>
      </div>`,
    init: (r) => {
      const samples = [
        '快速的棕色狐狸跳过了那只懒狗，阳光洒在安静的湖面上。',
        '工欲善其事，必先利其器；学而不思则罔，思而不学则殆。',
        'The quick brown fox jumps over the lazy dog near the river bank.'
      ];
      let start = 0, text = '';
      const src = r.querySelector('#ty-src'), inp = r.querySelector('#ty-in'), out = r.querySelector('#ty-out');
      const reset = () => { text = samples[Math.floor(Math.random() * samples.length)]; src.textContent = text; inp.value = ''; start = 0; out.innerHTML = ''; };
      inp.addEventListener('input', () => {
        if (!start) start = Date.now();
        const t = (Date.now() - start) / 60000;
        const typed = inp.value;
        let correct = 0; for (let i = 0; i < typed.length; i++) if (typed[i] === text[i]) correct++;
        const chars = typed.length;
        const wpm = t > 0 ? Math.round(chars / t / 5) : 0;
        const acc = chars ? Math.round(correct / chars * 100) : 100;
        out.innerHTML = [['速度', wpm, '字/分'], ['准确率', acc, '%'], ['用时', t.toFixed(1), '分']].map(([k, v, u]) => `<div class="tool-card" style="min-height:auto"><div class="t-desc">${k}</div><div class="result-num" style="font-size:20px">${v}<small style="font-size:11px;color:var(--text-muted)"> ${u}</small></div></div>`).join('');
        if (typed.length >= text.length) { inp.readOnly = true; }
      });
      r.querySelector('#ty-reset').onclick = () => { inp.readOnly = false; reset(); };
      reset();
    }
  });

  // 文字转语音
  T.register({
    id: 'tts', cat: 'util', icon: '🔊', name: '文字转语音',
    desc: '浏览器本地朗读文本（Web Speech）', keywords: 'tts speech 文字转语音 朗读',
    render: () => `
      <div class="tool-panel">
        <h2>🔊 文字转语音</h2>
        <p class="t-sub">使用浏览器内置语音合成朗读，无需联网（部分浏览器支持有限）。</p>
        <div class="field"><label>文本</label><textarea id="tts-in" style="min-height:120px">你好，这是一个文字转语音的演示。</textarea></div>
        <div class="row"><div class="field"><label>语速</label><input type="range" id="tts-rate" min="0.5" max="2" step="0.1" value="1"></div>
        <div class="field"><label>音量</label><input type="range" id="tts-vol" min="0" max="1" step="0.1" value="1"></div></div>
        <div class="btn-row"><button class="btn" id="tts-play">▶ 朗读</button><button class="btn secondary" id="tts-stop">■ 停止</button></div>
        <div class="hint" id="tts-note"></div>
      </div>`,
    init: (r) => {
      const note = r.querySelector('#tts-note');
      if (!('speechSynthesis' in window)) { note.textContent = '当前浏览器不支持语音合成。'; return; }
      const play = () => { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(r.querySelector('#tts-in').value); u.lang = 'zh-CN'; u.rate = +r.querySelector('#tts-rate').value; u.volume = +r.querySelector('#tts-vol').value; window.speechSynthesis.speak(u); };
      r.querySelector('#tts-play').onclick = play;
      r.querySelector('#tts-stop').onclick = () => window.speechSynthesis.cancel();
    }
  });
})();

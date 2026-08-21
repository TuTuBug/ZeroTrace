/* ============ 密码安全工具 ============ */
(function () {
  const T = window.TB;

  /* 常用弱密码黑名单（前 200） */
  const WEAK = new Set(['123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234', '111111', '1234567', 'dragon', '123123', 'baseball', 'abc123', 'football', 'monkey', 'letmein', '696969', 'shadow', 'master', '666666', 'qwertyuiop', '123321', 'mustang', '1234567890', 'michael', '654321', 'superman', '1qaz2wsx', '7777777', '121212', '000000', 'qazwsx', '123qwe', 'killer', 'trustno1', 'jordan', 'jennifer', 'zxcvbnm', 'asdfgh', 'hunter', 'buster', 'soccer', 'harley', 'batman', 'andrew', 'tigger', 'sunshine', 'iloveyou', '2000', 'charlie', 'robert', 'thomas', 'hockey', 'ranger', 'daniel', 'starwars', 'klaster', '112233', 'george', 'computer', 'michelle', 'jessica', 'pepper', '1111', 'zxcvbn', '555555', '11111111', '131313', 'freedom', '777777', 'pass', 'maggie', '159753', 'aaaaaa', 'ginger', 'princess', 'joshua', 'cheese', 'amanda', 'summer', 'love', 'ashley', 'nicole', 'chelsea', 'biteme', 'matthew', 'access', 'yankees', '987654321', 'dallas', 'austin', 'thunder', 'taylor', 'matrix', 'mobilemail', 'mom', 'monitor', 'monitoring', 'montana', 'moon', 'moscow']);

  /* 1. 密码强度检测 */
  T.register({
    id: 'password-check', cat: 'pass', icon: '🛡️', name: '密码强度检测',
    desc: '实时评分与破解耗时估算', keywords: 'password strength check 强度 检测 安全',
    render: () => `
      <div class="tool-panel"><h2>🛡️ 密码强度检测</h2><p class="t-sub">完全本地计算，密码不会离开浏览器。</p>
      <div class="field"><label>输入密码</label><input type="password" id="pc-in" autocomplete="off" placeholder="输入要检测的密码…"></div>
      <div class="field"><label>强度</label>
        <div class="meter" id="pc-meter"><i id="pc-fill" style="width:0%"></i></div>
        <div class="out" id="pc-res">等待输入…</div>
      </div>
      <div class="field"><label>破解耗时估算（每秒 10 亿次猜测）</label><div class="out" id="pc-time">--</div></div>
      <div class="hint" id="pc-advice"></div></div>`,
    init: (r) => {
      const inp = r.querySelector('#pc-in'), fill = r.querySelector('#pc-fill'), res = r.querySelector('#pc-res'), time = r.querySelector('#pc-time'), advice = r.querySelector('#pc-advice');
      const fmtTime = (sec) => {
        if (sec < 1) return '不足 1 秒';
        if (sec < 60) return sec.toFixed(0) + ' 秒';
        if (sec < 3600) return (sec / 60).toFixed(1) + ' 分钟';
        if (sec < 86400) return (sec / 3600).toFixed(1) + ' 小时';
        if (sec < 2592000) return (sec / 86400).toFixed(1) + ' 天';
        if (sec < 31536000) return (sec / 2592000).toFixed(1) + ' 个月';
        if (sec < 31536000 * 100) return (sec / 31536000).toFixed(1) + ' 年';
        return '远超百年（几乎不可破）';
      };
      inp.oninput = () => {
        const p = inp.value; if (!p) { fill.style.width = '0%'; res.textContent = '等待输入…'; time.textContent = '--'; advice.textContent = ''; return; }
        let score = 0; const tips = [];
        if (p.length >= 8) score += 1; else tips.push('长度建议至少 8 位');
        if (p.length >= 12) score += 1; else if (p.length < 12 && p.length >= 8) tips.push('更长（12+ 位）会显著提高强度');
        if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score += 1; else tips.push('混合大小写字母');
        if (/\d/.test(p)) score += 1; else tips.push('加入数字');
        if (/[^A-Za-z0-9]/.test(p)) score += 1; else tips.push('加入符号（!@# 等）');
        if (!/(.)\1{2,}/.test(p)) score += 1;
        if (p.length >= 14 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score += 1;
        const lower = p.toLowerCase();
        if (WEAK.has(p.toLowerCase()) || WEAK.has(lower)) { score = 0; tips.unshift('该密码在常见弱密码列表中，请勿使用'); }
        const pool = (/[a-z]/.test(p) ? 26 : 0) + (/[A-Z]/.test(p) ? 26 : 0) + (/\d/.test(p) ? 10 : 0) + (/[^A-Za-z0-9]/.test(p) ? 33 : 0);
        const entropy = p.length * Math.log2(Math.max(pool, 2));
        const crack = Math.pow(2, entropy) / 1e9 / 2;
        const pct = Math.min(100, Math.round(score / 6 * 100));
        fill.style.width = pct + '%';
        const color = pct < 35 ? 'var(--danger)' : pct < 70 ? '#e6a23c' : 'var(--ok)';
        fill.style.background = color;
        res.textContent = pct < 35 ? '💔 弱' : pct < 70 ? '😐 一般' : pct < 90 ? '👍 强' : '💪 极强';
        res.style.color = color;
        time.textContent = fmtTime(crack);
        advice.innerHTML = tips.length ? '建议：' + tips.map(t => `<span class="pill">${t}</span>`).join(' ') : '🎉 非常不错，保持这个水平';
      };
    }
  });

  /* 2. TOTP 两步验证码 */
  T.register({
    id: 'totp', cat: 'pass', icon: '⏳', name: 'TOTP 验证码',
    desc: '本地生成 6 位动态验证码', keywords: 'totp 2fa otp 验证码 两步验证 动态码',
    render: () => `
      <div class="tool-panel"><h2>⏳ TOTP 两步验证码</h2><p class="t-sub">输入服务商提供的 Base32 密钥，本地生成 6 位动态码（30 秒轮换）。</p>
      <div class="field"><label>Base32 密钥（如 JBSWY3DPEHPK3PXP）</label><input type="text" id="tp-key" autocomplete="off" placeholder="粘贴密钥…"></div>
      <div class="btn-row"><button class="btn" id="tp-gen">生成验证码</button></div>
      <div class="out big" id="tp-code" style="font-size:34px;letter-spacing:6px;text-align:center">-- -- -- -- -- --</div>
      <div class="field"><label>剩余秒数</label><div class="meter" id="tp-meter"><i id="tp-fill" style="width:100%"></i></div></div>
      <div class="hint">需要 HTTPS 或 localhost 环境（浏览器安全限制）。密钥仅在本机使用，不会上传。</div></div>`,
    init: (r) => {
      const keyIn = r.querySelector('#tp-key'), codeEl = r.querySelector('#tp-code'), fill = r.querySelector('#tp-fill');
      let timer = null, curCode = '';
      const b32dec = (s) => {
        const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        s = s.toUpperCase().replace(/[^A-Z2-7]/g, '');
        let bits = 0, value = 0, out = [];
        for (const ch of s) {
          const v = ALPHA.indexOf(ch); if (v < 0) return null;
          value = (value << 5) | v; bits += 5;
          if (bits >= 8) { out.push((value >> (bits - 8)) & 255); bits -= 8; }
        }
        return new Uint8Array(out);
      };
      const gen = async () => {
        const key = keyIn.value.trim(); if (!key) { codeEl.textContent = '请先输入密钥'; return; }
        const keyBytes = b32dec(key);
        if (!keyBytes || keyBytes.length < 4) { codeEl.textContent = '密钥格式不正确'; return; }
        const counter = Math.floor(Date.now() / 1000 / 30);
        const buf = new ArrayBuffer(8); const dv = new DataView(buf); dv.setUint32(4, counter, false); dv.setUint32(0, 0, false);
        try {
          const cryptoObj = window.crypto || crypto;
          const hmacKey = await cryptoObj.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
          const sig = new Uint8Array(await cryptoObj.subtle.sign('HMAC', hmacKey, buf));
          const off = sig[sig.length - 1] & 15;
          const bin = ((sig[off] & 127) << 24) | (sig[off + 1] << 16) | (sig[off + 2] << 8) | sig[off + 3];
          curCode = String(bin % 1000000).padStart(6, '0');
          codeEl.textContent = curCode;
          codeEl.onclick = () => copyText(curCode, '验证码已复制');
        } catch (e) { codeEl.textContent = '当前环境不支持（需 HTTPS/localhost）'; }
      };
      r.querySelector('#tp-gen').onclick = () => {
        gen();
        clearInterval(timer);
        timer = setInterval(() => {
          const remain = 30 - (Math.floor(Date.now() / 1000) % 30);
          fill.style.width = (remain / 30 * 100) + '%';
          if (remain === 30 || remain === 29) gen();
        }, 1000);
      };
      fill.parentElement.addEventListener('click', () => { gen(); clearInterval(timer); timer = null; });
    }
  });

  /* 3. SHA-256 哈希 */
  T.register({
    id: 'sha256-hash', cat: 'pass', icon: '🔒', name: 'SHA-256 哈希',
    desc: '文本哈希（不可逆，本地计算）', keywords: 'sha256 hash 哈希 摘要 加密',
    render: () => `
      <div class="tool-panel"><h2>🔒 SHA-256 哈希</h2><p class="t-sub">文本本地计算 SHA-256 摘要（不可逆），用于校验与指纹，不上传。</p>
      <div class="field"><label>输入文本</label><textarea id="sh-in" style="min-height:90px" placeholder="输入任意文本…"></textarea></div>
      <div class="btn-row"><button class="btn" id="sh-go">计算哈希</button><button class="btn secondary" id="sh-copy" disabled>复制</button></div>
      <div class="field"><label>SHA-256</label><textarea id="sh-out" readonly style="min-height:60px;word-break:break-all"></textarea></div>
      <div class="hint">常见用途：文件校验（需文件时先转文本）、密码指纹、内容比对。哈希不可逆，安全性同行业标准。</div></div>`,
    init: (r) => {
      const inp = r.querySelector('#sh-in'), out = r.querySelector('#sh-out'), go = r.querySelector('#sh-go'), copy = r.querySelector('#sh-copy');
      const run = async () => {
        const text = inp.value;
        if (!text) { out.value = ''; copy.disabled = true; return; }
        try {
          const cryptoObj = window.crypto || crypto;
          const bytes = new TextEncoder().encode(text);
          const digest = await cryptoObj.subtle.digest('SHA-256', bytes);
          out.value = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
          copy.disabled = false;
        } catch (e) { out.value = '当前环境不支持（需 HTTPS/localhost）'; }
      };
      go.onclick = run;
      copy.onclick = () => copyText(out.value, '已复制');
    }
  });

  /* 4. 随机密码短语 */
  T.register({
    id: 'passphrase', cat: 'pass', icon: '🧩', name: '密码短语',
    desc: '单词组合生成易记强密码', keywords: 'passphrase diceware 密码短语 单词 强密码',
    render: () => `
      <div class="tool-panel"><h2>🧩 随机密码短语</h2><p class="t-sub">由常见单词组成的密码，好记又难猜（比纯字符密码更实用）。</p>
      <div class="row">
        <div class="field"><label>单词数</label><input type="number" id="pp-n" value="4" min="2" max="8"></div>
        <div class="field"><label>风格</label><select id="pp-style"><option value="dot">用 . 连接</option><option value="dash">用 - 连接</option><option value="space">空格连接</option><option value="camel">驼峰拼接</option></select></div>
        <div class="field"><label>加数字</label><select id="pp-num"><option value="1">末尾加 2 位数字</option><option value="0">不加</option></select></div>
      </div>
      <div class="btn-row"><button class="btn" id="pp-go">重新生成</button><button class="btn secondary" id="pp-copy">复制</button></div>
      <div class="out big" id="pp-out" style="font-size:22px;word-break:break-all"></div></div>`,
    init: (r) => {
      const n = r.querySelector('#pp-n'), style = r.querySelector('#pp-style'), num = r.querySelector('#pp-num'), out = r.querySelector('#pp-out');
      const WORDS = ['apple','banana','cherry','dragon','eagle','forest','garden','hammer','island','jungle','kitten','lemon','mountain','night','ocean','pencil','quartz','river','sunset','tiger','umbrella','violet','window','yellow','zebra','coffee','dream','falcon','grape','horizon','ivory','jacket','koala','lantern','mirror','noble','orange','panda','queen','rocket','silver','temple','unicorn','village','walnut','xylophone','yacht','zipper','autumn','breeze','canyon','dolphin','ember','flame','glacier','harbor','insight','jasmine','kingdom','lotus','meadow','nectar','orchid','pebble','quiver','rainbow','sapphire','thunder','utter','voyage','whisper','acorn','blossom','crystal','dune','echo','frost','glimpse','hollow','ivy','jewel','kayak','lava','moss','nova','opal','prairie','quill','ridge','snow','tide','vapor','willow','zenith'];
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      const gen = () => {
        const cnt = clamp(+n.value || 4, 2, 8), st = style.value, addNum = num.value === '1';
        const words = []; for (let i = 0; i < cnt; i++) words.push(pick(WORDS));
        let p;
        if (st === 'camel') p = words.map((w, i) => i ? w[0].toUpperCase() + w.slice(1) : w).join('');
        else p = words.join(st === 'dot' ? '.' : st === 'dash' ? '-' : ' ');
        if (addNum) p += String(randInt(0, 99)).padStart(2, '0');
        out.textContent = p;
        out.dataset.p = p;
      };
      r.querySelector('#pp-go').onclick = gen;
      r.querySelector('#pp-copy').onclick = () => copyText(out.dataset.p || out.textContent, '已复制');
      gen();
    }
  });
})();

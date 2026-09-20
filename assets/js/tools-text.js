/* ============ 文本工具 ============ */
(function () {
  const T = window.TB;

  // 1. 字数统计
  T.register({
    id: 'word-counter', cat: 'text', icon: '🔢', name: '字数统计',
    desc: '统计字符、词数、行数、段落数', keywords: 'count char word line 字符 词数 行数 统计',
    render: () => `
      <div class="tool-panel">
        <h2>🔢 字数统计</h2>
        <p class="t-sub">实时统计文本长度、词数、行数与段落数。</p>
        <div class="field"><label>输入文本</label>
          <textarea id="wc-in" placeholder="在此粘贴或输入文本…" style="min-height:180px"></textarea>
        </div>
        <div class="grid-3" id="wc-out"></div>
      </div>`,
    init: (r) => {
      const inp = r.querySelector('#wc-in'), out = r.querySelector('#wc-out');
      const calc = () => {
        const t = inp.value;
        const chars = t.length;
        const charsNoSpace = t.replace(/\s/g, '').length;
        const lines = t === '' ? 0 : t.split(/\n/).length;
        const cjk = (t.match(/[一-龥]/g) || []).length;
        const enWords = (t.replace(/[一-龥]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
        const words = cjk + enWords;
        const paras = t.trim() === '' ? 0 : t.trim().split(/\n\s*\n/).filter(Boolean).length;
        out.innerHTML = [
          ['字符数（含空格）', chars], ['字符数（不含空格）', charsNoSpace],
          ['词数（中文字+英文词）', words], ['行数', lines], ['段落数', paras],
        ].map(([k, v]) => `<div class="tool-card" style="min-height:auto"><div class="t-desc">${k}</div><div class="result-num">${v}</div></div>`).join('');
      };
      inp.addEventListener('input', calc); calc();
    }
  });

  // 2. 大小写转换
  T.register({
    id: 'text-case', cat: 'text', icon: '🔡', name: '大小写转换',
    desc: '大小写、驼峰、蛇形、短横线等互转', keywords: 'case uppercase lowercase camel snake kebab 大小写 驼峰',
    render: () => `
      <div class="tool-panel">
        <h2>🔡 大小写 / 命名风格转换</h2>
        <p class="t-sub">支持大小写、首字母大写、驼峰、帕斯卡、蛇形、短横线等互转。</p>
        <div class="field"><label>原文本</label><textarea id="tc-in" placeholder="输入要转换的文本…"></textarea></div>
        <div class="btn-row">
          <button class="btn" data-f="upper">大写</button>
          <button class="btn" data-f="lower">小写</button>
          <button class="btn" data-f="title">首字母大写</button>
          <button class="btn" data-f="sentence">句首大写</button>
          <button class="btn" data-f="camel">camelCase</button>
          <button class="btn" data-f="pascal">PascalCase</button>
          <button class="btn" data-f="snake">snake_case</button>
          <button class="btn" data-f="kebab">kebab-case</button>
          <button class="btn" data-f="reverse">反转</button>
        </div>
        <div class="field"><label>结果</label><textarea id="tc-out" readonly></textarea></div>
        <div class="btn-row"><button class="btn secondary" id="tc-copy">复制结果</button></div>
      </div>`,
    init: (r) => {
      const inp = r.querySelector('#tc-in'), out = r.querySelector('#tc-out');
      const words = s => s.replace(/[_\-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
      const fns = {
        upper: s => s.toUpperCase(), lower: s => s.toLowerCase(),
        title: s => s.replace(/\b\w/g, c => c.toUpperCase()),
        sentence: s => s.replace(/(^\s*|[.!?。！？]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase()),
        reverse: s => [...s].reverse().join(''),
        camel: s => words(s).map((w, i) => i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join(''),
        pascal: s => words(s).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(''),
        snake: s => words(s).join('_').toLowerCase(),
        kebab: s => words(s).join('-').toLowerCase(),
      };
      r.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { out.value = fns[b.dataset.f](inp.value); });
      r.querySelector('#tc-copy').onclick = () => copyText(out.value, '结果');
    }
  });

  // 3. 中文假文生成
  T.register({
    id: 'lorem', cat: 'text', icon: '📄', name: '假文生成',
    desc: '生成中文占位/乱数假文', keywords: 'lorem placeholder 假文 瞎凑 占位 乱数',
    render: () => `
      <div class="tool-panel">
        <h2>📄 假文生成（占位文本）</h2>
        <p class="t-sub">生成一段可读性一般的中文占位文本，用于排版预览。</p>
        <div class="row">
          <div class="field"><label>段落数</label><input type="number" id="lp-n" value="3" min="1" max="50"></div>
          <div class="field"><label>每段落句子数</label><input type="number" id="lp-s" value="5" min="1" max="30"></div>
        </div>
        <div class="btn-row"><button class="btn" id="lp-go">生成</button><button class="btn secondary" id="lp-copy">复制</button></div>
        <div class="field"><label>结果</label><textarea id="lp-out" readonly style="min-height:200px"></textarea></div>
      </div>`,
    init: (r) => {
      const pool = '天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏闰余成岁律吕调阳云腾致雨露结为霜金生丽水玉出昆冈剑号巨阙珠称夜光果珍李柰菜重芥姜海咸河淡鳞潜羽翔龙师火帝鸟官人皇始制文字乃服衣裳推位让国有虞陶唐吊民伐罪周发殷汤坐朝问道垂拱平章爱育黎首臣伏戎羌遐迩一体率宾归王鸣凤在竹白驹食场化被草木赖及万方盖此身发四大五常恭惟鞠养岂敢毁伤女慕贞洁男效才良知过必改得能莫忘罔谈彼短靡恃己长信使可覆器欲难量墨悲丝染诗赞羔羊景行维贤克念作圣德建名立形端表正空谷传声虚堂习听祸因恶积福缘善庆尺璧非宝寸阴是竞'.split('');
      const out = r.querySelector('#lp-out');
      const gen = () => {
        const pn = clamp(+r.querySelector('#lp-n').value || 1, 1, 50);
        const sn = clamp(+r.querySelector('#lp-s').value || 1, 1, 30);
        const para = () => {
          let s = '';
          for (let i = 0; i < sn; i++) {
            const len = randInt(8, 22);
            let sent = '';
            for (let j = 0; j < len; j++) sent += pool[randInt(0, pool.length - 1)];
            s += sent + (Math.random() < 0.5 ? '，' : '，');
          }
          return s.replace(/，$/, '。');
        };
        const res = [];
        for (let i = 0; i < pn; i++) res.push(para());
        out.value = res.join('\n\n');
      };
      r.querySelector('#lp-go').onclick = gen;
      r.querySelector('#lp-copy').onclick = () => copyText(out.value, '已复制');
      gen();
    }
  });

  // 4. Markdown 预览
  T.register({
    id: 'markdown', cat: 'text', icon: '📝', name: 'Markdown 预览',
    desc: '实时预览 Markdown 渲染', keywords: 'markdown md preview 预览 渲染',
    render: () => `
      <div class="tool-panel">
        <h2>📝 Markdown 预览</h2>
        <p class="t-sub">左侧输入，右侧实时渲染（支持标题、加粗、列表、代码）。</p>
        <div class="grid-2">
          <div class="field"><label>Markdown 源</label><textarea id="md-in" placeholder="# 标题\n**加粗** 与 *斜体*\n- 列表项\n\`代码\`"># 标题示例\n\n这是 **加粗**，这是 *斜体*。\n\n- 项目一\n- 项目二\n\n行内代码 \`code\`。</textarea></div>
          <div class="field"><label>预览</label><div id="md-out" class="out" style="min-height:300px"></div></div>
        </div>
      </div>`,
    init: (r) => {
      const inp = r.querySelector('#md-in'), out = r.querySelector('#md-out');
      const up = () => { out.innerHTML = miniMarkdown(inp.value); };
      inp.addEventListener('input', up); up();
    }
  });

  // 5. 文本对比
  T.register({
    id: 'diff', cat: 'text', icon: '🔍', name: '文本对比',
    desc: '逐行对比两段文本差异', keywords: 'diff compare 对比 差异 文本',
    render: () => `
      <div class="tool-panel">
        <h2>🔍 文本对比</h2>
        <p class="t-sub">逐行比较左右两段文本，标出新增与删除。</p>
        <div class="grid-2">
          <div class="field"><label>原始文本</label><textarea id="df-a" placeholder="旧版本…"></textarea></div>
          <div class="field"><label>对比文本</label><textarea id="df-b" placeholder="新版本…"></textarea></div>
        </div>
        <div class="btn-row"><button class="btn" id="df-go">对比</button></div>
        <div class="field"><label>差异结果</label><div id="df-out" class="out" style="min-height:160px"></div></div>
      </div>`,
    init: (r) => {
      const a = r.querySelector('#df-a'), b = r.querySelector('#df-b'), out = r.querySelector('#df-out');
      const go = () => {
        const A = a.value.split('\n'), B = b.value.split('\n');
        const m = A.length, n = B.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
        for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--)
          dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        let i = 0, j = 0, html = '';
        while (i < m && j < n) {
          if (A[i] === B[j]) { html += `<div style="color:var(--text-soft)">  ${esc(A[i])}</div>`; i++; j++; }
          else if (dp[i + 1][j] >= dp[i][j + 1]) { html += `<div style="color:var(--danger)">- ${esc(A[i])}</div>`; i++; }
          else { html += `<div style="color:var(--ok)">+ ${esc(B[j])}</div>`; j++; }
        }
        while (i < m) { html += `<div style="color:var(--danger)">- ${esc(A[i])}</div>`; i++; }
        while (j < n) { html += `<div style="color:var(--ok)">+ ${esc(B[j])}</div>`; j++; }
        out.innerHTML = html || '<span class="muted">无差异</span>';
      };
      r.querySelector('#df-go').onclick = go;
    }
  });

  // 6. 花式文字
  T.register({
    id: 'fancy-text', cat: 'text', icon: '✨', name: '花式文字',
    desc: '生成各种 Unicode 花式字体', keywords: 'fancy font style 花式 特殊 字体',
    render: () => `
      <div class="tool-panel">
        <h2>✨ 花式文字生成</h2>
        <p class="t-sub">把普通文字转换成各种 Unicode 风格（复制后可用于社交平台）。</p>
        <div class="field"><label>输入</label><input type="text" id="ft-in" value="工具箱 ToolBox" /></div>
        <div class="field"><label>样式</label><div id="ft-out"></div></div>
      </div>`,
    init: (r) => {
      const map = {
        '𝖠𝖡𝖢𝖣': 'bold', '𝒜ℬ𝒞𝒟': 'script', '𝔄𝔅ℭ𝔇': 'fraktur',
        'ＡＢＣＤ': 'fullwidth', 'ⒶⒷⒸⒹ': 'circle', '🅰🅱🅲🅳': 'squared',
      };
      const styles = {
        bold: c => '𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗'.split(''),
        script: c => '𝒜𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏'.split(''),
        fraktur: c => '𝔄𝔅ℭ𝔇𝔈𝔉𝔊𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍𝔍'.split(''),
        fullwidth: c => 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９'.split(''),
        circle: c => 'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ'.split(''),
        squared: c => '🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉'.split(''),
        small: c => 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀꜱᴛᴜᴠᴡxʏᴢᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀꜱᴛᴜᴠᴡxʏᴢ'.split(''),
      };
      const baseU = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');
      const baseL = 'abcdefghijklmnopqrstuvwxyz'.split('');
      const conv = (text, arr) => [...text].map(ch => {
        let idx = baseU.indexOf(ch.toUpperCase());
        if (idx >= 0 && arr[idx]) return arr[idx];
        return ch;
      }).join('');
      const out = r.querySelector('#ft-out');
      const up = () => {
        const t = r.querySelector('#ft-in').value;
        const items = [
          ['粗体', styles.bold], ['手写', styles.script], ['哥特', styles.fraktur],
          ['全角', styles.fullwidth], ['圆圈', styles.circle], ['方块', styles.squared], ['小型大写', styles.small],
        ];
        out.innerHTML = items.map(([name, arr]) => {
          const v = conv(t, arr);
          return `<div class="kv"><span class="k">${name}</span><span class="v" style="cursor:pointer" data-copy="${esc(v)}" title="点击复制">${esc(v)}</span></div>`;
        }).join('') + `<div class="hint">点击右侧文字即可复制。</div>`;
        out.querySelectorAll('[data-copy]').forEach(el => el.onclick = () => copyText(el.dataset.copy, '已复制'));
      };
      r.querySelector('#ft-in').addEventListener('input', up); up();
    }
  });

  // 7. 文本整理
  T.register({
    id: 'text-clean', cat: 'text', icon: '🧹', name: '文本整理',
    desc: '去空行/去重/排序/全半角互转', keywords: 'clean trim dedupe sort 整理 去空行 去重 排序',
    render: () => `
      <div class="tool-panel">
        <h2>🧹 文本整理</h2>
        <p class="t-sub">去除空行、首尾空格、重复行、排序、全半角互转等。</p>
        <div class="field"><label>原文本</label><textarea id="cl-in" style="min-height:160px" placeholder="每行一条…"></textarea></div>
        <div class="btn-row">
          <button class="btn" data-f="trim">去除空行+首尾空格</button>
          <button class="btn" data-f="dedupe">去除重复行</button>
          <button class="btn" data-f="sort">按行排序</button>
          <button class="btn" data-f="fw2hw">全角→半角</button>
          <button class="btn" data-f="hw2fw">半角→全角</button>
          <button class="btn" data-f="collapse">合并多余空格</button>
        </div>
        <div class="field"><label>结果</label><textarea id="cl-out" readonly style="min-height:160px"></textarea></div>
        <div class="btn-row"><button class="btn secondary" id="cl-copy">复制</button></div>
      </div>`,
    init: (r) => {
      const inp = r.querySelector('#cl-in'), out = r.querySelector('#cl-out');
      const lines = () => inp.value.split('\n');
      const fns = {
        trim: () => lines().map(l => l.trim()).filter(l => l !== ''),
        dedupe: () => { const s = new Set(); return lines().filter(l => l && !s.has(l) ? (s.add(l), true) : false); },
        sort: () => lines().filter(l => l !== '').sort((a, b) => a.localeCompare(b, 'zh')),
        collapse: () => [inp.value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')],
        fw2hw: () => [inp.value.replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ')],
        hw2fw: () => [inp.value.replace(/[!-~]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xFEE0)).replace(/ /g, '　')],
      };
      r.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { out.value = fns[b.dataset.f]().join('\n'); });
      r.querySelector('#cl-copy').onclick = () => copyText(out.value, '已复制');
    }
  });

  // 8. 二维码生成
  T.register({
    id: 'qr', cat: 'text', icon: '🔳', name: '二维码生成',
    desc: '把文本/网址生成二维码图片', keywords: 'qrcode 二维码 生成 扫码',
    render: () => `
      <div class="tool-panel">
        <h2>🔳 二维码生成</h2>
        <p class="t-sub">在浏览器本地生成二维码，内容不会上传。</p>
        <div class="field"><label>内容（文本 / 网址）</label><textarea id="qr-in" style="min-height:90px">https://tool.wululu.xyz/</textarea></div>
        <div class="row">
          <div class="field"><label>容错级别</label>
            <select id="qr-ec"><option value="L">L 低</option><option value="M" selected>M 中</option><option value="Q">Q 较高</option><option value="H">H 高</option></select>
          </div>
          <div class="field"><label>像素大小</label><input type="number" id="qr-cell" value="5" min="1" max="20"></div>
        </div>
        <div class="btn-row"><button class="btn" id="qr-go">生成</button><button class="btn secondary" id="qr-dl">下载 SVG</button></div>
        <div class="preview-box" id="qr-box"></div>
      </div>`,
    init: (r) => {
      const box = r.querySelector('#qr-box');
      const gen = () => {
        const text = r.querySelector('#qr-in').value;
        const ec = r.querySelector('#qr-ec').value;
        const cell = clamp(+r.querySelector('#qr-cell').value || 5, 1, 20);
        if (!text) { box.innerHTML = '<span class="muted">请输入内容</span>'; return; }
        try {
          const qr = qrcode(0, ec);
          qr.addData(text); qr.make();
          const svg = qr.createSvgTag({ cellSize: cell, margin: 4, scalable: true });
          box.innerHTML = svg;
          box.querySelector('svg').style.maxWidth = '260px';
          box._svg = svg;
        } catch (e) {
          box.innerHTML = '<span style="color:var(--danger)">生成失败：' + esc(e.message) + '</span>';
        }
      };
      r.querySelector('#qr-go').onclick = gen;
      r.querySelector('#qr-dl').onclick = () => {
        if (!box._svg) return;
        const blob = new Blob([box._svg], { type: 'image/svg+xml' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'qrcode.svg'; a.click(); URL.revokeObjectURL(a.href);
      };
      gen();
    }
  });
})();

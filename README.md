# 零上传工具箱（ZeroTrace）

一个**纯前端、零服务器、零后台上传**的在线工具集合。所有计算与处理都在浏览器本地完成，数据从不出本机，可完全离线运行，无需登录、无后端、无数据库。

> 🛡️ 0 服务器 · 🚫 0 后台上传 · 💻 100% 本地运行 · 🛡️ 数据从不出本机

---

## 特性

- **155 个工具**，9 大类：文本、开发编码、颜色图像、CSS 生成器、计算器、密码安全、格式转换、数学计算、实用工具（数量由 `assets/js/app.js` 启动时按注册表动态统计，新增工具无需改文案）
- **我的常用**：可自定义的首页常用分组（localStorage 持久化）
- **实时预览**：图片类工具（压缩/缩放/格式转换）选图即见原图与处理后对比；JSON 工具左输入右树形视图
- **JSON 转义处理**：内容被整体转义时逐层去转义（最多 3 层）；内容本身合法但带 `\/` 这类冗余转义时，一键清理（**嵌套 JSON 内部同样生效**，且不改变数据语义）；字符串里嵌套的 JSON 可在树视图直接展开，视图右上角支持**全部展开 / 全部折叠**
- **图片工具**：格式转换（含真实 BMP 编码）、压缩、缩放、裁剪、滤镜、加水印、多图拼接、ASCII 字符画、EXIF 信息（含 GPS）查看、Base64
- **明暗主题**一键切换
- **CSP 硬约束**：页面通过 `Content-Security-Policy` 声明，其中 `connect-src 'none'` 让浏览器**从机制上禁止**本页发起任何网络数据请求，"0 上传"因此不只是口号，而是可验证的浏览器行为
- **社交分享卡片**：已配置 `og:` / `twitter:` 元信息与 1200×630 封面图，并附 `robots.txt`、`sitemap.xml`（1 首页 + 155 工具页 = 156 条 URL）
- **每个工具一个独立网址**：如 `/tool/json/`，地址干净、每页有独立标题与描述，可被搜索引擎正常收录（详见「六、SEO：工具页静态化」）
- **纯静态**：无构建步骤，双击 `index.html` 即可用
- **离线可用**：二维码 `qrcode.js`、条形码 `JsBarcode` 已内置 `vendor/`

---

## 目录结构

```
toolbox/
├── .assetsignore           # 【必须】Cloudflare Workers 发布排除清单，排除 .git 等（见「八、部署」）
├── index.html              # 入口页面（站名/隐私徽章/分类导航/首页/CSP 与 SEO 元信息）
├── robots.txt              # 搜索引擎抓取规则
├── sitemap.xml             # 站点地图（由 scripts/gen-static.js 生成，勿手改）
├── scripts/
│   ├── gen-static.js       # 工具页静态化生成器（见「六、SEO：工具页静态化」）
│   ├── verify-assetsignore.js  # 推送前预演发布清单（见「八、部署」）
│   ├── verify-nav.js       # 导航与主题引导回归（防闪屏 / 防「返回首页不全」）
│   └── verify-online.js    # 上线后端到端验证（HTTP / 隐私 / 功能）
├── tool/                   # 【生成物】每个工具一份静态页：tool/<id>/index.html
├── assets/
│   ├── og-cover.png        # 社交分享封面图（1200×630）
│   ├── css/
│   │   └── style.css       # 全部样式（含响应式、暗色主题、跳转加载遮罩）
│   └── js/
│       ├── theme-boot.js   # 【必须留在 <head>、且在 style.css 之前】首屏主题引导，防整页重载时闪主题
│       ├── util.js         # 注册表 T、分类表 T.categories、工具页 DOM 骨架（静态页与运行时共用）、通用辅助函数
│       ├── app.js          # 首页渲染、搜索（含防抖）、分类切换、路径路由（兼容 hash）、站内链接接管、常用分组
│       ├── tools-text.js / tools-text2.js   # 文本工具
│       ├── tools-dev.js / tools-gen.js      # 开发编码（含 JSON 格式化/去转义）/ 生成器
│       ├── tools-color.js / tools-color2.js # 颜色图像 / 格式转换
│       ├── tools-media.js  # 图片水印 / 拼接 / ASCII 字符画 / EXIF
│       ├── tools-pass.js   # 密码安全（生成器 / 强度 / TOTP / 密码短语）
│       ├── tools-css.js    # CSS 生成器
│       ├── tools-math.js   # 数学计算
│       ├── tools-util.js   # 实用工具
│       └── tools-calc.js / tools-calc2.js   # 计算器 / 健康
└── vendor/
    ├── qrcode.js           # 二维码生成（本地）
    └── JsBarcode.all.min.js# 条形码生成（本地）
```

> ⚠️ 新增 `tools-*.js` 后必须在 `index.html` 底部按序补 `<script>`，否则该分类会静默不加载。

---

## 一、本地运行（3 种方式）

### 方式 A：直接打开（❌ 当前版本已失效，2026-09-18 实测）

双击 `index.html` **已经打不开了**：页内资源全部是绝对路径（`/assets/css/style.css`、`/vendor/qrcode.js`…），在 `file://` 协议下会被解析到文件系统根 `file:///assets/...`，实测**全部 `ERR_FILE_NOT_FOUND`** —— 结果是首页卡片 0 个、CSS 完全不生效。

要恢复这条路，得把所有资源引用改成相对路径（`index.html` 用 `assets/…`，静态页用 `../../assets/…`），并同步放宽 `gen-static.js` 里「禁止相对路径资源」那条自检 —— 属于独立改动，**尚未做**。现在请用方式 B / C。

### 方式 B：Python 静态服务器（推荐开发用）
```bash
cd toolbox
python -m http.server 8290
# 浏览器访问 http://localhost:8290/
```

### 方式 C：Node 静态服务器
```bash
cd toolbox
npx serve .          # 或 npx http-server -p 8290
```

> ⚠️ 端口可任意指定（如 8290）。服务仅用于本地预览，工具本身不依赖服务器。
> 注意「离线可用」指的是**打开页面后拔网线照样能用**（零外部请求），不是「用 `file://` 打开」。

---

## 二、部署到公网

本仓库为**纯静态站点**，部署到任何静态托管平台都只需「上传目录全部文件」即可。

### 方案 1：GitHub Pages（需公开仓库）

> 注意：GitHub Pages 对**私有仓库需要付费账户**才能启用。免费账户请先把仓库设为 **Public**。

1. 在 GitHub 仓库 `Settings → Pages`
2. Source 选择 **Deploy from a branch**
3. Branch 选 **main**，目录选 **/ (root)**
4. 保存后等待约 1 分钟，访问 `https://<用户名>.github.io/<仓库名>/`

### 方案 2：自有服务器（Nginx 示例）

把 `toolbox/` 目录整个上传到服务器，例如 `/var/www/toolbox/`，Nginx 配置：

```nginx
server {
    listen 80;
    server_name tools.example.com;     # 换成你的域名
    root /var/www/toolbox;
    index index.html;

    # 纯静态，开启缓存
    location /assets/ { expires 7d; add_header Cache-Control "public"; }
    location /vendor/ { expires 30d; add_header Cache-Control "public"; }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

重载：`nginx -s reload`。如需 HTTPS，用 Certbot 申请免费证书。

### 方案 3：静态托管平台（Vercel / Netlify / Cloudflare Pages）

- **Vercel / Netlify**：导入 Git 仓库，Framework 选 **Other / 无构建**，Output 目录填 `.`（仓库根），部署即可。
- **Cloudflare Pages**：连接仓库，构建命令留空，构建输出目录填 `toolbox`（或直接把仓库根作为输出）。
- 也可直接把 `toolbox/` 文件夹**拖拽**到 Netlify Drop 页面完成部署。

> 无构建步骤、无环境变量、无后端依赖，所有平台均零配置。

---

## 三、二次开发：新增一个工具

注册表集中在 `assets/js/util.js` 的全局对象 `T` 上，新增工具只需在对应 `tools-*.js` 里调用 `T.register({...})`，首页/搜索/路由会自动收录。

最小示例（加到 `tools-dev.js` 末尾）：

```js
T.register({
  id: 'my-tool',                 // 唯一 ID（英文）
  cat: 'dev',                    // 分类：text|dev|color|css|calc|pass|convert|math|util
  icon: '🛠️',                   // 卡片图标
  name: '我的工具',
  desc: '一句话描述',
  keywords: 'my tool 关键词',
  render: () => `                // 返回工具内部 HTML 字符串
    <div class="tool-panel">
      <h2>🛠️ 我的工具</h2>
      <div class="field"><label>输入</label><input id="mt-in"></div>
      <div class="btn-row"><button class="btn" id="mt-go">运行</button></div>
      <div class="out" id="mt-out"></div>
    </div>`,
  init: (root) => {              // 绑定事件（root 为工具容器）
    root.querySelector('#mt-go').onclick = () => {
      root.querySelector('#mt-out').textContent = root.querySelector('#mt-in').value;
    };
  }
});
```

本地改完刷新即可看到，无需构建。提交后 `git push` 即更新线上。

---

## 四、隐私与安全

- 所有工具在浏览器本地（Canvas / Web API / JS）执行，**没有任何网络请求把你的输入发出去**
- **CSP 加以强制**：`index.html` 与所有生成的 `tool/*/index.html` 都声明了 `Content-Security-Policy`，其中 `connect-src 'none'` 让浏览器层面禁止 `fetch` / `XMLHttpRequest` / `WebSocket` / `sendBeacon`，站点因此在机制上无法外发数据；`img-src` 也仅允许 `'self' data: blob:`，不放行任何站外图片
- 无 Cookie、无统计脚本、无第三方追踪
- 「我的常用」分组仅存于浏览器 `localStorage`，不上传
- 离线可用：断网后除极少数依赖系统 API（如 Web Speech 语音）外，全部功能正常

> CSP 刻意保留两条豁免，改动时请勿删除：`script-src` 的 `'unsafe-eval'`（科学计算器用 `new Function` 求值表达式）、`style-src` 的 `'unsafe-inline'`（全站大量内联 `style` 属性）。去掉任一条会分别导致科学计算器报错、页面样式崩塌。

---

## 五、常见问题

**Q：双击 index.html 打开后是空白？**
部分浏览器对 `file://` 有安全限制。建议用方式 B/C 起一个本地服务器访问。

**Q：想加更多工具？**
按「三、二次开发」在对应 `tools-*.js` 里加 `T.register`，或联系维护者扩充。

**Q：图片压缩/缩放没反应？**
检查是否选了文件；超大图片受浏览器内存限制，建议单张不超过 20MB。

**Q：二维码/条形码不显示？**
`vendor/qrcode.js` 与 `vendor/JsBarcode.all.min.js` 需和 `index.html` 同目录部署，确保这两个文件已上传。

---

## 六、SEO：工具页静态化

### 为什么需要

线上站点是纯前端 SPA，工具页地址原本是 `/#/tool/json` 这种 hash 形式。而**搜索引擎会忽略 `#` 之后的内容**——在爬虫眼里所有工具页都等于首页，一个都收录不进来；把上百条 hash URL 提交给搜索平台还会被判「首页重复提交」，白耗配额、影响站点评分。

### 怎么做的

靠 `scripts/gen-static.js` 在本地一次性生成（**不是 CI 构建步骤**，产物直接提交进仓库）：

- 输出 `tool/<id>/index.html`，路径干净（`/tool/json/`），每页有独立的 `title`、`description`、`canonical`、`h1`
- 页面内含**预渲染的工具界面与说明正文**，不是空壳跳转页——禁用 JS 也能读到完整内容
- 页尾附**同类工具的真实 `<a href>` 内链**，给爬虫一张抓取网（hash 链接爬不到，等于没有内链）
- 顺带重写 `sitemap.xml`（1 首页 + N 工具页）
- **不使用 `_redirects` 做兜底**（⚠️ 重要，2026-09-17 踩过的坑）。曾写过 `/tool/* /index.html 200` 想「静态页缺失时回退首页」，这是**错的**，两层原因：
  1. Cloudflare 官方明确：*Redirects are always followed, regardless of whether or not an asset matches the incoming request* —— 200 重写规则**无条件生效**，不会因为 `tool/<id>/index.html` 真实存在就跳过。所以它根本不是「兜底」，而是「全覆盖」。
  2. 实际操作中它连构建都过不去：目标 `/index.html` 会被 Cloudflare 的 HTML 规范化 strip 成 `/index`、`/`，从而再次触发同一条规则，构建期直接报 `code 100324 Infinite loop detected` → **整个部署失败**。即便绕开该检测，155 个静态页也会全部返回首页内容，变成重复内容，SEO 反而被惩罚 —— 正好毁掉本节存在的意义。

  取代方案：让「漏生成」不可能发生 —— 把生成脚本挂进部署流程（见「八、部署」）。

运行侧配套：`app.js` 路由改为**路径优先 + hash 兜底**

- 首页点卡片、点返回走 `history.pushState`，地址栏是干净的 `/tool/<id>/`
- 老链接 `/#/tool/<id>` 仍然可用，首次加载时自动规范化为干净路径
- 静态页里已渲染好的 DOM 会被直接接管，只补事件绑定、不重复渲染
- 用 `file://` 打开时自动退化回 hash 路由（`pushState` 在 file 协议下不可用）—— 这条降级目前是**空转**的，因为 `file://` 下资源本来就加载不出来，见「一、本地运行 › 方式 A」
- **站内链接由 `app.js` 统一接管**（`document` 上的 click 委托），工具页底部的同类工具 `<a href="/tool/x/">` 不再触发整页重载 —— 它只保留给爬虫看的真实链接形态，运行时一律走 SPA。外链、新标签、`download`、修饰键（Ctrl / Cmd / Shift / Alt）、中键全部放行给浏览器

### 导航与主题引导（防「切工具闪一下」，2026-09-18）

两个线上体感 bug 的成因与修法，都别改回去：

1. **切工具时深浅色闪一下** —— 主题靠 `<html data-theme>` 驱动，而这个属性原先只由页面**底部**的 app.js 写入。整页重载时新文档会先按默认深色画一帧，再翻成浅色。修法有两层，缺一不可：
   - `assets/js/theme-boot.js` 在 `<head>` 里**同步**写入 `data-theme`（必须在 `style.css` 之前）。它必须是独立外链文件：CSP 里没有 `'unsafe-inline'`，内联脚本会被直接拦掉。`gen-static.js` 会把这个标签原样复制进 155 个静态页并断言先后顺序。
   - 上面那条「站内链接接管」让绝大多数跳转根本不发生重载。
2. **「返回」后首页展示不全** —— 静态工具页（`tool/<id>/index.html`）里**没有首页外壳**：`site-header` / `hero`（搜索框、分类导航）/ `site-footer` 都不在 DOM 里。在这类文档上点「返回」如果走 SPA，`#home-view` 的卡片能出来，但整个首页框架是缺的。修法是 `app.js` 里的 `HAS_SHELL` 判断：**当前文档没有外壳时，回首页一律做真导航**（`location.assign('/')`）去取完整的 `index.html`，并由 `#tb-loading` 遮罩盖住这一次跨文档切换。

> 遮罩只给跨文档跳转用。SPA 内部跳转是同步渲染、瞬间完成的，给它加 loading 只会多一次闪。

### 改完怎么验

```bash
python -m http.server 8290
SITE=http://127.0.0.1:8290/ node scripts/verify-nav.js     # 导航 / 主题引导回归（21 项）
```

> `verify-nav.js` 覆盖：主题引导在 156 个页面里的引入与顺序、首屏主题与背景色、点同类工具链接不重载、四条「回首页」路径的完整性、前进后退、搜索恢复、外链与修饰键放行。
> 断言「点击后有没有整页重载」时用 `page.on('load')` 计数，**不要用 `framenavigated`** —— Playwright 在 `pushState` 这类同文档导航上也会触发后者，两者区分不开。

---

## 七、发布前检查

1. **改过 `assets/` 或 `vendor/` 下任何文件后，同步更新 `?v=YYYYMMDD`**（当前为 `?v=20260918`）。`index.html` 与 `tool/*/index.html` 用的是同一个版本号，改完跑一次 `node scripts/gen-static.js` 即可让静态页自动跟随（版本号由脚本从 `index.html` 提取，不需要手改两处）。否则浏览器会继续吃旧缓存，出现「本地明明改了、线上没变」的假故障。
2. **新增 / 改名 / 改描述任何工具后，重跑 `node scripts/gen-static.js`**，让静态页与 `sitemap.xml` 跟上注册表；漏跑会导致线上老页面与新工具不一致。
3. **新增 `tools-*.js` 时**，确认已在 `index.html` 底部按序补上 `<script>`——漏加会让该分类全部工具静默消失，且控制台不报错。
4. **调整 CSP 后**，到浏览器控制台确认没有 `Refused to ...` 报错，并回归验证三处：科学计算器（依赖 `new Function`）、图片类工具（依赖 `blob:` 预览与下载）、二维码（内联 SVG DOM）。
5. **新增任何站外资源前请三思**：`connect-src 'none'`、`img-src` 白名单是本站的核心承诺，刻意不放行站外请求。
6. **改动部署相关文件（`.assetsignore`、`scripts/`）后**，先跑 `node scripts/verify-assetsignore.js` 预演发布清单，再推送 —— 别再让 `.git` 之类的文件上线（见「八、部署」）。
7. **推送并等构建完成后**，跑 `SITE=https://tool.dmi.ccwu.cc/ node scripts/verify-online.js` 复验线上（见「八、部署 › 上线后复验」）。这一步能同时抓出「静态页没生成」「敏感文件又漏出去」「CSP 把某个工具打挂」三类问题。
8. **动过导航、路由、主题（`app.js` / `theme-boot.js` / `style.css` 的跳转与主题部分）后**，跑 `node scripts/verify-nav.js`：它会盯着「点同类工具链接不许整页重载」「四条回首页路径都必须拿到完整首页」「主题引导必须排在样式表之前」这几条容易改回去的约定。

---

## 八、部署（Cloudflare Workers）

### 链路

`git push` → Cloudflare 自动构建 → 上线。**不需要手动上传任何文件**。

- 项目形态是 **Workers**（不是 Pages）：构建命令 `npx wrangler deploy`，`assets.directory = "."`，即**整个仓库根目录都当静态资源目录**
- 构建通常 1–2 分钟。push 后立刻访问新文件若返回 404 属正常，稍等再看
- 构建日志里的 `Read N files from the assets directory` 是**过滤前的读取数**，不等于实际上传数，别被这个数字吓到

### ⚠️ `.assetsignore` 是必需的，不是可选的

Cloudflare **Pages 会自动排除** `.git`、`node_modules`、`.DS_Store` 等；**Workers 不会**。wrangler 源码里默认只排除三个 metafile：

```
/.assetsignore   /_redirects   /_headers
```

其余一律照发。本项目正是栽在这个差异上 —— 线上曾可直接下载：

```
https://tool.dmi.ccwu.cc/.git/index      → 200（含全部文件名 + 每个文件 SHA1 + mtime）
https://tool.dmi.ccwu.cc/.git/config     → 200
https://tool.dmi.ccwu.cc/.git/HEAD       → 200
https://tool.dmi.ccwu.cc/.git/logs/HEAD  → 200
https://tool.dmi.ccwu.cc/.git/FETCH_HEAD → 200
```

（当时 `.git/objects/**` 与 `*.pack` 恰好未被上传，源码历史没泄露 —— 但那是运气，不是设计。）

根目录的 `.assetsignore`（语法同 `.gitignore`）已排除 `.git/`、`.workbuddy/`、`.wrangler/`、`scripts/`、`README.md`、`.gitignore`、`wrangler.*`、`_redirects`、`_headers`。

**推送前预演发布清单**：

```bash
node scripts/verify-assetsignore.js
```

输出「实际会发布 178 个文件」（155 工具页 + 18 assets + 3 根文件 + 2 vendor）+ 25 项断言：必须发布的没被误伤、必须排除的确实挡住、`.git` 残留必须为 0、工具页数量与 `tool/` 目录数一致。断言失败时退出码为 1，可直接用于 CI。

> 脚本用 `ignore` 库（wrangler 内部用的就是同一个 gitignore 实现）复现过滤逻辑；找不到时会提示 `npm install ignore@5.3.1`。它只在本地校验，不参与构建、也不会被发布（`scripts/` 已在 `.assetsignore` 中排除）。

### 建议：把静态页生成挂进构建命令

目前 `tool/` 与 `sitemap.xml` 是本地生成、随代码提交进仓库的，靠人记得跑脚本。把 Cloudflare 控制台的构建命令从

```
npx wrangler deploy
```

改为

```
node scripts/gen-static.js && npx wrangler deploy
```

就从「靠纪律」变成「不可能忘」。该脚本每次运行会先清空 `tool/` 再按注册表全量重建，并带自检（缺 h1、缺内链、相对路径资源都会报错并置退出码非 0），可安全自动化。

### 为什么本项目不用 `_redirects`

详见「六、SEO：工具页静态化」—— 它做不到「缺页才兜底」，实际语义是无条件覆盖全部请求，既会让构建直接失败，也会毁掉全部静态页的 SEO 价值。**不要为了兜底再加回来。**

### 上线后复验

**推送后的本地预演只能证明「会发什么」，证明不了「发出去之后是不是好的」。** 每次上线后跑一次线上端到端（真实 Chrome，22 项断言）：

```bash
SITE=https://tool.dmi.ccwu.cc/ node scripts/verify-online.js   # 验线上
node scripts/verify-online.js                                  # 不传 SITE 则验本地 127.0.0.1:8290
SHOT=1 SITE=... node scripts/verify-online.js                  # 额外存一张首页截图
```

分三层：

| 层 | 检查内容 |
|---|---|
| A. HTTP | 首页资源齐全；`/tool/<id>/` 是**独立页面**（有自己的 canonical、不是首页副本）；13 条敏感路径（`.git/*`、`wrangler.*`、`scripts/*`、`README.md`、`_redirects`）必须 404 |
| B. 隐私 | 本站零外部网络请求；无 CSP 违规；控制台无 error、无未捕获异常 |
| C. 功能 | 工具总数已渲染；搜索防抖生效；`picsum` 零残留；科学计算器（`new Function`）、二维码（内联 SVG）实测可用；从静态页直达时 JS 能正常接管 |

任一项失败退出码为 1，可直接接 CI。依赖 `playwright-core`（装在隔离 workspace，驱动本机已装 Chrome，**不下载 Chromium**）：

```bash
cd ~/.workbuddy/binaries/node/workspace && npm install playwright-core
```

> **关于 `cloudflareinsights.com` 信标**：线上会看到 Cloudflare 边缘自动注入的 Web Analytics 脚本（不在本仓库内），被本站 CSP 拦下。脚本把它单独归类为 `INFO` 而非失败项 —— 它属于平台行为，不是代码问题。彻底消除需在 Cloudflare 控制台关闭该域名的 Web Analytics 自动注入；**不要**为它放行 CSP，那等于主动放行追踪，与产品定位冲突。


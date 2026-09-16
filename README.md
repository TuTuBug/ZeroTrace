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
- **社交分享卡片**：已配置 `og:` / `twitter:` 元信息与 1200×630 封面图，并附 `robots.txt`、`sitemap.xml`
- **纯静态**：无构建步骤，双击 `index.html` 即可用
- **离线可用**：二维码 `qrcode.js`、条形码 `JsBarcode` 已内置 `vendor/`

---

## 目录结构

```
toolbox/
├── index.html              # 入口页面（站名/隐私徽章/分类导航/首页/CSP 与 SEO 元信息）
├── robots.txt              # 搜索引擎抓取规则
├── sitemap.xml             # 站点地图
├── assets/
│   ├── og-cover.png        # 社交分享封面图（1200×630）
│   ├── css/
│   │   └── style.css       # 全部样式（含响应式、暗色主题）
│   └── js/
│       ├── util.js         # 注册表 T、分类表 T.categories、通用辅助函数
│       ├── app.js          # 首页渲染、搜索（含防抖）、分类切换、hash 路由、常用分组
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

### 方式 A：直接打开（最简单）
双击 `index.html`，用浏览器打开即可。所有工具离线可用。

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
- **CSP 加以强制**：`index.html` 的 `Content-Security-Policy` 含 `connect-src 'none'`，浏览器层面禁止 `fetch` / `XMLHttpRequest` / `WebSocket` / `sendBeacon`，站点因此在机制上无法外发数据；`img-src` 也仅允许 `'self' data: blob:`，不放行任何站外图片
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

## 六、发布前检查

1. **改过 `assets/` 或 `vendor/` 下任何文件后，同步更新 `index.html` 里的 `?v=YYYYMMDD`**（当前为 `?v=20260916`）。否则浏览器会继续吃旧缓存，出现「本地明明改了、线上没变」的假故障。
2. **新增 `tools-*.js` 时**，确认已在 `index.html` 底部按序补上 `<script>`——漏加会让该分类全部工具静默消失，且控制台不报错。
3. **调整 CSP 后**，到浏览器控制台确认没有 `Refused to ...` 报错，并回归验证三处：科学计算器（依赖 `new Function`）、图片类工具（依赖 `blob:` 预览与下载）、二维码（内联 SVG DOM）。
4. **新增任何站外资源前请三思**：`connect-src 'none'`、`img-src` 白名单是本站的核心承诺，刻意不放行站外请求。

#!/usr/bin/env node
/**
 * 百度普通收录 - API 推送（data.zz.baidu.com/urls）
 *
 * 为什么需要这个脚本：
 *   本站当天 API 推送配额实测只有 **10 条/天**（2026-09-18：首批 5 条 success=5 后
 *   remain=5，第二批 5 条后 remain=0），而 sitemap 里有 156 条 URL。
 *   也就是必须连续推送约 15 天才能推完 —— 靠手推不现实，所以脚本化 + 定时化。
 *
 * 脚本行为（幂等，可反复跑）：
 *   1. 读 sitemap.xml 得到全量 URL，减去已推送记录（scripts/.baidu-push-state.json）
 *   2. 先单条探测当天剩余配额（接口返回 remain），再按额度批量推送
 *   3. 把成功的 URL 追加进状态文件，下次不会重复推
 *   4. 配额为 0 时友好退出（退出码 0），不报错 —— 定时任务每天跑不会产生噪音
 *
 * token 读取优先级（**绝不硬编码进仓库**）：
 *   1. 环境变量 BAIDU_TOKEN
 *   2. 文件 scripts/.baidu-token（已在 .gitignore 中排除，仅存本地）
 *
 * 用法：
 *   node scripts/baidu-push.js            # 正常推送
 *   node scripts/baidu-push.js --dry-run  # 只看还剩多少条没推，不发请求
 *   node scripts/baidu-push.js --status   # 打印进度统计
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const STATE = path.join(__dirname, '.baidu-push-state.json');
const TOKEN_FILE = path.join(__dirname, '.baidu-token');

const SITE = 'https://tool.wululu.xyz';
const ENDPOINT = `http://data.zz.baidu.com/urls?site=${SITE}&token=`;

function getToken() {
  if (process.env.BAIDU_TOKEN) return process.env.BAIDU_TOKEN.trim();
  if (fs.existsSync(TOKEN_FILE)) {
    const t = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    if (t) return t;
  }
  console.error('✗ 没找到推送 token。');
  console.error('  请设置环境变量 BAIDU_TOKEN，或把 token 写入 ' + path.relative(ROOT, TOKEN_FILE));
  process.exit(1);
}

function readAllUrls() {
  const xml = fs.readFileSync(SITEMAP, 'utf8');
  // 去重，防止 sitemap 里出现重复 URL 时重复消耗配额
  return [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()))];
}

function readState() {
  if (!fs.existsSync(STATE)) return { pushed: [], history: [] };
  try {
    const s = JSON.parse(fs.readFileSync(STATE, 'utf8'));
    return { pushed: s.pushed || [], history: s.history || [] };
  } catch {
    console.error('! 状态文件损坏，已按「全部未推送」重新开始（可能会重复推送，无副作用）');
    return { pushed: [], history: [] };
  }
}

function writeState(pushed, history) {
  fs.writeFileSync(STATE, JSON.stringify({ site: SITE, updatedAt: new Date().toISOString(), pushed, history }, null, 2), 'utf8');
}

async function push(urls, token) {
  if (!urls.length) return { success: 0, remain: null, skipped: true };
  const body = urls.join('\n') + '\n';
  const resp = await fetch(ENDPOINT + token, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body,
  });
  const text = await resp.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`接口返回非 JSON（HTTP ${resp.status}）：${text.slice(0, 200)}`);
  }
  if (json.error) {
    throw new Error(`接口报错：${json.error}${json.message ? ' - ' + json.message : ''}`);
  }
  return json;
}

(async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const statusOnly = process.argv.includes('--status');

  const all = readAllUrls();
  const { pushed, history } = readState();
  const pushedSet = new Set(pushed);
  const todo = all.filter((u) => !pushedSet.has(u));

  const pct = ((pushed.length / all.length) * 100).toFixed(1);
  console.log(`站点            : ${SITE}`);
  console.log(`sitemap 总数    : ${all.length}`);
  console.log(`已推送          : ${pushed.length}（${pct}%）`);
  console.log(`待推送          : ${todo.length}`);

  if (statusOnly || dryRun) {
    if (todo.length) console.log(`下一条          : ${todo[0]}`);
    return;
  }
  if (!todo.length) {
    console.log('✓ 全部 URL 已推送完毕，无需操作。');
    return;
  }

  const token = getToken();

  // 第一步：单条探测当天配额（remain 即为还能再推的条数）
  const probe = await push(todo.slice(0, 1), token);
  const dayHistory = { at: new Date().toISOString(), batches: [] };
  if (probe.success >= 1) {
    pushed.push(todo[0]);
    dayHistory.batches.push({ urls: [todo[0]], success: 1, note: '探测' });
    console.log(`探测            : 成功 1 条，当天剩余配额 ${probe.remain}`);
  } else {
    console.log(`探测            : 未成功（success=${probe.success}，not_valid=${JSON.stringify(probe.not_valid || [])}）`);
  }

  // 第二步：把当天剩余额度一次用满
  let quota = typeof probe.remain === 'number' ? probe.remain : 0;
  if (quota > 0 && todo.length > 1) {
    const batch = todo.slice(1, 1 + Math.min(quota, todo.length - 1));
    const r = await push(batch, token);
    const okCount = r.success || 0;
    // 接口不返回「哪几条成功」，按提交顺序取前 okCount 条（百度为顺序处理）
    const okUrls = batch.slice(0, okCount);
    pushed.push(...okUrls);
    dayHistory.batches.push({ urls: batch, success: okCount, note: '批量' });
    console.log(`批量            : 提交 ${batch.length} 条，成功 ${okCount} 条，剩余配额 ${r.remain}`);
    if (r.not_valid && r.not_valid.length) console.log(`  不合法 URL    : ${JSON.stringify(r.not_valid)}`);
    if (r.not_same_site && r.not_same_site.length) console.log(`  非本站 URL    : ${JSON.stringify(r.not_same_site)}`);
  }

  history.push(dayHistory);
  writeState(pushed, history);

  const left = all.length - pushed.length;
  console.log(`本次共推送      : ${pushed.length - (all.length - todo.length)} 条`);
  console.log(`累计已推送      : ${pushed.length} / ${all.length}，剩余 ${left} 条`);
  if (left > 0) {
    const days = Math.ceil(left / 10);
    console.log(`按 10 条/天估算 : 还需约 ${days} 天`);
  } else {
    console.log('✓ 全部推送完毕。');
  }
})().catch((e) => {
  console.error('✗ 推送失败：' + e.message);
  process.exit(1);
});

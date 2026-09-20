#!/usr/bin/env node
/**
 * 生成「百度资源平台 - 手动提交」用的分批 URL 清单。
 *
 * 背景：
 *   百度普通收录的「手动提交」输入框有两个硬限制——
 *     1. 每次最多 20 条链接（历史文案曾写 10 条，2026-09 实测界面为 20 条）
 *     2. 仅支持页面对应链接，不支持 sitemap 形式的文件提交
 *   所以需要把 sitemap.xml 里的全部 URL 拆成每批 20 条，方便老板一批批复制粘贴。
 *
 * 用法：
 *   node scripts/gen-baidu-batches.js
 * 输出：
 *   scripts/baidu-urls-batched.txt   （带批次标题，人读；复制时只选 URL 段）
 *   scripts/baidu-urls.txt           （纯 URL 一行一条，无任何杂质）
 *
 * 注意：本脚本与产物都位于 scripts/，已被 .assetsignore 排除，不会发布到线上。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BATCH = 20;

// 第一批优先提交：中文搜索需求最集中的页面（首页 + 高频工具）
// 这些 id 都经过 sitemap.xml 实际校验，写错会在下面直接报错退出。
const PRIORITY = [
  '',                  // 首页
  'mortgage',          // 房贷计算器
  'loan',              // 贷款计算器
  'compound',          // 复利计算器
  'bmi',               // BMI 计算器
  'salary',            // 工资计算器
  'qr',                // 二维码生成
  'password',          // 密码生成器
  'json',              // JSON 格式化
  'word-counter',      // 字数统计
  'percentage',        // 百分比计算
  'income-tax',        // 个税计算
  'vat',               // 增值税计算
  'calorie',           // 卡路里计算
  'age',               // 年龄计算
  'timestamp',         // 时间戳转换
  'base64',            // Base64 编解码
  'uuid',              // UUID 生成
  'hash',              // 哈希计算
  'regex',             // 正则测试
];

function readSitemapUrls() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

function batchOf(list, size = BATCH) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function main() {
  const all = readSitemapUrls();
  if (!all.length) {
    console.error('✗ sitemap.xml 里没读到任何 <loc>，请先跑 scripts/gen-static.js');
    process.exit(1);
  }

  const base = all[0].replace(/\/$/, ''); // https://tool.wululu.xyz
  const priorityUrls = PRIORITY.map((id) => (id ? `${base}/tool/${id}/` : `${base}/`));

  // 校验优先清单里的页面真实存在，避免提交 404 污染站点质量分
  const missing = priorityUrls.filter((u) => !all.includes(u));
  if (missing.length) {
    console.error('✗ 优先清单里有 sitemap 中不存在的 URL，请检查 id 拼写：');
    missing.forEach((u) => console.error('   ' + u));
    process.exit(1);
  }

  // 第一批 = 优先清单；其余按 sitemap 原顺序补齐，保证 156 条不漏不重
  const rest = all.filter((u) => !priorityUrls.includes(u));
  const batches = batchOf([...priorityUrls, ...rest]);

  const header = (i) => {
    const start = i * BATCH + 1;
    const end = Math.min((i + 1) * BATCH, all.length);
    return `########## 第 ${i + 1} 批（第 ${start}-${end} 条，共 ${end - start + 1} 条）##########`;
  };

  const batched = batches.map((b, i) => `${header(i)}\n${b.join('\n')}`).join('\n\n');

  fs.writeFileSync(path.join(__dirname, 'baidu-urls-batched.txt'), batched + '\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, 'baidu-urls.txt'), all.join('\n') + '\n', 'utf8');

  console.log(`✓ URL 总数      : ${all.length}`);
  console.log(`✓ 分批数        : ${batches.length} 批（每批 ${BATCH} 条，末批 ${batches.at(-1).length} 条）`);
  console.log(`✓ 第 1 批       : 优先页 ${priorityUrls.length} 条（首页 + 高频工具）`);
  console.log(`✓ 去重校验      : ${new Set(all).size === all.length ? '通过（无重复）' : '失败（sitemap 内有重复 URL）'}`);
  console.log('  输出 → scripts/baidu-urls-batched.txt（带批次标题，便于分批复制）');
  console.log('  输出 → scripts/baidu-urls.txt        （纯 URL，一行一条）');
}

main();

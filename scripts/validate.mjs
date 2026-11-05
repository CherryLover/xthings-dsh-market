#!/usr/bin/env node
// 用 DSH 自带的官方校验器校验 market.json。
// 依赖：无（不需要 npm install）。需要本机装有 DeepSeek Harness。
// 用法：node scripts/validate.mjs [路径]  默认校验仓库根目录的 market.json。

import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");

const DEFAULT_VALIDATOR =
  "/Applications/DeepSeek Harness.app/Contents/Resources/app/dsh/node_modules/@deepseek-ai/dsh-plugin-market-index/lib/index.js";

const VALIDATOR_PATH = process.env.DSH_MARKET_INDEX_VALIDATOR || DEFAULT_VALIDATOR;

// 索引里的相对 icon 路径要相对一个绝对 URL 解析，这里用线上地址当基准。
const INDEX_URL =
  process.env.DSH_MARKET_INDEX_URL ||
  "https://cherrylover.github.io/xthings-dsh-market/market.json";

const target = path.resolve(process.argv[2] || path.join(REPO_ROOT, "market.json"));

function die(message) {
  console.error(`FAIL ${target}`);
  console.error(message);
  process.exit(1);
}

let parseMarketIndex;
try {
  ({ parseMarketIndex } = await import(pathToFileURL(VALIDATOR_PATH).href));
} catch (error) {
  die(
    `无法加载 DSH 官方校验器：${VALIDATOR_PATH}\n` +
      `${error && error.message ? error.message : String(error)}\n` +
      `如果 Harness 装在别处，用环境变量 DSH_MARKET_INDEX_VALIDATOR 指向 ` +
      `@deepseek-ai/dsh-plugin-market-index/lib/index.js。`,
  );
}

if (typeof parseMarketIndex !== "function") {
  die(`校验器没有导出 parseMarketIndex：${VALIDATOR_PATH}`);
}

let raw;
try {
  raw = await readFile(target, "utf8");
} catch (error) {
  die(`读不到文件：${error && error.message ? error.message : String(error)}`);
}

let value;
try {
  value = JSON.parse(raw);
} catch (error) {
  die(`不是合法 JSON：${error && error.message ? error.message : String(error)}`);
}

try {
  const index = parseMarketIndex(value, INDEX_URL);
  console.log(`OK ${index.plugins.length} plugins`);
} catch (error) {
  die(error && error.message ? error.message : String(error));
}

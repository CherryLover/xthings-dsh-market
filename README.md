# Xthings 插件源

这个仓库只有一个文件：`market.json`，它是 DeepSeek Harness 的插件市场索引（`format: 1`）。
GitHub Pages 直接发布仓库根目录，所以**改 `market.json` 就是改线上内容**。

## 订阅地址

```
https://cherrylover.github.io/xthings-dsh-market/market.json
```

把这个地址填进 DSH 的插件市场配置即可。不要用 `raw.githubusercontent.com` 的地址。

## 改完先自检

```bash
node scripts/validate.mjs
```

打印 `OK` 加插件数量才算通过；报错会指出具体是哪个字段不对，照着改。

## 新增或更新一个插件（10 行版）

1. 在 `metadata.categories` / `metadata.labels` 里先**声明**要用的分类和标签（没声明就直接引用会报错）。
2. 在 `plugins` 数组里加一个对象，或修改已有对象；`name` 全局唯一。
3. npm 来源：`"source": { "type": "npm" }`，私有源再加 `"registry": "https://..."`。
4. git 来源：`"source": { "type": "git", "url": "https://github.com/you/repo", "commit": "<40 位 sha>", "path": "子目录" }`（`path` 只在包不在仓库根时写，commit 必须写死，不能用分支名）。
5. `versions` 里加一项：`"version": "1.2.3"`、`"publishTimestamp": 1730000000`、`"source": {...}`。
6. `version` 必须是标准 SemVer（`1.2.3`、`1.2.3-rc.1`），`publishTimestamp` 必须是整数 Unix 秒。
7. `title` / `description` 以及 `metadata.categories.*.title`、`metadata.labels.*.title` 都是 `{ "en": "...", "zh": "..." }` 双语对象，两种语言都要写。
8. 插件的 `metadata.category` / `metadata.labels` 只能填第 1 步里已经声明的 key。
9. 不要写 `defaultVersion`：客户端自己算，写进去是脏数据。
10. `node scripts/validate.mjs` → `git commit` → `git push`，1～2 分钟后线上生效。

## 几条容易踩的规则

- `format` 必须是数字 `1`，不能是字符串。
- `metadata.categories` / `metadata.labels` 是**字典**（key 是 id），不是数组。
- 分类和标签必须"先声明、后使用"，拼错 key 会直接校验失败。
- `versions[].version` 必须精确 SemVer，`publishTimestamp` 必须是整数 Unix 秒（不是毫秒、不是字符串）。
- `defaultVersion` 由客户端计算，文件里永远不写。
- 没有构建步骤、没有依赖：改完 JSON 推上去就完事。

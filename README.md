# Xthings 插件源

这个仓库只有一个文件：`market.json`，它是 DeepSeek Harness 的插件市场索引（`format: 1`）。
GitHub Pages 直接发布仓库根目录，所以**改 `market.json` 就是改线上内容**。

## 订阅地址

```
https://cherrylover.github.io/xthings-dsh-market/market.json
```

把这个地址填进 DSH 的插件市场配置即可。不要用 `raw.githubusercontent.com` 的地址。

## 设计与创作插件

市场收录了 [Jim Liu 宝玉的 baoyu-design DSH 插件](https://github.com/JimLiu/baoyu-design/tree/main/dsh-plugins)，归入「设计与创作」分类：

| 插件 | npm 包名 | 收录版本 |
| --- | --- | --- |
| Claude 作品（共用基础插件） | `dsh-claude-artifacts` | 2.11.1 |
| Claude 数据看板 | `dsh-claude-dashboard` | 2.11.1 |
| Claude 设计稿 | `dsh-claude-design` | 2.11.1 |
| Claude 设计系统 | `dsh-claude-design-system` | 2.11.1 |
| Claude 动画 | `dsh-claude-motion` | 2.11.1 |
| Claude 幻灯片 | `dsh-claude-slides` | 2.11.1 |

这些条目的作者、图标、说明、版本与兼容范围来自[上游官方市场索引](https://jimliu.github.io/baoyu-design/dsh-plugins/index.json)，安装来源为 npm。当前是审核后的版本快照，不会自动同步上游新版本；更新时应重新检查官方索引和 npm 发布信息。

插件仍由使用者自行点击安装；五个创作插件会自动依赖共用的 `dsh-claude-artifacts`，不必先单独安装它。按上游说明，安装并启用后需要完整退出并重新打开 DSH，侧栏才会出现「作品」入口；使用新技能应新开会话。

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

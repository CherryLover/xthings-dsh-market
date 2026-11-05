#!/usr/bin/env node
/**
 * CI 用的索引自检。不依赖本机装没装 DeepSeek Harness，也不需要 npm install。
 *
 * 查的是"人肉容易写错、写错了所有人一起中招"的那几件事：
 *   - JSON 能不能解析、format 是不是 1
 *   - 插件条目有没有重名、必填字段全不全
 *   - 每个版本的 source 形状对不对
 *   - git 源里那个 commit 在仓库里真的存在（不然同事点安装必然失败）
 *
 * 用法：node scripts/ci-check.mjs [路径]
 * 环境变量：GITHUB_TOKEN（可选，提一下 API 限额）
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'

const file = process.argv[2] ?? 'market.json'
const problems = []
const notes = []

const fail = (message) => problems.push(message)

let index
try {
  index = JSON.parse(await readFile(path.resolve(file), 'utf8'))
} catch (error) {
  console.error(`✗ ${file} 解析失败：${error.message}`)
  process.exit(1)
}

if (index.format !== 1) fail(`format 应该是 1，实际是 ${JSON.stringify(index.format)}`)
if (!Array.isArray(index.plugins) || index.plugins.length === 0) fail('plugins 必须是非空数组')

const categories = Object.keys(index.metadata?.categories ?? {})
const labels = Object.keys(index.metadata?.labels ?? {})

const seen = new Set()
for (const [position, entry] of (index.plugins ?? []).entries()) {
  const where = `plugins[${position}]${entry?.name ? ` (${entry.name})` : ''}`

  for (const field of ['name', 'title', 'description']) {
    if (!entry?.[field]) fail(`${where} 缺 ${field}`)
  }
  if (seen.has(entry?.name)) fail(`${where} 名字重复`)
  seen.add(entry?.name)

  const category = entry?.metadata?.category
  if (category && !categories.includes(category)) {
    fail(`${where} 的 category "${category}" 不在 metadata.categories 里（${categories.join(', ')}）`)
  }
  for (const label of entry?.metadata?.labels ?? []) {
    if (!labels.includes(label)) fail(`${where} 的 label "${label}" 不在 metadata.labels 里（${labels.join(', ')}）`)
  }

  if (!Array.isArray(entry?.versions) || entry.versions.length === 0) {
    fail(`${where} 没有 versions`)
    continue
  }

  for (const version of entry.versions) {
    const tag = `${where} ${version?.version ?? '?'}`
    if (!version?.version) fail(`${tag} 缺 version`)
    if (version?.source?.type !== 'git' && version?.source?.type !== 'npm') {
      fail(`${tag} 的 source.type 只能是 git 或 npm，实际是 ${JSON.stringify(version?.source?.type)}`)
    }
    if (version?.source?.type === 'git') {
      if (!version.source.url) fail(`${tag} 的 git 源缺 url`)
      if (!/^[0-9a-f]{40}$/.test(version.source.commit ?? '')) {
        fail(`${tag} 的 git 源需要 40 位完整 commit，实际是 ${JSON.stringify(version.source.commit)}`)
        continue
      }
      // 形状对了不代表 commit 存在：真去问一次，404 就是死链
      const match = /github\.com[/:]([^/]+)\/([^/#.]+)/.exec(version.source.url)
      if (!match) {
        notes.push(`${tag} 不是 GitHub 地址，跳过 commit 存在性检查`)
        continue
      }
      const [, owner, repo] = match
      const api = `https://api.github.com/repos/${owner}/${repo}/commits/${version.source.commit}`
      const headers = { accept: 'application/vnd.github+json' }
      if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`
      try {
        const response = await fetch(api, { headers })
        if (!response.ok) fail(`${tag} 的 commit ${version.source.commit.slice(0, 7)} 在 ${owner}/${repo} 里查不到（HTTP ${response.status}）`)
        else notes.push(`${tag} → ${owner}/${repo}@${version.source.commit.slice(0, 7)} 存在`)
      } catch (error) {
        notes.push(`${tag} 查不了 GitHub API（${error.message}），跳过`)
      }
    }
    if (version?.source?.type === 'npm') {
      try {
        const response = await fetch(`https://registry.npmjs.org/${entry.name}/${version.version}`)
        if (!response.ok) fail(`${tag} 在 npm 上查不到（HTTP ${response.status}）`)
        else notes.push(`${tag} → npm 上存在`)
      } catch (error) {
        notes.push(`${tag} 查不了 npm（${error.message}），跳过`)
      }
    }
  }
}

for (const note of notes) console.log(`· ${note}`)

if (problems.length) {
  console.error(`\n✗ ${problems.length} 个问题：`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(`\n✓ ${index.plugins.length} 个插件，索引没问题`)

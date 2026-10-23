# 线上版本存档快照（2026-10-23）

本分支保存 2026-10-23 从 https://keyword.botclaw.eu.cc/ 实际抓取的线上静态文件，
用于在重做 v2 之前抢救线上源码。抓取时间为 2026-10-23 21:28（Asia/Shanghai）。

## 文件与 MD5

| 文件 | 字节 | MD5 |
|---|---|---|
| index.html | 29247 | c8a74cca6d6f37acfaad0df1c98d417d |
| src/app.js | 40276 | ae93a7b14dbc938abe85e33287998f79 |
| src/data.js | 16171 | d8cc0883852bbd42051dbda6776e65c1 |
| src/prompt-builder.js | 23725 | 8b17649860ff8a1febbfb4862e9a3e04 |
| src/storage.js | 13576 | 16040bef8c1164b8f404fe5d343ed3ff |
| src/styles.css | 28777 | 80d7b578c9edad7d8545af6c8ba28f43 |

## 重要说明

- 本分支从 master（053b1b0，2026-06-05）分出。master 里的 index.html / src/*
  是旧版，与线上不一致；本分支已用线上文件覆盖同名路径。
- `src/prompt-builder.js` 是线上新增文件，master 中不存在。
- **api/ 目录仍是 master 的旧版代码，不是线上运行的服务端代码。** 线上的
  /api/generate 与 /api/enhance 服务端源码无法通过 HTTP 获取，未能抢救；
  已知线上行为（2026-10-23 实测）：/api/generate 走 Agnes
  agnes-image-2.0-flash；/api/enhance 走 Gemini gemini-3.1-flash-image，
  免费档配额为 0，返回 429。
- 本分支仅作存档，不要合并回 master，不要用它部署生产。

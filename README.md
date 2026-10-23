# 提示词工坊（原「Lucky Girl的专家提示词系统」v2）

一句话想法 → AI 生成可直接出图的英文提示词（平衡 / 冲击 / 克制三个方向）→ 一键生图。

线上：https://keyword.botclaw.eu.cc/ （Vercel）
预览：https://keyword-v2-preview.pages.dev （Cloudflare Pages，代码在 ~/workspace/keyword-v2/preview，逻辑与正式站一致）

## v2 架构（2026-10-23 重做）

- **提示词生成** `api/prompt.js`：服务端调 Agnes `agnes-3.0-flash`，一次生成 3 个真候选
  （英文主词 + 负面词 + 11 个结构化字段 + 中文说明）。429 时退避重试（15s / 30s，
  Agnes 按来源 IP 限流）。前端失败时自动用本地模板兜底（`src/fallback.js`）并明确标注。
- **生图** `api/generate.js`：按实测路由——1:1 走 9router
  （`ag/gemini-3.8-flash-high`，约 15–20 秒，固定输出 1024×1024 JPEG）；
  非方形走 Agnes 图片（能按比例，耗时波动大）；失败互为兜底。
  前端超时 300 秒、显示已等待秒数、生成后标注实际像素尺寸。
- **UI**：暖纸质感（米纸底 + 奶油面板 + 砖红强调 + 暖棕深色模式），系统字体，
  无第三方字体/脚本依赖。中国访问优化：不加载 Google Fonts、接口函数钉在
  Vercel 香港区（hkg1）、单次调用出结果（旧版 AI 向导要串行 4 次）、
  长超时 + 重试 + 本地兜底扛网络波动。

## 环境变量（Vercel 项目 Settings → Environment Variables）

| 变量 | 必需 | 说明 |
|---|---|---|
| `AGNES_API_KEY` | 是 | 提示词生成 + Agnes 生图兜底 |
| `NINEROUTER_API_KEY` | 是（方图快速通道） | 9router 远程访问 Key；未配置时生图全走 Agnes |
| `NINEROUTER_BASE_URL` | 否 | 默认 `https://ai.leobobby.dpdns.org/v1` |
| `IMAGE_MODEL` | 否 | 默认 `ag/gemini-3.8-flash-high` |
| `AGNES_MODEL` | 否 | 默认 `agnes-3.0-flash` |
| `AGNES_IMAGE_MODEL` | 否 | 默认 `agnes-image-2.0-flash` |

## 历史

- 旧版线上源码（与本仓库旧 master 脱节的那一版）已存档在分支
  `archive/live-2026-10-23`，见该分支的 `SNAPSHOT.md`。
- `src/data.js`、`src/storage.js`、`tests/` 为旧版遗留，v2 前端未引用，保留备查。

# Lucky Girl的专家提示词系统

一个简洁美观的 AI 绘图提示词生成工具，支持一键生成专业级提示词和 AI 图片生成。

## 功能

- 输入描述自动生成工业级专家提示词
- 多种风格选择（摄影/插画/动漫/概念/3D）
- 支持手动微调编辑
- 一键复制到剪贴板
- 预设模板快速开始
- 常用提示词元素库
- 历史记录、收藏夹和使用统计
- 一键生成 AI 图片（Agnes AI 图片生成）

## 技术栈

- 前端：原生 HTML/CSS/JavaScript + Vite
- 后端：Node.js（Vercel Serverless Functions）
- 测试：Vitest + jsdom
- 图片生成：Agnes AI Images API（默认） + Gemini API（可选回退）

## 本地开发

1. 安装依赖：

```bash
npm install
```

2. 启动开发服务器：

```bash
npm run dev
```

3. 运行测试：

```bash
npm test
```

4. 构建生产版本：

```bash
npm run build
```

## 部署方式

### Vercel（推荐）

项目包含 `api/generate.js`，图片生成功能依赖 Vercel Serverless Functions，推荐使用 Vercel 部署。

1. 安装 Vercel CLI：

```bash
npm i -g vercel
```

2. 在项目目录执行：

```bash
vercel
```

3. 连接 GitHub 仓库后，Vercel 会在每次推送后自动部署。

4. 在 Vercel Dashboard → Project → Settings → Environment Variables 配置环境变量。

### GitHub Pages

GitHub Pages 只能部署静态前端，不能运行 `api/generate.js`。使用 GitHub Pages 时：

- 提示词生成、复制、历史记录、收藏等纯前端功能可用。
- AI 图片生成不可用，除非另外部署后端 API 并修改前端请求地址。

## 环境变量配置

部署到 Vercel 后需要配置以下环境变量：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `AI_IMAGE_PROVIDER` | 否 | 图片生成 Provider，默认 `agnes`，可选 `gemini` |
| `GEMINI_API_KEY` | 是（gemini模式下）| Google Gemini API Key |
| `GEMINI_MODEL` | 否 | 图片生成模型名称，默认：`gemini-3.1-flash-image-preview` |
| `AGNES_API_KEY` | 是（agnes模式下）| Agnes AI API Key |
| `AGNES_IMAGE_MODEL` | 否 | Agnes 图像模型，默认：`agnes-image-2.0-flash` |

### 获取 GEMINI_API_KEY

1. 访问 Google AI Studio 的 API Key 页面。
2. 点击 **Create API Key in new project**。
3. 复制生成的 Key，并配置到 Vercel 环境变量中。

### 获取 AGNES_API_KEY（默认推荐）

Agnes AI 提供免费无限期的文生图 API。

1. 访问 [Agnes AI Platform](https://platform.agnes-ai.com/) 注册账号。
2. 登录后在 Dashboard 创建 API Key。
3. 配置环境变量：
   - `AGNES_API_KEY=你的API密钥`
   - `AGNES_IMAGE_MODEL=agnes-image-2.0-flash`

默认情况下，项目会直接使用 Agnes 作为图片生成后端；只有在需要回退到 Gemini 时，才需要显式设置：

- `AI_IMAGE_PROVIDER=gemini`
- `GEMINI_API_KEY=你的Gemini密钥`

### 模型配置

- Agnes 默认模型为 `agnes-image-2.0-flash`。
- 如果需要切回 Gemini，默认模型为 `gemini-3.1-flash-image-preview`。
- 如果某个 Provider 返回模型不可用或不支持图片生成，请在对应平台确认账号可用模型，并通过 `AGNES_IMAGE_MODEL` 或 `GEMINI_MODEL` 覆盖默认值。

## 文件结构

```text
├── index.html          # 页面入口
├── src/
│   ├── app.js          # 前端交互与图片生成调用
│   ├── data.js         # 风格、模板和变量数据
│   ├── storage.js      # 本地存储、历史、收藏和统计
│   └── styles.css      # 页面样式
├── api/
│   └── generate.js     # Vercel Serverless 图片生成 API
├── tests/              # Vitest 测试
├── package.json        # npm 脚本和依赖
├── vite.config.js      # Vite 配置
├── vitest.config.js    # Vitest 配置
└── vercel.json         # Vercel 配置
```

## 使用说明

### 提示词生成

1. 输入描述或选择模板生成提示词。
2. 点击「生成提示词」按钮。
3. 复制提示词到其他 AI 绘图工具使用。

### 图片生成

1. 生成或输入提示词。
2. 点击「生成图片」按钮。
3. 等待图片生成完成。
4. 下载或重新生成。

## 许可证

MIT License

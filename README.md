# Lucky Girl的专家提示词系统

一个简洁美观的 AI 绘图提示词生成工具，支持一键生成专业级提示词和 AI 图片生成。

## 功能

- 🎯 输入描述自动生成工业级专家提示词
- 🎨 多种风格选择（摄影/插画/动漫/概念/3D）
- ✏️ 支持手动微调编辑
- 📋 一键复制到剪贴板
- 🚀 预设模板快速开始
- 💡 常用提示词元素库
- 🖼️ **一键生成 AI 图片**（Gemini 图片生成）

## 部署方式

### 方式一：Vercel（推荐）

1. 安装 Vercel CLI：
```bash
npm i -g vercel
```

2. 在项目目录执行：
```bash
vercel
```

3. 连接 GitHub 仓库后，Vercel 会自动部署

4. 自定义域名：在 Vercel Dashboard → 项目 → Settings → Domains 添加你的域名

### 方式二：GitHub Pages

1. 将 `index.html` 推送到 GitHub 仓库
2. 进入仓库 Settings → Pages
3. Source 选择 `main` 分支
4. 域名在 Settings → Custom Domain 设置

## 环境变量配置

部署到 Vercel 后需要配置以下环境变量：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API Key |
| `GEMINI_MODEL` | ❌ | 模型名称（默认：`gemini-3.1-flash-image-preview`） |

### 获取 GEMINI_API_KEY

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 点击 **Create API Key in new project**
3. 复制生成的 Key

### 推荐模型

| 模型 | 说明 |
|------|------|
| `gemini-3.1-flash-image-preview` | 推荐，免费额度支持 |
| `gemini-2.0-flash-exp` | 备选 |

## 文件结构

```
├── index.html      # 前端页面
├── api/
│   └── generate.js # 后端 API（图片生成）
├── vercel.json     # Vercel 配置
└── README.md       # 说明文档
```

## 使用说明

### 提示词生成
1. 输入描述或选择模板生成提示词
2. 点击「生成提示词」按钮
3. 复制提示词到其他 AI 绘图工具使用

### 图片生成
1. 生成或输入提示词
2. 点击「🎨 生成图片」按钮
3. 等待图片生成完成
4. 下载或重新生成

## 技术栈

- 前端：原生 HTML/CSS/JavaScript
- 后端：Node.js (Vercel Serverless Functions)
- 图片生成：Google Gemini API

## 许可证

MIT License

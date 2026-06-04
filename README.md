# AI绘图提示词生成器

一个简洁美观的 AI 绘图提示词生成工具，支持中英文双语。

## 功能

- 🎯 输入描述自动生成专业提示词
- 🎨 多种风格选择（摄影/插画/动漫/概念/3D）
- ✏️ 支持手动微调编辑
- 📋 一键复制到剪贴板
- 🚀 预设模板快速开始
- 💡 常用提示词元素库

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

### 方式三：Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages → 创建应用程序
3. 选择「上传网页」
4. 上传所有文件
5. 设置自定义域名

## 文件结构

```
├── index.html      # 主页面（完整单页应用）
├── README.md       # 说明文档
└── vercel.json    # Vercel 配置文件（可选）
```

## 使用说明

1. 直接打开 `index.html` 即可在本地使用
2. 无需后端，纯前端应用
3. 支持所有现代浏览器

## 许可证

MIT License

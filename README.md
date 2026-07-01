# 翻墙代理工具

支持在中国大陆访问被墙网站的反向代理工具。

## 功能特性

✅ **反向代理** - 通过国外服务器访问被墙网站  
✅ **广告过滤** - 自动移除 HTML 中的广告脚本和追踪代码  
✅ **无需 VPS** - 免费部署到 Vercel（国外服务器）  
✅ **简洁易用** - 美观的 Web 界面  
✅ **支持 JSON** - 可直接访问 API 接口  

## 快速开始

### 1. 部署到 Vercel（推荐）

1. Fork 或 Clone 这个仓库
2. 访问 [Vercel](https://vercel.com)，用 GitHub 账号登录
3. 点击 "New Project" → 选择你的仓库
4. Vercel 会自动检测配置并部署
5. 部署完成后，会给你一个域名（例如：`xxx.vercel.app`）

### 2. 本地开发测试

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

然后访问 `http://localhost:3000`

### 3. 使用方法

1. 打开网页：`https://你的vercel域名`
2. 输入想要访问的 URL（必须包含 `https://`）
3. 点击"访问"按钮
4. 等待加载，即可查看内容

## 如何移除广告

代理会自动移除：
- 外链脚本 `<script>`
- 嵌入窗口 `<iframe>`  
- Google AdSense `<ins>`
- HTML 注释

## 配置说明

- `api/proxy.js` - Vercel 后端代理函数
- `index.html` - 前端界面
- `package.json` - 依赖配置
- `vercel.json` - Vercel 部署配置

## 限制说明

- Vercel 免费方案：单次请求超时 10 秒
- 返回数据大小限制：约 6 MB
- 可能需要等待首次冷启动（3-5 秒）

## 注意事项

⚠️ 请合法使用此工具，仅用于学习和开发目的  
⚠️ 不建议访问非法内容  
⚠️ 某些网站可能有防爬虫机制

## 支持的 URL 格式

✅ `https://www.google.com`  
✅ `https://api.github.com/repos`  
✅ `http://httpbin.org/get`  
✅ `https://www.wikipedia.org`  

## 故障排查

### 显示"请求失败"
- 检查 URL 格式是否正确（必须包含 http:// 或 https://）
- 检查网络连接
- 某些网站可能需要特殊 User-Agent 或 Cookie

### 加载很慢
- 首次请求会有冷启动延迟
- 大文件传输本身就较慢
- 尝试访问其他网站确认是否是特定网站的问题

### 显示空白页面
- 该网站可能返回了特殊格式内容
- 某些网站使用 JavaScript 动态加载，本工具无法处理

## 更多配置

可以编辑 `api/proxy.js` 来：
- 添加更多广告过滤规则
- 修改超时时间
- 添加自定义请求头
- 实现缓存功能

---

由 Copilot 为你配置 ✨

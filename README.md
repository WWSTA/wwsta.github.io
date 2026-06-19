# GitHub Pages 个人主页

一个采用 GitHub 风格的个人主页网站。

## 项目结构

```
github-page/
├── index.html    # 主页 HTML 文件
├── styles.css    # 样式文件
├── script.js    # JavaScript 文件
└── README.md    # 说明文档
```

## 功能特点

- **GitHub 风格设计**：采用 GitHub 官方网站配色和交互风格
- **响应式布局**：适配各种设备尺寸
- **平滑滚动**：页面导航平滑滚动
- **项目展示**：展示项目详情和链接
- **技能标签**：动态技能展示

## 部署到 GitHub Pages

### 方法一：通过 GitHub 仓库部署

1. **创建 GitHub 仓库**
   - 登录 GitHub 账号
   - 创建一个新仓库，仓库名为 `username.github.io`（其中 `username` 是你的 GitHub 用户名）
   - 或者使用其他任意仓库名

2. **上传文件**
   - 将 `index.html`、`styles.css`、`script.js` 上传到仓库

3. **启用 GitHub Pages**
   - 进入仓库的 **Settings**
   - 找到 **Pages** 选项
   - 在 **Build and deployment** 部分，选择 **Source** 为 `Deploy from a branch`
   - 选择 **Branch** 为 `main` 或 `master`
   - 点击 **Save**

4. **访问网站**
   - 等待几分钟，GitHub 部署完成后，网站将可通过以下地址访问：
     - 如果仓库名为 `username.github.io`：`https://username.github.io/`
     - 其他仓库名：`https://username.github.io/repo-name/`

### 方法二：通过 Git 命令部署

```bash
# 初始化 Git 仓库
git init

# 添加文件
git add index.html styles.css script.js

# 提交更改
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/username/repo-name.git

# 推送到 GitHub
git push -u origin main
```

然后按照方法一中的步骤 3 启用 GitHub Pages。

## 自定义内容

### 修改个人信息

编辑 `index.html` 文件中的以下部分：

```html
<h1 class="name">Hello, I'm Developer</h1>
<p class="username">@developer</p>
<p class="description">
    全栈开发者，热爱开源，专注于构建优雅且高效的Web应用。
</p>
```

### 修改技能标签

在 `index.html` 中找到 `.skill-list` 部分修改或添加技能：

```html
<ul class="skill-list">
    <li><span class="skill-tag">JavaScript</span></li>
    <!-- 添加或修改你的技能 -->
</ul>
```

### 修改项目信息

在 `index.html` 中的 `.project-card` 部分修改项目：

```html
<article class="project-card">
    <div class="project-header">
        <h3 class="project-name">项目名称</h3>
    </div>
    <p class="project-description">项目描述</p>
    <div class="project-links">
        <a href="GitHub链接" class="project-link">GitHub</a>
        <a href="体验链接" class="project-link demo-link">体验</a>
    </div>
</article>
```

### 修改联系方式

在 `index.html` 中的 `.contact-content` 部分修改：

```html
<div class="contact-item">
    <a href="你的链接" class="contact-link">联系方式</a>
</div>
```

## 本地预览

直接在浏览器中打开 `index.html` 文件即可预览网站效果。

## 浏览器支持

- Chrome
- Firefox
- Safari
- Edge

## 许可证

MIT License

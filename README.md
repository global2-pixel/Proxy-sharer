# 代理节点分享平台 (Proxy Sharer)

这是一个功能完善的全栈 Web 应用，旨在提供一个安全、便捷的平台，供用户分享和验证代理节点。项目特色是集成了第三方 OAuth 2.0 认证，并拥有一个使用 Tailwind CSS 构建的现代化、响应式前端界面。

**[➡️ 点击查看线上 Demo](https://your-render-url.onrender.com)** *(请将此链接替换为你自己在 Render 上部署的应用地址)*

---

## ✨ 主要功能

- **节点分享**: 登录用户可以分享代理节点，并附带地区、IP 类型、预计剩余流量等元数据。
- **安全认证**: 集成第三方 OAuth 2.0 提供商 (Linux.do) 进行用户登录和身份验证，无需管理用户密码。
- **权限管理**: 用户只能删除自己分享的节点，保证了数据的归属权和安全性。
- **社区反馈**: 所有登录用户都可以对节点进行“有效” (👍) 或“无效” (👎) 的标注，为其他用户提供参考。
- **动态界面**: 前端通过 API 与后端实时交互，所有操作（登录、分享、投票、删除）都能即时在界面上得到反馈。

---

## 🛠️ 技术栈

这个项目采用了前后端分离的现代 Web 架构。

#### **后端 (Backend)**
- **运行时**: Node.js
- **Web 框架**: Express.js
- **数据库**: SQLite 3
- **认证**: Passport.js (OAuth 2.0 策略)
- **会话管理**: express-session

#### **前端 (Frontend)**
- **核心**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **CSS 框架**: Tailwind CSS

#### **部署 (Deployment)**
- **版本控制**: Git & GitHub
- **托管平台**: Render.com (Web Service + Persistent Disk)

---

## 🚀 本地开发指南

按照以下步骤，你可以在自己的电脑上运行此项目。

### **前提条件**
- [Node.js](https://nodejs.org/) (版本 >= 18.0.0)
- [Git](https://git-scm.com/)
- 一个在 [Linux.do](https://linux.do/) 注册的 OAuth 应用

### **安装与设置**

1.  **克隆仓库**
    ```bash
    git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
    cd your-repo-name
    ```

2.  **安装所有依赖**
    项目根目录下有一个 `package.json` 文件，它包含了可以一键安装前后端所有依赖的脚本。
    ```bash
    npm run install:all
    ```

3.  **配置环境变量**
    - 将项目根目录下的 `.env.example` 文件复制一份，并重命名为 `.env`。
    - 按照 `.env.example` 中的说明，填入你自己的密钥和配置。你的 `Linux.do` 应用的回调地址在本地开发时应设置为：
      `http://127.0.0.1:3001/api/auth/linuxdo/callback`

4.  **运行开发服务器**
    - **启动后端服务器 (带热重载)**:
      ```bash
      npm run dev:server
      ```
    - **启动前端 Tailwind 编译 (带实时监听)**:
      ```bash
      npm run dev:client
      ```

5.  **访问应用**
    - 在你的浏览器中打开 [http://127.0.0.1:5500](http://127.0.0.1:5500) (建议使用 VS Code 的 Live Server 插件打开 `client/index.html` 文件)。

### **环境变量**
你需要创建一个 `.env` 文件，并填入以下变量：

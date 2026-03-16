# 🚀 快速部署指南

## ✅ 当前状态

**后端 (Firebase)**
- ✅ Cloud Functions 已部署
- ✅ Firestore 数据库就绪
- API 地址: `https://us-central1-kkkpoker510.cloudfunctions.net`

**前端 (待部署)**
- ✅ 生产构建已就绪
- 📦 构建位置: `apps/web/.next`

---

## 方法一：Vercel 一键部署（最简单）

### 步骤 1：在终端运行
```bash
cd /Users/yinshi/Documents/510k/apps/web
npx vercel --prod
```

### 步骤 2：按提示操作
1. 输入 `y` 确认部署
2. 如果提示登录，选择 `Continue with GitHub`
3. 浏览器会自动打开授权页面
4. 授权完成后回到终端

### 步骤 3：完成部署
等待部署完成，你会看到类似：
```
🔍  Inspect: https://vercel.com/yourname/510k/xxxx
✅  Production: https://510k-xxxxx.vercel.app
```

---

## 方法二：GitHub + Vercel 自动部署

### 步骤 1：创建 GitHub 仓库
```bash
cd /Users/yinshi/Documents/510k

# 初始化 git
git init
git add .
git commit -m "Initial commit"

# 创建 GitHub 仓库
gh repo create 510k --public --source=. --remote=origin --push
```

### 步骤 2：在 Vercel 导入项目
1. 访问 https://vercel.com/new
2. 点击 `Import Git Repository`
3. 选择 `510k` 仓库
4. Root Directory 设置为 `apps/web`
5. 点击 `Deploy`

### 步骤 3：配置环境变量
在 Vercel Project Settings → Environment Variables 中添加：
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyATDt2S5iBOIfyoLhqdJKBdMRwGwRbgvqM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kkkpoker510.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kkkpoker510
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kkkpoker510.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=465331434483
NEXT_PUBLIC_FIREBASE_APP_ID=1:465331434483:web:3e0fad9116920f500e5886
NEXT_PUBLIC_USE_EMULATORS=false
```

---

## 方法三：手动上传部署

### 步骤 1：准备构建文件
```bash
cd /Users/yinshi/Documents/510k/apps/web
npm run build
```

### 步骤 2：使用 Vercel CLI 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

---

## 📱 iPhone 访问

部署成功后，用 iPhone 访问你的 Vercel URL：
- `https://510k-xxxxx.vercel.app`

### PWA 支持
可以将网页添加到主屏幕：
1. Safari 打开网站
2. 点击分享按钮 ⬆️
3. 选择"添加到主屏幕"
4. 像原生 App 一样使用！

---

## 🔧 生产环境配置

### Firebase 配置已就绪
- 项目 ID: `kkkpoker510`
- 区域: `us-central1`
- 身份验证: 匿名登录已启用

### 需要配置的（如需自定义域名）
1. 在 Vercel 添加自定义域名
2. 在 Firebase Auth 添加授权域名
3. 更新 Firestore 安全规则（如需要）

---

## ⚡ 快速部署命令

```bash
# 一键部署（推荐）
cd /Users/yinshi/Documents/510k/apps/web && npx vercel --prod
```

---

## 🆘 常见问题

### Q: 部署后 API 报错？
A: 确保 Firebase Functions 已部署：
```bash
cd /Users/yinshi/Documents/510k/backend
firebase deploy --only functions
```

### Q: iPhone 无法访问？
A: 检查 Firebase Auth 授权域名：
1. Firebase Console → Authentication → Settings → Authorized domains
2. 添加你的 Vercel 域名

### Q: 样式没有更新？
A: 清除浏览器缓存或强制刷新 (Cmd+Shift+R / Ctrl+F5)

---

## 📞 需要帮助？

查看详细文档：
- `DEPLOY.md` - 完整部署指南
- `ARCHITECTURE.md` - 架构说明
- `CLIENT_INTEGRATION.md` - 前端集成

---

**现在运行 `npx vercel --prod` 开始部署！** 🚀

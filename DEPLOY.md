# 🚀 部署指南 - 让 iPhone 访问

## 方案一：Vercel 部署（推荐）

### 步骤 1: 安装 Vercel CLI
```bash
npm i -g vercel
```

### 步骤 2: 登录 Vercel
```bash
vercel login
```
- 按提示打开浏览器授权

### 步骤 3: 部署前端
```bash
cd /Users/yinshi/Documents/510k/apps/web
vercel --prod
```

### 步骤 4: 配置环境变量
在 Vercel Dashboard 中设置以下环境变量：
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

## 方案二：手动部署（已构建）

### 本地生产构建已就绪
构建输出位于: `/Users/yinshi/Documents/510k/apps/web/.next`

### 部署步骤
1. 压缩 `.next` 文件夹
2. 上传到 Vercel/Netlify
3. 或者使用 `npx serve` 本地测试

---

## 方案三：GitHub + Vercel 自动部署

### 步骤 1: 创建 GitHub 仓库
```bash
cd /Users/yinshi/Documents/510k
git init
git add .
git commit -m "Initial commit"
gh repo create 510k --public --push
```

### 步骤 2: 连接 Vercel
1. 访问 https://vercel.com/new
2. 导入 GitHub 仓库
3. 根目录设置为 `apps/web`
4. 添加环境变量
5. 部署

---

## 📱 iPhone 访问配置

### 修改 Firebase 配置支持生产环境

编辑 `apps/web/.env.local`:
```
# 生产环境（部署后使用）
NEXT_PUBLIC_USE_EMULATORS=false
NEXT_PUBLIC_EMULATOR_HOST=
```

### 配置 Firebase 安全规则

确保 Firestore 规则允许生产域名访问：
```javascript
// firestore.rules
allow read, write: if request.auth != null;
```

---

## 🔧 当前状态

| 组件 | 本地 | 生产 |
|------|------|------|
| 前端 | ✅ localhost:3000 | ❌ 待部署 |
| Firebase Functions | ✅ localhost:5001 | ❌ 待部署 |
| Firestore | ✅ localhost:8080 | ✅ kkkpoker510 |

### 生产部署清单

- [ ] 部署前端到 Vercel
- [ ] 部署 Cloud Functions 到 Firebase
- [ ] 更新 Firestore 安全规则
- [ ] 配置 CORS 允许生产域名
- [ ] 测试 iPhone 访问

---

## 🌐 部署后 URL

部署完成后，你将获得类似：
- `https://510k-xxxxx.vercel.app`

iPhone 直接访问这个链接即可！

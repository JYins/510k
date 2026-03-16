# 🚀 Vercel 部署步骤

## ⚡ 最快部署方式（2 分钟）

### 步骤 1：打开终端，进入前端目录
```bash
cd /Users/yinshi/Documents/510k/apps/web
```

### 步骤 2：一键部署
```bash
npx vercel --prod
```

### 步骤 3：首次使用需要登录
如果提示登录，按以下步骤：
1. 终端会显示：`? Log in to Vercel (Use arrow keys)`
2. 选择 `Continue with GitHub` 或 `Continue with Google`
3. 浏览器会打开授权页面
4. 点击授权
5. 回到终端，继续部署

### 步骤 4：等待部署完成
你会看到类似输出：
```
🔍  Inspect: https://vercel.com/yourname/510k/abc123
✅  Production: https://510k-xyz123.vercel.app
```

### 步骤 5：iPhone 访问
用 iPhone 浏览器打开：`https://510k-xyz123.vercel.app`

---

## 🔧 配置环境变量（重要）

部署完成后，需要设置 Firebase 环境变量：

### 方法 A：Vercel Web 界面
1. 访问 https://vercel.com/dashboard
2. 点击你的 510k 项目
3. 点击 `Settings` → `Environment Variables`
4. 添加以下变量：

```
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyATDt2S5iBOIfyoLhqdJKBdMRwGwRbgvqM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = kkkpoker510.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = kkkpoker510
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = kkkpoker510.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 465331434483
NEXT_PUBLIC_FIREBASE_APP_ID = 1:465331434483:web:3e0fad9116920f500e5886
NEXT_PUBLIC_USE_EMULATORS = false
```

5. 点击 `Save`
6. 重新部署：`npx vercel --prod`

### 方法 B：Vercel CLI
```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# 输入: AIzaSyATDt2S5iBOIfyoLhqdJKBdMRwGwRbgvqM
# 选择: Production

vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# 输入: kkkpoker510.firebaseapp.com
# 选择: Production

# ... 重复添加其他变量
```

---

## 📱 iPhone 添加到主屏幕

1. Safari 打开部署的链接
2. 点击底部分享按钮 ⬆️
3. 选择"添加到主屏幕"
4. 自定义名称（如"510K"）
5. 点击"添加"

现在你的 iPhone 主屏幕上就有了 510K 游戏 App 图标！

---

## 🔄 更新部署

修改代码后，重新部署：
```bash
cd /Users/yinshi/Documents/510k/apps/web
npx vercel --prod
```

---

## 🆘 常见问题

**Q: 提示 "vercel: command not found"**
```bash
npm i -g vercel
```

**Q: 部署后页面显示错误**
检查环境变量是否正确设置

**Q: 游戏无法创建房间**
确保 Firebase Functions 已部署：
```bash
cd /Users/yinshi/Documents/510k/backend
firebase deploy --only functions
```

**Q: 自定义域名**
在 Vercel Dashboard → Settings → Domains 中添加

---

## 🎯 生产环境信息

| 组件 | 地址 |
|------|------|
| 前端 | `https://510k-xxx.vercel.app` |
| Firebase Functions | `https://us-central1-kkkpoker510.cloudfunctions.net` |
| Firestore | `kkkpoker510` |

---

**现在运行 `npx vercel --prod` 开始部署！** 🚀

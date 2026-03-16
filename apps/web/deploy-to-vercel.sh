#!/bin/bash
set -e

echo "🚀 510K 游戏 - Vercel 部署脚本"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 apps/web 目录下运行此脚本"
    exit 1
fi

echo "📦 步骤 1/4: 安装依赖..."
npm install

echo ""
echo "🔨 步骤 2/4: 构建生产版本..."
npm run build

echo ""
echo "🚀 步骤 3/4: 部署到 Vercel..."
echo -e "${YELLOW}提示：如果是首次使用，需要登录 Vercel${NC}"
echo ""

# Deploy to Vercel
if ! command -v vercel &> /dev/null; then
    echo "正在安装 Vercel CLI..."
    npm i -g vercel
fi

# Run deployment
vercel --prod

echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo -e "${BLUE}⚠️  重要：接下来需要设置环境变量${NC}"
echo ""
echo "请按以下步骤操作："
echo "1. 访问 https://vercel.com/dashboard"
echo "2. 点击你的 510K 项目"
echo "3. 进入 Settings → Environment Variables"
echo "4. 添加以下变量："
echo ""
echo "   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyATDt2S5iBOIfyoLhqdJKBdMRwGwRbgvqM"
echo "   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kkkpoker510.firebaseapp.com"
echo "   NEXT_PUBLIC_FIREBASE_PROJECT_ID=kkkpoker510"
echo "   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kkkpoker510.firebasestorage.app"
echo "   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=465331434483"
echo "   NEXT_PUBLIC_FIREBASE_APP_ID=1:465331434483:web:3e0fad9116920f500e5886"
echo "   NEXT_PUBLIC_USE_EMULATORS=false"
echo ""
echo "5. 保存后重新部署: npx vercel --prod"
echo ""
echo -e "${GREEN}📱 部署完成后，用 iPhone 访问你的 Vercel 链接即可！${NC}"

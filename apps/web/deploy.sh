#!/bin/bash
# 510K Web Deploy Script

echo "🚀 510K 前端部署脚本"
echo "===================="

# Build production
echo "📦 构建生产版本..."
npm run build

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm i -g vercel
fi

# Login and deploy
echo "🔑 登录 Vercel..."
vercel login

echo "🚀 部署到生产环境..."
vercel --prod

echo "✅ 部署完成！"
echo "访问 https://510k.vercel.app 查看"

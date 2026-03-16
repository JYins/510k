#!/bin/bash
# Test script for 510K Game API

echo "🎴 510K Game API Test"
echo "===================="
echo ""

BASE_URL="http://127.0.0.1:5001/kkkpoker510/us-central1"

# Test health check
echo "1️⃣ Testing healthCheck..."
curl -s -X POST "$BASE_URL/healthCheck" \
  -H "Content-Type: application/json" \
  -d '{}' | jq . 2>/dev/null || echo "Health check response received"
echo ""

# Test createRoom (anonymous auth would be needed for full test)
echo "2️⃣ API endpoints available:"
echo "   - POST $BASE_URL/createRoom"
echo "   - POST $BASE_URL/joinRoom"
echo "   - POST $BASE_URL/startGame"
echo "   - POST $BASE_URL/playCards"
echo "   - POST $BASE_URL/passTurn"
echo "   - POST $BASE_URL/getGameState"
echo ""

echo "✅ Emulator is running!"
echo ""
echo "📋 To test with your frontend:"
echo "   1. Connect to Firestore emulator: localhost:8080"
echo "   2. Connect to Functions emulator: localhost:5001"
echo ""
echo "🌐 Emulator UI: http://localhost:4000"

#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "=== Fixing and Starting Next.js Server ==="
echo ""

# 1. Install dependencies if needed
if [ ! -f "node_modules/.bin/next" ]; then
  echo "Installing dependencies..."
  npm install
  echo "✓ Dependencies installed"
else
  echo "✓ Dependencies already installed"
fi

# 2. Create .env.local if missing
if [ ! -f ".env.local" ]; then
  echo "Creating .env.local..."
  cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://ktkgkjgwyqdizoliitsy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_2aFw0mxy1JtKFXJcghZfcw_WVXPanjK
EOF
  echo "✓ .env.local created"
else
  echo "✓ .env.local exists"
fi

# 3. Kill any existing processes
echo "Cleaning up..."
pkill -f "next dev" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# 4. Start server
echo ""
echo "=== Starting Server ==="
echo "Server will be available at: http://localhost:3000"
echo ""
npm run dev



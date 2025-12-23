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

# 2. Check .env.local exists
if [ ! -f ".env.local" ]; then
  echo "⚠ WARNING: .env.local file not found!"
  echo "Please create .env.local with your Supabase credentials:"
  echo "  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
  echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
  echo ""
  echo "Exiting..."
  exit 1
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



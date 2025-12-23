#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "=== Landing Zone Server Startup ==="
echo ""

# Check .env.local
if [ ! -f .env.local ]; then
  echo "✗ ERROR: .env.local file not found!"
  echo ""
  echo "Please create .env.local with your Supabase credentials:"
  echo "  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
  echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
  echo ""
  echo "Exiting..."
  exit 1
else
  echo "✓ .env.local exists"
fi

# Check node_modules
if [ ! -d "node_modules" ]; then
  echo "✗ node_modules missing - installing dependencies..."
  npm install
  echo "✓ Dependencies installed"
else
  echo "✓ node_modules exists"
fi

# Kill any existing processes
echo ""
echo "Cleaning up any existing processes..."
pkill -f "next dev" 2>/dev/null || true
sleep 1

# Check port
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠ Port 3000 is in use, killing process..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo ""
echo "=== Starting Development Server ==="
echo "Server will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start server
npm run dev



#!/bin/bash

echo "=== Landing Zone Server Diagnostic ==="
echo ""

# Check .env.local
echo "1. Checking .env.local file..."
if [ -f .env.local ]; then
  echo "   ✓ .env.local exists"
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    echo "   ✓ Environment variables found"
  else
    echo "   ✗ Missing required environment variables!"
  fi
else
  echo "   ✗ .env.local NOT FOUND - This is likely the problem!"
fi
echo ""

# Check node_modules
echo "2. Checking dependencies..."
if [ -d "node_modules" ]; then
  echo "   ✓ node_modules exists"
else
  echo "   ✗ node_modules missing - run 'npm install' first"
fi
echo ""

# Check if port is in use
echo "3. Checking port 3000..."
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "   ⚠ Port 3000 is already in use"
  lsof -ti:3000 | xargs ps -p
else
  echo "   ✓ Port 3000 is available"
fi
echo ""

# Try to start server
echo "4. Starting development server..."
echo "   Running: npm run dev"
echo "   Watch for errors below..."
echo ""
npm run dev



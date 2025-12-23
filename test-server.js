const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Server Diagnostic Test ===\n');

// Check .env.local
const envExists = fs.existsSync('.env.local');
console.log('1. .env.local exists:', envExists);
if (envExists) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  console.log('   Contains SUPABASE_URL:', envContent.includes('NEXT_PUBLIC_SUPABASE_URL'));
  console.log('   Contains ANON_KEY:', envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
}

// Check node_modules
const nextExists = fs.existsSync('node_modules/.bin/next');
console.log('\n2. Next.js installed:', nextExists);

// Check styles
const stylesExists = fs.existsSync('styles/glassmorphic.css');
console.log('\n3. Styles file exists:', stylesExists);

// Try to start server
if (nextExists) {
  console.log('\n4. Starting server...');
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  server.on('error', (err) => {
    console.error('Server error:', err);
  });
  
  server.on('exit', (code) => {
    console.log(`\nServer exited with code ${code}`);
  });
  
  // Don't exit immediately
  setTimeout(() => {}, 30000);
} else {
  console.log('\n4. Cannot start server - Next.js not installed');
  console.log('   Run: npm install');
  process.exit(1);
}



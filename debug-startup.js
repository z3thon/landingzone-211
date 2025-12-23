const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_ENDPOINT = 'http://127.0.0.1:7245/ingest/afa96a29-4e2d-478b-a0f9-c9eaf21816cd';
const sessionId = 'debug-session';
const runId = 'run1';

function log(hypothesisId, location, message, data = {}) {
  const payload = {
    sessionId,
    runId,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now()
  };
  
  fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

// #region agent log
log('A', 'debug-startup.js:18', 'Starting diagnostic checks', { cwd: process.cwd() });
// #endregion

// Hypothesis A: Check if Next.js is installed
const nextPath = path.join(process.cwd(), 'node_modules', '.bin', 'next');
const nextExists = fs.existsSync(nextPath);
// #region agent log
log('A', 'debug-startup.js:24', 'Next.js binary check', { exists: nextExists, path: nextPath });
// #endregion

if (!nextExists) {
  // #region agent log
  log('A', 'debug-startup.js:28', 'Next.js not found - attempting install', {});
  // #endregion
  console.log('Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: process.cwd() });
    // #region agent log
    log('A', 'debug-startup.js:33', 'npm install completed', {});
    // #endregion
  } catch (e) {
    // #region agent log
    log('A', 'debug-startup.js:37', 'npm install failed', { error: e.message });
    // #endregion
    process.exit(1);
  }
}

// Hypothesis B: Check if port 3000 is in use
try {
  const portCheck = execSync('lsof -ti:3000', { encoding: 'utf8', stdio: 'pipe' }).trim();
  // #region agent log
  log('B', 'debug-startup.js:45', 'Port 3000 check', { inUse: true, pid: portCheck });
  // #endregion
  console.log(`Port 3000 is in use by PID: ${portCheck}`);
  console.log('Killing existing process...');
  execSync(`kill -9 ${portCheck}`, { stdio: 'inherit' });
  // #region agent log
  log('B', 'debug-startup.js:51', 'Killed process on port 3000', { pid: portCheck });
  // #endregion
} catch (e) {
  // #region agent log
  log('B', 'debug-startup.js:55', 'Port 3000 is free', {});
  // #endregion
}

// Hypothesis C: Check .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);
// #region agent log
log('C', 'debug-startup.js:61', '.env.local check', { exists: envExists, path: envPath });
// #endregion

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  // #region agent log
  log('C', 'debug-startup.js:68', '.env.local content check', { hasUrl, hasKey, length: envContent.length });
  // #endregion
} else {
  // #region agent log
  log('C', 'debug-startup.js:72', '.env.local missing', {});
  // #endregion
  console.log('WARNING: .env.local not found');
}

// Hypothesis D: Check for TypeScript errors
try {
  // #region agent log
  log('D', 'debug-startup.js:79', 'Starting TypeScript check', {});
  // #endregion
  execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: process.cwd() });
  // #region agent log
  log('D', 'debug-startup.js:83', 'TypeScript check passed', {});
  // #endregion
} catch (e) {
  // #region agent log
  log('D', 'debug-startup.js:87', 'TypeScript check failed', { error: e.message, stderr: e.stderr?.toString() });
  // #endregion
  console.log('TypeScript errors found (may not prevent startup)');
}

// Hypothesis E: Start server and capture errors
console.log('\n=== Starting Next.js Server ===\n');
// #region agent log
log('E', 'debug-startup.js:95', 'Starting npm run dev', {});
// #endregion

const server = spawn('npm', ['run', 'dev'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true
});

server.on('error', (err) => {
  // #region agent log
  log('E', 'debug-startup.js:104', 'Server spawn error', { error: err.message, code: err.code });
  // #endregion
  console.error('Server error:', err);
});

server.on('exit', (code, signal) => {
  // #region agent log
  log('E', 'debug-startup.js:111', 'Server exited', { code, signal });
  // #endregion
  console.log(`\nServer exited with code ${code}, signal ${signal}`);
});

// Keep process alive
process.on('SIGINT', () => {
  // #region agent log
  log('E', 'debug-startup.js:119', 'Received SIGINT, shutting down', {});
  // #endregion
  server.kill();
  process.exit(0);
});



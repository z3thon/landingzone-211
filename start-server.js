const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const outputFile = path.join(__dirname, 'server-output.log');
const logFile = path.join(__dirname, '.cursor', 'debug.log');

// Ensure log directory exists
const logDir = path.dirname(logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function writeLog(data) {
  try {
    fs.appendFileSync(outputFile, data + '\n');
  } catch (e) {}
}

function writeDebugLog(entry) {
  try {
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  } catch (e) {}
}

writeLog('=== Server Startup Diagnostic ===');
writeDebugLog({location:'start-server.js:20',message:'Starting diagnostic',timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});

// Check 1: Next.js installation
const nextPath = path.join(__dirname, 'node_modules', '.bin', 'next');
const nextExists = fs.existsSync(nextPath);
writeLog(`Next.js installed: ${nextExists}`);
writeDebugLog({location:'start-server.js:25',message:'Next.js check',data:{exists:nextExists},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});

if (!nextExists) {
  writeLog('Installing dependencies...');
  writeDebugLog({location:'start-server.js:29',message:'Running npm install',timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
  try {
    const { execSync } = require('child_process');
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    writeLog('npm install completed');
    writeDebugLog({location:'start-server.js:34',message:'npm install completed',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
  } catch (e) {
    writeLog(`npm install failed: ${e.message}`);
    writeDebugLog({location:'start-server.js:37',message:'npm install failed',data:{error:e.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
    process.exit(1);
  }
}

// Check 2: .env.local
const envPath = path.join(__dirname, '.env.local');
const envExists = fs.existsSync(envPath);
writeLog(`.env.local exists: ${envExists}`);
writeDebugLog({location:'start-server.js:42',message:'.env.local check',data:{exists:envExists},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'});

if (!envExists) {
  writeLog('Creating .env.local...');
  fs.writeFileSync(envPath, `NEXT_PUBLIC_SUPABASE_URL=https://ktkgkjgwyqdizoliitsy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_2aFw0mxy1JtKFXJcghZfcw_WVXPanjK
`);
  writeLog('.env.local created');
}

// Check 3: Port 3000
try {
  const { execSync } = require('child_process');
  const pid = execSync('lsof -ti:3000', { encoding: 'utf8' }).trim();
  writeLog(`Port 3000 in use by PID: ${pid}`);
  writeDebugLog({location:'start-server.js:55',message:'Port 3000 check',data:{inUse:true,pid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
  execSync(`kill -9 ${pid}`);
  writeLog('Killed existing process');
  writeDebugLog({location:'start-server.js:59',message:'Killed process',data:{pid},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
} catch (e) {
  writeLog('Port 3000 is free');
  writeDebugLog({location:'start-server.js:63',message:'Port 3000 free',timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
}

// Start server
writeLog('\n=== Starting Next.js Server ===');
writeDebugLog({location:'start-server.js:68',message:'Starting npm run dev',timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'});

const server = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true
});

server.stdout.on('data', (data) => {
  const output = data.toString();
  writeLog(output);
  if (output.includes('Ready')) {
    writeDebugLog({location:'start-server.js:78',message:'Server ready',data:{output},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
  }
});

server.stderr.on('data', (data) => {
  const output = data.toString();
  writeLog('ERROR: ' + output);
  writeDebugLog({location:'start-server.js:84',message:'Server error',data:{error:output},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
});

server.on('error', (err) => {
  writeLog(`Server spawn error: ${err.message}`);
  writeDebugLog({location:'start-server.js:90',message:'Server spawn error',data:{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
});

server.on('exit', (code, signal) => {
  writeLog(`\nServer exited with code ${code}, signal ${signal}`);
  writeDebugLog({location:'start-server.js:96',message:'Server exited',data:{code,signal},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
});

// Keep running
process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});

setTimeout(() => {}, 60000); // Keep alive for 60 seconds


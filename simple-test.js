const { execSync } = require('child_process');
const fs = require('fs');

const results = [];

function check(name, test) {
  try {
    const result = test();
    results.push(`${name}: ${result ? 'PASS' : 'FAIL'}`);
    return result;
  } catch (e) {
    results.push(`${name}: ERROR - ${e.message}`);
    return false;
  }
}

check('Next.js installed', () => fs.existsSync('node_modules/.bin/next'));
check('.env.local exists', () => fs.existsSync('.env.local'));
check('Port 3000 free', () => {
  try {
    execSync('lsof -ti:3000', { stdio: 'pipe' });
    return false;
  } catch {
    return true;
  }
});

console.log(results.join('\n'));

// Try to start server
if (fs.existsSync('node_modules/.bin/next')) {
  console.log('\nStarting server...');
  try {
    execSync('npm run dev', { stdio: 'inherit', timeout: 20000 });
  } catch (e) {
    console.log('Server error:', e.message);
  }
}



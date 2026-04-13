// debug-env.js
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

const path = require('path');
const fs = require('fs');

const possiblePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];

console.log('\nChecking for .env files:');
possiblePaths.forEach(p => {
  const exists = fs.existsSync(p);
  console.log(`  ${exists ? '✅' : '❌'} ${p}`);
  if (exists) {
    const content = fs.readFileSync(p, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    console.log(`     Contains ${lines.length} variable lines`);
    lines.forEach(l => {
      const [key] = l.split('=');
      console.log(`       - ${key}=***`);
    });
  }
});

console.log('\nCurrent process.env email vars:');
['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM', 'EMAIL_PORT'].forEach(key => {
  const val = process.env[key];
  console.log(`  ${val ? '✅' : '❌'} ${key}: ${val ? (key.includes('PASS') ? '***' + val.slice(-4) : val) : 'NOT SET'}`);
});
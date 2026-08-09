const { spawn } = require('child_process');
const path = require('path');

const nextBin = path.resolve(__dirname, 'node_modules/next/dist/bin/next');

const proc = spawn(process.execPath, [nextBin, 'dev', '-H', '0.0.0.0', '-p', '3000'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  env: { ...process.env, PORT: '3000', HOSTNAME: '0.0.0.0' }
});

proc.on('error', (err) => {
  console.error('Failed to start Next dev:', err);
});

proc.on('exit', (code, sig) => {
  console.error(`Next dev exited with code ${code}, sig ${sig}`);
});

process.on('SIGTERM', () => proc.kill('SIGTERM'));
process.on('SIGINT', () => proc.kill('SIGINT'));

import { spawn } from 'node:child_process';
import process from 'node:process';

const processes = [];
let shuttingDown = false;

function start(label, args) {
  const child = spawn('npm', args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit'
  });
  processes.push(child);
  child.once('error', (error) => {
    process.stderr.write(`[${label}] ${error.message}\n`);
    shutdown(1);
  });
  child.once('exit', (code, signal) => {
    if (shuttingDown) return;
    if (signal) {
      process.stderr.write(`[${label}] ${signal} siqnalı ilə dayandı.\n`);
    } else if (code !== 0) {
      process.stderr.write(`[${label}] ${code} kodu ilə dayandı.\n`);
    }
    shutdown(code || 0);
  });
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of processes) {
    if (!child.killed) child.kill('SIGTERM');
  }
  const forceTimer = setTimeout(() => {
    for (const child of processes) {
      if (!child.killed) child.kill('SIGKILL');
    }
  }, 3000);
  forceTimer.unref();
  process.exitCode = exitCode;
}

process.once('SIGINT', () => shutdown(0));
process.once('SIGTERM', () => shutdown(0));

start('backend', ['--prefix', 'backend', 'run', 'dev']);
start('frontend', ['--prefix', 'frontend', 'run', 'dev']);

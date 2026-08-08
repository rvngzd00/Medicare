import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const backendRoot = path.dirname(fileURLToPath(import.meta.url));
const prismaExecutable = path.join(
  backendRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prisma.cmd' : 'prisma'
);

const migration = spawnSync(prismaExecutable, ['migrate', 'deploy'], {
  cwd: backendRoot,
  env: process.env,
  stdio: 'inherit'
});

if (migration.error) throw migration.error;
if (migration.status !== 0) process.exit(migration.status ?? 1);

await import('./src/server.js');

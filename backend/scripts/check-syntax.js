import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const roots = ['src', 'prisma', 'scripts', 'tests'];
const files = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(filePath);
    if (entry.isFile() && entry.name.endsWith('.js')) files.push(filePath);
  }
}

for (const root of roots) await collect(root);

for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], {
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
}

process.stdout.write(`Syntax checked ${files.length} JavaScript files.\n`);

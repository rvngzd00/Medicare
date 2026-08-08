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

function runPrisma(arguments_) {
  const result = spawnSync(prismaExecutable, arguments_, {
    cwd: backendRoot,
    env: process.env,
    stdio: 'inherit'
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

runPrisma(['migrate', 'deploy']);

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
const bootstrapKey = 'system.initial_seed_v1';

try {
  const marker = await prisma.siteSetting.findUnique({ where: { key: bootstrapKey } });

  if (!marker) {
    const [doctorCount, priceItemCount] = await Promise.all([
      prisma.doctor.count(),
      prisma.servicePriceItem.count()
    ]);

    if (doctorCount === 0 && priceItemCount === 0) runPrisma(['db', 'seed']);

    await prisma.siteSetting.create({
      data: {
        key: bootstrapKey,
        group: 'system',
        label: 'Initial production data bootstrap',
        isPublic: false,
        value: { completedAt: new Date().toISOString() }
      }
    });
  }
} finally {
  await prisma.$disconnect();
}

await import('./src/server.js');

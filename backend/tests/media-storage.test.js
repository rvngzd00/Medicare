import assert from 'node:assert/strict';
import { access, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import sharp from 'sharp';

let storage;
let temporaryDirectory;

before(async () => {
  temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'medicare-media-test-'));
  process.env.UPLOAD_DIR = temporaryDirectory;
  ({ localImageStorage: storage } = await import(
    '../src/storage/local-image.storage.js'
  ));
});

after(async () => {
  await rm(temporaryDirectory, { recursive: true, force: true });
});

test('local media adapter creates optimized WebP and thumbnail files', async () => {
  const source = await sharp({
    create: {
      width: 900,
      height: 600,
      channels: 3,
      background: '#9f1239'
    }
  })
    .png()
    .toBuffer();

  const result = await storage.save(source);
  assert.equal(result.mimeType, 'image/webp');
  assert.equal(result.width, 900);
  assert.equal(result.height, 600);
  assert.match(result.url, /^\/uploads\/\d{4}\/\d{2}\//);
  await access(path.join(temporaryDirectory, result.storageKey));
  await access(
    path.join(temporaryDirectory, result.thumbnailUrl.slice('/uploads/'.length))
  );

  await storage.delete(result.storageKey, result.thumbnailUrl);
  await assert.rejects(access(path.join(temporaryDirectory, result.storageKey)));
});

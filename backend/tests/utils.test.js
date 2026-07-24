import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { before, test } from 'node:test';

let tokenUtilities;
let toSlug;

before(async () => {
  process.env.JWT_ACCESS_SECRET = crypto.randomBytes(48).toString('base64url');
  ({ toSlug } = await import('../src/utils/slug.js'));
  tokenUtilities = await import('../src/utils/tokens.js');
});

test('Azerbaijani text is converted to a stable URL slug', () => {
  assert.equal(toSlug('Şöbə: Ürək və Damar'), 'sobe-urek-ve-damar');
});

test('access tokens enforce issuer, audience and token type', () => {
  const token = tokenUtilities.signAccessToken({
    id: crypto.randomUUID(),
    role: { slug: 'content-manager' }
  });
  const payload = tokenUtilities.verifyAccessToken(token);
  assert.equal(payload.type, 'access');
  assert.equal(payload.role, 'content-manager');
});

test('refresh tokens are random and only deterministic after hashing', () => {
  const first = tokenUtilities.createRefreshToken();
  const second = tokenUtilities.createRefreshToken();
  assert.notEqual(first, second);
  assert.equal(
    tokenUtilities.hashToken(first),
    tokenUtilities.hashToken(first)
  );
  assert.notEqual(
    tokenUtilities.hashToken(first),
    tokenUtilities.hashToken(second)
  );
});

test('CMS canonical metadata only accepts HTTP URLs', async () => {
  const { cmsPageCreateSchema } = await import('../src/validators/cms.validators.js');
  const result = cmsPageCreateSchema.body.safeParse({
    title: 'Təhlükəsizlik səhifəsi',
    slug: 'tehlukesizlik',
    status: 'DRAFT',
    sections: [],
    seo: {
      title: 'Təhlükəsizlik',
      description: 'Canonical URL protokolunun təhlükəsizlik yoxlaması.',
      canonicalUrl: 'javascript:alert(1)'
    }
  });
  assert.equal(result.success, false);
});

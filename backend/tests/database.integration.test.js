import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';

const runDatabaseTests = process.env.RUN_DB_TESTS === 'true';

test(
  'seeded PostgreSQL supports public, auth, admin CRUD and media flows',
  { skip: !runDatabaseTests },
  async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = crypto.randomBytes(48).toString('base64url');

    const [{ app }, { prisma }, { default: bcrypt }, { default: request }, { default: sharp }] =
      await Promise.all([
        import('../src/app.js'),
        import('../src/config/prisma.js'),
        import('bcrypt'),
        import('supertest'),
        import('sharp')
      ]);

    const password = `Qa-${crypto.randomBytes(18).toString('base64url')}Aa1!`;
    const email = `qa-${crypto.randomUUID()}@example.test`;
    const createdIds = {};

    try {
      const role = await prisma.role.findUniqueOrThrow({
        where: { slug: 'super-admin' }
      });
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(password, 12),
          firstName: 'QA',
          lastName: 'Administrator',
          roleId: role.id
        }
      });
      createdIds.user = user.id;

      const doctorsResponse = await request(app)
        .get('/api/v1/public/doctors?featured=true')
        .expect(200);
      assert.ok(doctorsResponse.body.data.length >= 1);
      const doctor = doctorsResponse.body.data[0];

      const doctorResponse = await request(app)
        .get(`/api/v1/public/doctors/${doctor.slug}`)
        .expect(200);
      assert.equal(doctorResponse.body.data.id, doctor.id);

      const configurationResponse = await request(app)
        .get('/api/v1/public/configuration')
        .expect(200);
      assert.ok(configurationResponse.body.data.navigation.length >= 1);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);
      const { accessToken, refreshToken } = loginResponse.body.data;
      assert.ok(accessToken);
      assert.ok(refreshToken);

      const userResponse = await request(app)
        .get(`/api/v1/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      assert.equal(userResponse.body.data.email, email);

      const dashboardResponse = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      assert.ok(dashboardResponse.body.data.counts.doctors >= 1);

      const cmsPageResponse = await request(app)
        .post('/api/v1/admin/cms/pages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'QA CMS səhifəsi',
          slug: `qa-cms-${crypto.randomUUID()}`,
          excerpt: 'Atomik bölmə və versiya yoxlaması üçün yaradılmış səhifə.',
          template: 'LANDING',
          status: 'PUBLISHED',
          seo: null,
          sections: [
            {
              key: 'hero',
              type: 'HERO',
              label: 'Hero',
              title: 'QA səhifə başlığı',
              description: 'Public CMS render yoxlaması üçün hero mətni.',
              content: {},
              active: true,
              locked: true
            },
            {
              key: 'content',
              type: 'RICH_TEXT',
              label: 'Məzmun',
              title: 'QA məzmunu',
              description: 'Database-də saxlanan redaktə edilə bilən məzmun.',
              content: { text: 'Birinci abzas.\\n\\nİkinci abzas.' },
              active: true,
              locked: false
            }
          ]
        })
        .expect(201);
      createdIds.page = cmsPageResponse.body.data.id;
      const cmsSlug = cmsPageResponse.body.data.slug;

      const cmsPublicResponse = await request(app)
        .get(`/api/v1/public/pages/${cmsSlug}`)
        .expect(200);
      assert.equal(cmsPublicResponse.body.data.sectionLayoutConfigured, true);
      assert.deepEqual(
        cmsPublicResponse.body.data.sections.map((section) => section.key),
        ['hero', 'content']
      );

      const publicPagesResponse = await request(app)
        .get('/api/v1/public/pages')
        .expect(200);
      assert.ok(
        publicPagesResponse.body.data.some((page) => page.slug === cmsSlug)
      );

      const reservedSlugResponse = await request(app)
        .post('/api/v1/admin/cms/pages')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Reserved page',
          slug: 'admin',
          template: 'STANDARD',
          status: 'DRAFT',
          seo: null,
          sections: []
        })
        .expect(422);
      assert.equal(
        reservedSlugResponse.body.error.code,
        'PAGE_SLUG_RESERVED'
      );

      const reorderedSections = [...cmsPageResponse.body.data.sections]
        .reverse()
        .map((section) => ({
          id: section.id,
          key: section.key,
          type: section.type,
          label: section.label,
          title: section.title,
          eyebrow: section.eyebrow,
          description: section.description,
          content: section.content,
          active: section.active,
          locked: section.locked
        }));
      await request(app)
        .put(`/api/v1/admin/cms/pages/${createdIds.page}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: cmsPageResponse.body.data.title,
          slug: cmsSlug,
          excerpt: cmsPageResponse.body.data.excerpt,
          template: 'LANDING',
          status: 'PUBLISHED',
          seo: null,
          sections: reorderedSections
        })
        .expect(200);

      const reorderedPublicResponse = await request(app)
        .get(`/api/v1/public/pages/${cmsSlug}`)
        .expect(200);
      assert.deepEqual(
        reorderedPublicResponse.body.data.sections.map((section) => section.key),
        ['content', 'hero']
      );

      const revisionsResponse = await request(app)
        .get(`/api/v1/admin/cms/pages/${createdIds.page}/revisions`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      assert.ok(revisionsResponse.body.data.length >= 1);

      await request(app)
        .post(
          `/api/v1/admin/cms/pages/${createdIds.page}/revisions/${revisionsResponse.body.data[0].id}/restore`
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(200);

      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      assert.notEqual(refreshResponse.body.data.refreshToken, refreshToken);

      const reuseResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
      assert.equal(reuseResponse.body.error.code, 'REFRESH_TOKEN_REUSE');

      const faqResponse = await request(app)
        .post('/api/v1/admin/faqs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          question: 'QA inteqrasiya sualı?',
          answer: 'Bu qeyd yalnız avtomatlaşdırılmış inteqrasiya yoxlaması üçündür.',
          active: true,
          sortOrder: 999
        })
        .expect(201);
      createdIds.faq = faqResponse.body.data.id;

      await request(app)
        .patch(`/api/v1/admin/faqs/${createdIds.faq}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ category: 'QA' })
        .expect(200);
      await request(app)
        .delete(`/api/v1/admin/faqs/${createdIds.faq}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      await request(app)
        .post(`/api/v1/admin/faqs/${createdIds.faq}/restore`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(200);

      const branch = await prisma.branch.findFirstOrThrow({
        where: { active: true, deletedAt: null }
      });
      const appointmentResponse = await request(app)
        .post('/api/v1/public/appointments')
        .send({
          firstName: 'Aysel',
          lastName: 'Testli',
          phone: '+994 50 000 00 00',
          email: 'aysel.qa@example.test',
          departmentId: doctor.department.id,
          doctorId: doctor.id,
          branchId: branch.id,
          desiredDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          desiredTime: '10:30',
          message: 'İnteqrasiya yoxlaması',
          privacyConsent: true
        })
        .expect(201);
      createdIds.appointment = appointmentResponse.body.data.id;

      const contactResponse = await request(app)
        .post('/api/v1/public/contact')
        .send({
          firstName: 'Aysel',
          lastName: 'Testli',
          email: 'aysel.qa@example.test',
          subject: 'İnteqrasiya yoxlaması',
          message: 'Bu, əlaqə formasının database inteqrasiya yoxlamasıdır.',
          privacyConsent: true
        })
        .expect(201);
      createdIds.contact = contactResponse.body.data.id;

      const image = await sharp({
        create: {
          width: 640,
          height: 420,
          channels: 3,
          background: '#2563eb'
        }
      })
        .png()
        .toBuffer();
      const mediaResponse = await request(app)
        .post('/api/v1/admin/media')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('altText', 'QA media image')
        .attach('image', image, {
          filename: 'qa-image.png',
          contentType: 'image/png'
        })
        .expect(201);
      createdIds.media = mediaResponse.body.data.id;

      await request(app)
        .delete(`/api/v1/admin/media/${createdIds.media}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'LOCKED', lockedUntil: null }
      });
      const lockedLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(423);
      assert.equal(lockedLoginResponse.body.error.code, 'ACCOUNT_LOCKED');
    } finally {
      if (createdIds.appointment) {
        await prisma.appointmentRequest.deleteMany({
          where: { id: createdIds.appointment }
        });
      }
      if (createdIds.contact) {
        await prisma.contactMessage.deleteMany({ where: { id: createdIds.contact } });
      }
      if (createdIds.faq) {
        await prisma.fAQ.deleteMany({ where: { id: createdIds.faq } });
      }
      if (createdIds.media) {
        await prisma.mediaFile.deleteMany({ where: { id: createdIds.media } });
      }
      if (createdIds.page) {
        await prisma.contentPage.deleteMany({ where: { id: createdIds.page } });
      }
      if (createdIds.user) {
        await prisma.user.deleteMany({ where: { id: createdIds.user } });
      }
      await prisma.$disconnect();
    }
  }
);

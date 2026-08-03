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
    let originalPricingSetting = null;
    try {
      originalPricingSetting = await prisma.siteSetting.findUnique({
        where: { key: 'services.pricing' }
      });
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

      await request(app)
        .get('/api/v1/admin/leadership')
        .expect(401);

      const initialLeadershipResponse = await request(app)
        .get('/api/v1/public/content/leadership')
        .expect(200);
      assert.ok(initialLeadershipResponse.body.data.length >= 1);
      assert.ok(initialLeadershipResponse.body.data[0].image);
      assert.equal('email' in initialLeadershipResponse.body.data[0], false);

      const doctorsResponse = await request(app)
        .get('/api/v1/public/doctors?featured=true')
        .expect(200);
      assert.ok(doctorsResponse.body.data.length >= 1);
      const doctor = doctorsResponse.body.data[0];

      const doctorResponse = await request(app)
        .get(`/api/v1/public/doctors/${doctor.slug}`)
        .expect(200);
      assert.equal(doctorResponse.body.data.id, doctor.id);
      assert.equal('phone' in doctorResponse.body.data, false);
      assert.equal('email' in doctorResponse.body.data, false);
      assert.equal('socialLinks' in doctorResponse.body.data, false);
      assert.equal('phone' in doctorResponse.body.data.branch, false);
      assert.equal('email' in doctorResponse.body.data.branch, false);

      const departmentsResponse = await request(app)
        .get('/api/v1/public/departments')
        .expect(200);
      assert.ok(departmentsResponse.body.data.length >= 1);
      assert.equal('technologies' in departmentsResponse.body.data[0], false);

      const servicesResponse = await request(app)
        .get('/api/v1/public/services?limit=100')
        .expect(200);
      assert.equal(
        servicesResponse.body.data.filter((service) => service.priceItems.length > 0).length,
        25
      );
      assert.equal(
        servicesResponse.body.data.reduce(
          (total, service) => total + service.priceItems.length,
          0
        ),
        684
      );

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

      const leadershipAdminResponse = await request(app)
        .get('/api/v1/admin/leadership?limit=100')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      assert.ok(leadershipAdminResponse.body.data.length >= 1);

      const serviceSlug = 'qa-price-service-' + crypto.randomUUID();
      const serviceResponse = await request(app)
        .post('/api/v1/admin/services')
        .set('Authorization', 'Bearer ' + accessToken)
        .send({
          slug: serviceSlug,
          name: 'QA qiymət xidməti',
          summary: 'Çoxsətirli qiymət redaktorunun inteqrasiya yoxlaması.',
          description: 'Bu xidmət yalnız avtomatlaşdırılmış test üçün yaradılır.',
          departmentId: departmentsResponse.body.data[0].id,
          priceItems: [
            { code: 'QA-1', name: 'Birinci xidmət', price: '30', currency: 'AZN', active: true, sortOrder: 0 },
            { code: 'QA-2', name: 'İkinci xidmət', price: null, currency: 'AZN', active: false, sortOrder: 1 }
          ],
          active: true
        })
        .expect(201);
      createdIds.service = serviceResponse.body.data.id;
      assert.equal(serviceResponse.body.data.priceItems.length, 2);
      assert.equal(Number(serviceResponse.body.data.priceFrom), 30);

      const publicServiceResponse = await request(app)
        .get('/api/v1/public/services/' + serviceSlug)
        .expect(200);
      assert.deepEqual(
        publicServiceResponse.body.data.priceItems.map((item) => item.code),
        ['QA-1']
      );

      const updatedServiceResponse = await request(app)
        .patch('/api/v1/admin/services/' + createdIds.service)
        .set('Authorization', 'Bearer ' + accessToken)
        .send({
          priceItems: [
            { code: 'QA-2', name: 'İkinci xidmət', price: '45', currency: 'AZN', active: true, sortOrder: 0 },
            { code: 'QA-1', name: 'Birinci xidmət', price: '30', currency: 'AZN', active: true, sortOrder: 1 }
          ]
        })
        .expect(200);
      assert.deepEqual(
        updatedServiceResponse.body.data.priceItems.map((item) => item.code),
        ['QA-2', 'QA-1']
      );
      assert.equal(Number(updatedServiceResponse.body.data.priceFrom), 30);

      await request(app)
        .patch('/api/v1/admin/services/' + createdIds.service)
        .set('Authorization', 'Bearer ' + accessToken)
        .send({ priceItems: [{ name: 'Yanlış qiymət', price: '-1' }] })
        .expect(422);

      const pricingVisibilityResponse = await request(app)
        .get('/api/v1/admin/services/pricing-visibility')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      assert.equal(typeof pricingVisibilityResponse.body.data.visible, 'boolean');

      await request(app)
        .put('/api/v1/admin/services/pricing-visibility')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ visible: false })
        .expect(200);

      const hiddenPricesResponse = await request(app)
        .get('/api/v1/public/services?limit=100')
        .expect(200);
      assert.ok(hiddenPricesResponse.body.data.length >= 1);
      assert.ok(
        hiddenPricesResponse.body.data.every(
          (service) =>
            service.pricingVisible === false &&
            service.priceFrom === null &&
            service.priceItems.length === 0 &&
            !Object.hasOwn(service, 'currency')
        )
      );

      const hiddenServiceResponse = await request(app)
        .get('/api/v1/public/services/' + serviceSlug)
        .expect(200);
      assert.equal(hiddenServiceResponse.body.data.pricingVisible, false);
      assert.equal(hiddenServiceResponse.body.data.priceFrom, null);
      assert.deepEqual(hiddenServiceResponse.body.data.priceItems, []);

      await request(app)
        .put('/api/v1/admin/services/pricing-visibility')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ visible: 'false' })
        .expect(422);

      await request(app)
        .put('/api/v1/admin/services/pricing-visibility')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ visible: true })
        .expect(200);

      const restoredPriceResponse = await request(app)
        .get('/api/v1/public/services/' + serviceSlug)
        .expect(200);
      assert.equal(restoredPriceResponse.body.data.pricingVisible, true);
      assert.deepEqual(
        restoredPriceResponse.body.data.priceItems.map((item) => item.code),
        ['QA-2', 'QA-1']
      );

      await request(app)
        .post('/api/v1/admin/leadership')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'QA',
          lastName: 'Rəhbər',
          position: 'Keyfiyyət üzrə direktor',
          bio: 'İnteqrasiya yoxlaması üçün müvəqqəti rəhbər profili.',
          education: [],
          experience: [],
          imageId: leadershipAdminResponse.body.data[0].imageId,
          active: true,
          unsupported: true
        })
        .expect(422);

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

      const contactAdminResponse = await request(app)
        .get('/api/v1/admin/contacts?limit=100')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      assert.ok(
        contactAdminResponse.body.data.some(
          (message) => message.id === createdIds.contact
        )
      );

      await request(app)
        .delete(`/api/v1/admin/contacts/${createdIds.contact}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const deletedContactResponse = await request(app)
        .get('/api/v1/admin/contacts?limit=100')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      assert.equal(
        deletedContactResponse.body.data.some(
          (message) => message.id === createdIds.contact
        ),
        false
      );

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

      const leadershipResponse = await request(app)
        .post('/api/v1/admin/leadership')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'QA',
          lastName: 'Rəhbər',
          position: 'Keyfiyyət üzrə direktor',
          bio: 'İnteqrasiya yoxlaması üçün yaradılmış müvəqqəti rəhbər profili.',
          education: ['Azərbaycan Tibb Universiteti — Müalicə işi'],
          experience: ['Klinik keyfiyyət üzrə 10 il təcrübə'],
          imageId: createdIds.media,
          active: true,
          sortOrder: 999
        })
        .expect(201);
      createdIds.leadership = leadershipResponse.body.data.id;
      assert.equal(leadershipResponse.body.data.image.id, createdIds.media);

      const publicLeadershipResponse = await request(app)
        .get('/api/v1/public/content/leadership')
        .expect(200);
      assert.ok(
        publicLeadershipResponse.body.data.some(
          (item) => item.id === createdIds.leadership && item.education.length === 1
        )
      );

      await request(app)
        .post('/api/v1/admin/leadership/reorder')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ids: [createdIds.leadership] })
        .expect(200);

      const referencedMediaResponse = await request(app)
        .delete(`/api/v1/admin/media/${createdIds.media}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409);
      assert.equal(referencedMediaResponse.body.error.code, 'MEDIA_IN_USE');

      await request(app)
        .patch(`/api/v1/admin/leadership/${createdIds.leadership}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          active: false
        })
        .expect(200);

      const hiddenLeadershipResponse = await request(app)
        .get('/api/v1/public/content/leadership')
        .expect(200);
      assert.equal(
        hiddenLeadershipResponse.body.data.some((item) => item.id === createdIds.leadership),
        false
      );

      await request(app)
        .patch(`/api/v1/admin/leadership/${createdIds.leadership}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ imageId: leadershipAdminResponse.body.data[0].imageId })
        .expect(200);

      await request(app)
        .delete(`/api/v1/admin/media/${createdIds.media}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await request(app)
        .delete(`/api/v1/admin/leadership/${createdIds.leadership}`)
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
      if (originalPricingSetting) {
        await prisma.siteSetting.update({
          where: { key: 'services.pricing' },
          data: {
            value: originalPricingSetting.value,
            group: originalPricingSetting.group,
            label: originalPricingSetting.label,
            isPublic: originalPricingSetting.isPublic
          }
        });
      } else {
        await prisma.siteSetting.deleteMany({
          where: { key: 'services.pricing' }
        });
      }
      if (createdIds.service) {
        await prisma.service.deleteMany({ where: { id: createdIds.service } });
      }
      if (createdIds.leadership) {
        await prisma.leadershipMember.deleteMany({ where: { id: createdIds.leadership } });
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

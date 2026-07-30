# Medicare Hospital API

Medicare Hospital API xəstəxananın public saytı və admin paneli üçün hazırlanmış
Node.js/Express REST backend-dir. Layihə PostgreSQL və Prisma üzərində qurulur,
JWT access token, rotasiya olunan refresh token, permission əsaslı RBAC, təhlükəsiz
şəkil emalı, audit jurnalı və soft delete axınlarını birlikdə təmin edir.

## Texnologiyalar

- Node.js 20.9+, Express və JavaScript ES modules
- PostgreSQL və Prisma ORM
- JWT access token, opaque refresh token rotation və bcrypt
- Zod validation, server-side sanitization və Prisma parametrli sorğular
- Helmet, CORS whitelist, strict query validation, ümumi/auth/form rate limitləri
- Multer memory upload, Sharp WebP optimizasiyası və thumbnail
- Pino strukturlaşdırılmış JSON logları
- Node test runner və Supertest smoke testləri

## Quraşdırma

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:generate
npm run db:deploy
npm run db:seed
npm run dev
```

API standart olaraq `http://localhost:4000`, base path isə `/api/v1` altında
işləyir. `GET /health` liveness üçündür və database bağlantısı tələb etmir.
`GET /ready` database bağlantısını da yoxlayır.

## Environment dəyişənləri

`.env.example` bütün dəyişənləri sənədləşdirir. Əsas dəyişənlər:

| Dəyişən | Məqsəd |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL |
| `JWT_ACCESS_SECRET` | Minimum 32 simvolluq access-token secret |
| `JWT_ACCESS_EXPIRES_IN` | Access token müddəti, məsələn `15m` |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Refresh sessiyasının maksimum müddəti |
| `CORS_ORIGINS` | Vergüllə ayrılmış frontend origin whitelist |
| `COOKIE_SECURE`, `COOKIE_SAME_SITE` | Refresh cookie təhlükəsizliyi |
| `UPLOAD_MAX_MB`, `UPLOAD_DIR` | Media limitləri və local storage yolu |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Optional ilkin super admin |

Secret, database parolu və admin şifrəsi repository-yə əlavə edilməməlidir.
Production-da `JWT_ACCESS_SECRET` ayrıca secret manager-dən verilməlidir.

## Database və seed

Schema [prisma/schema.prisma](./prisma/schema.prisma) faylındadır.

```bash
# Lokal migration yaradılması
npm run db:migrate -- --name descriptive_name

# Mövcud migration-ların production-a tətbiqi
npm run db:deploy

# Təkrar icra oluna bilən demo seed
npm run db:seed
```

Seed dörd sistem rolunu və onların permission-larını, Azərbaycan dilində şöbə,
xidmət, həkim, məqalə, FAQ və sayt konfiqurasiyası nümunələrini yaradır. Hardcoded
admin yoxdur. İlkin administrator yalnız `SEED_ADMIN_EMAIL` və minimum 12 simvolluq
`SEED_ADMIN_PASSWORD` birlikdə verildikdə yaradılır.

Minimum rollar:

- Super Admin
- Content Manager
- Doctor Manager
- Support Operator

## Authentication

1. `POST /api/v1/auth/login` access və refresh token qaytarır.
2. Access token `Authorization: Bearer <token>` ilə göndərilir.
3. Refresh token HttpOnly cookie-də və native client dəstəyi üçün response body-də
   qaytarılır.
4. `POST /api/v1/auth/refresh` hər istifadədə tokeni rotasiya edir.
5. İstifadə olunmuş refresh token yenidən təqdim edilərsə bütün token ailəsi
   ləğv edilir.
6. `POST /api/v1/auth/logout` cari sessiyanı, `logout-all` bütün sessiyaları bağlayır.

Beş uğursuz login cəhdi hesabı 15 dəqiqə kilidləyir. Admin şifrəsi yeniləndikdə
aktiv refresh sessiyaları ləğv olunur.

## Əsas endpoint-lər

Public:

- `GET /api/v1/public/configuration`
- `GET /api/v1/public/executive-director`
- `GET /api/v1/public/doctors`, `/doctors/:slug`
- `GET /api/v1/public/departments`, `/departments/:slug`
- `GET /api/v1/public/services`, `/services/:slug`
- `GET /api/v1/public/articles`, `/articles/:slug`
- `GET /api/v1/public/content/{branches|faqs|testimonials|gallery|certificates|article-categories}`
- `GET /api/v1/public/pages`, `/pages/:slug`, `/search?q=...`
- `POST /api/v1/public/contact`

Admin:

- `GET /api/v1/admin/dashboard`
- `GET/PUT /api/v1/admin/executive-director`
- CRUD: `doctors`, `departments`, `services`, `articles`,
  `article-categories`, `faqs`, `testimonials`, `branches`, `gallery`,
  `certificates`, `navigation`, `settings`,
  `contacts`, `pages`, `home-sections`, `social-links`
- `GET/POST /api/v1/admin/users`, `GET/PATCH/DELETE /api/v1/admin/users/:id`
- `GET/POST/PATCH /api/v1/admin/roles`, `GET /permissions`
- `GET /api/v1/admin/activity-logs`
- `GET/POST/PUT/DELETE /api/v1/admin/media`
- WordPress tipli səhifə qurucusu:
  - `GET/POST /api/v1/admin/cms/pages`
  - `GET/PUT /api/v1/admin/cms/pages/:id`
  - `GET /api/v1/admin/cms/pages/:id/revisions`
  - `POST /api/v1/admin/cms/pages/:id/revisions/:revisionId/restore`

List endpoint-ləri `page`, `limit`, `search` və resursa uyğun `status`/`active`
parametrlərini qəbul edir. Cavab formatı sabitdir:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

## Media sistemi

Upload `multipart/form-data` formatında, `image` field-i ilə göndərilir. JPEG,
PNG, WebP və AVIF qəbul edilir. Multer faylı diskə yazmadan əvvəl ölçü və MIME
tipini yoxlayır; Sharp metadata-nı doğrulayır, EXIF orientation-u tətbiq edir,
maksimum 2400px WebP və 480px thumbnail yaradır. `PUT /admin/media/:id` faylı
əvəz edir və köhnə lokal asset-i təmizləyir. İstifadədə olan media silinmir.

Storage əməliyyatları `src/storage` abstraksiyasındadır; S3 adapteri eyni
`save/delete` contract-ı ilə əlavə edilə bilər.

## Struktur

```text
backend/
├── prisma/               # Schema, seed və migration-lar
├── src/
│   ├── config/           # Env, logger, Prisma
│   ├── constants/        # Admin entity registry
│   ├── controllers/      # HTTP adapters
│   ├── jobs/             # Scheduled publish/token cleanup
│   ├── middleware/       # Auth, RBAC, security, errors, audit
│   ├── routes/           # Public, auth və admin routes
│   ├── services/         # Business logic
│   ├── storage/          # Local/object-storage abstraction
│   ├── utils/            # Tokens, slug, pagination, responses
│   ├── validators/       # Zod request schemas
│   ├── app.js            # Express composition
│   └── server.js         # Runtime və graceful shutdown
├── tests/
└── uploads/              # Git-ignored local media
```

## Yoxlama və production

```bash
npm run check
npm test
npm start
```

`npm test` database olmadan liveness, security header, validation, auth guard,
token utility və real Sharp media pipeline testlərini işlədir. Tam inteqrasiya
testi ayrıca, yalnız silinə bilən test database-i ilə aktiv edilməlidir:

```bash
RUN_DB_TESTS=true DATABASE_URL="postgresql://.../medicare_test" npm test
```

Bu axın seed olunmuş public endpoint-ləri, login, refresh rotation/reuse
detection, RBAC dashboard, admin CRUD/soft-delete/restore, form yazıları,
media upload/delete, CMS səhifə yaratma, atomik bölmə sıralama və revision
restore əməliyyatlarını yoxlayır. Production database URL-i ilə
`RUN_DB_TESTS=true` istifadə etməyin.

Production deploy zamanı əvvəlcə `npm ci`, `npm run prisma:generate` və
`npm run db:deploy` icra edin. HTTPS arxasında `COOKIE_SECURE=true` seçin,
`TRUST_PROXY=true` yalnız etibarlı reverse proxy olduqda aktiv edin, ayrıca
PostgreSQL backup/retention siyasəti qurun və `uploads` üçün persistent volume
və ya S3 adapterindən istifadə edin. Birdən çox API instance olduqda maintenance
job-u ayrıca worker/cron prosesinə çıxarmaq tövsiyə olunur.

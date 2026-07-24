# Medicare Hospital

Layihə iki ayrı Node.js tətbiqindən ibarətdir:

- `frontend/` — Next.js public sayt və admin panel
- `backend/` — Express, Prisma və PostgreSQL REST API

## Lokal başlatma

Hazırkı lokal konfiqurasiya real PostgreSQL/API rejimindədir. Kök qovluqda
aşağıdakı komanda frontend və backend-i birlikdə başladır:

```bash
npm run start
```

Sayt `http://localhost:3000`, API isə `http://localhost:4000` ünvanında açılır.
Admin girişindən sonra `/admin/pages` səhifə qurucusu ilə səhifə bölmələrinin
məzmununu, görünməsini, sırasını, nəşr statusunu və SEO məlumatlarını idarə
etmək mümkündür.

Eyni əməliyyat üçün `npm run dev` də istifadə edilə bilər.

## Production frontend

```bash
npm run build
npm run frontend:start
```

## Backend

Yeni mühitdə backend üçün `backend/.env.example` faylını `backend/.env` kimi
kopyalayın, PostgreSQL bağlantısını və minimum 32 simvolluq
`JWT_ACCESS_SECRET` dəyərini təyin edin. Sonra:

```bash
cd backend
npm run prisma:generate
npm run db:deploy
npm run db:seed
cd ..
npm run backend:dev
```

Canlı API rejimi üçün `frontend/.env.local` daxilində
`NEXT_PUBLIC_USE_MOCK_API=false` və `NEXT_PUBLIC_ADMIN_DEMO_MODE=false` seçilməlidir.

## Yoxlama

```bash
npm run check
```

Bu komanda frontend lint, backend syntax və backend testlərini işlədir.

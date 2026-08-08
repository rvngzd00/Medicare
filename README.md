# Medicare Hospital

Layihə iki ayrı Node.js tətbiqindən ibarətdir:

- `frontend/` — Next.js public sayt və admin panel
- `backend/` — Express, Prisma və MySQL REST API

Tələb olunan versiyalar: Node.js `22.12–24.x`, npm `10+` və MySQL `8.x`.

## İlk quraşdırma

```bash
npm --prefix backend ci
npm --prefix frontend ci
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

`backend/.env` daxilində MySQL `DATABASE_URL`, minimum 32 simvolluq
`JWT_ACCESS_SECRET` və lazım olduqda ilkin admin məlumatlarını yazın. Sonra bazanı
hazırlayın:

```bash
npm --prefix backend run db:deploy
npm --prefix backend run db:seed
```

Seed komandası 25 qiymət kateqoriyasını və 684 xidmət sətrini də daxil olmaqla
başlanğıc kontenti yaradır. Admin paneldə edilmiş dəyişiklikləri qorumaq üçün
seed-i hər restartda işlətməyin.

## Lokal başlatma

MySQL işlək olduqda kök qovluqda bu komanda frontend və backend-i birlikdə
başladır:

```bash
npm run start
```

Sayt `http://localhost:3000`, API isə `http://localhost:4000` ünvanında açılır.
Admin girişindən sonra `/admin/pages` səhifə qurucusu ilə səhifə bölmələrinin
məzmununu, görünməsini, sırasını, nəşr statusunu və SEO məlumatlarını idarə
etmək mümkündür.

Eyni əməliyyat üçün `npm run dev` də istifadə edilə bilər.

macOS-da MySQL servisi dayanıbsa əvvəlcə:

```bash
brew services start mysql@8.4
```

## Yoxlama və production build

```bash
npm run check
npm run build
```

Production build zamanı canlı kontent istifadə edilirsə API əlçatan olmalıdır.
Frontend üçün `NEXT_PUBLIC_USE_MOCK_API=false` və
`NEXT_PUBLIC_ADMIN_DEMO_MODE=false` saxlayın.

## Production start

Backend-də `npm ci` Prisma Client-i avtomatik generasiya edir. Migration release
addımı kimi ayrıca tətbiq edilir, `npm start` isə yalnız API-ni başladır. Seed
yalnız ilk deploy zamanı ayrıca işlədilir:

```bash
npm --prefix backend ci
npm --prefix backend run db:deploy
npm --prefix backend run db:seed
npm --prefix backend start
```

Frontend:

```bash
npm --prefix frontend ci
npm --prefix frontend run build
npm --prefix frontend start
```

Real `.env` fayllarını, `node_modules` və `.next` qovluqlarını repository-yə və
deploy arxivinə daxil etməyin. Hostinger-də secret-ləri ayrıca environment
dəyişənləri kimi təyin edin.

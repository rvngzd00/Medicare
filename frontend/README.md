# Medicare Hospital — Frontend

Medicare Hospital üçün Next.js App Router əsasında hazırlanmış public sayt və admin interfeysinin frontend layihəsidir. Public hissə Azərbaycan dilində, responsiv, SEO-uyğun və əlçatandır. Layihə backend olmadan lokal demo kimi açıla, yaxud eyni kod bazası ilə PostgreSQL/Express API-dən canlı məzmun və admin əməliyyatları ilə işləyə bilir.

## Texnologiyalar

- Next.js 15.5.21 və React 19.2.8
- JavaScript (TypeScript istifadə edilmir)
- App Router, Server Components və statik yaradılan dinamik səhifələr
- Custom Global CSS və CSS Modules
- `next/image` ilə AVIF/WebP çatdırılması
- Schema.org JSON-LD, dinamik metadata, sitemap və robots
- Native `IntersectionObserver` və CSS animasiyaları

Heç bir CSS/UI framework, hazır tema və böyük ikon kitabxanası istifadə edilmir.

## Sürətli başlanğıc

Tələblər: Node.js 20+ və npm 10+.

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

`.env.example` təhlükəsiz real API rejimi üçün hazırdır; formalar backend olmadan saxta uğur cavabı göstərmir. Sayt standart olaraq `http://localhost:3000` ünvanında açılır.

Yalnız təqdimat məqsədli standalone demo üçün hər iki dəyişəni açıq şəkildə `true` edin:

```dotenv
NEXT_PUBLIC_USE_MOCK_API=true
NEXT_PUBLIC_ADMIN_DEMO_MODE=true
```

Tam lokal stack üçün əvvəlcə [backend quraşdırmasını](../backend/README.md#quraşdırma) tamamlayıb API-ni `http://localhost:4000` ünvanında başladın. Sonra frontend `.env.local` faylında bu dəyərləri seçin:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_ADMIN_DEMO_MODE=false
```

Backend `CORS_ORIGINS` siyahısında frontend origin-i, lokal mühitdə adətən `http://localhost:3000`, olmalıdır.

## Environment dəyişənləri

| Dəyişən | Təyinat | Nümunə |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Public servis üçün `/api/v1` daxil olmaqla tam REST baza URL-i; CMS media origin-i də buradan çıxarılır | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | Canonical, Open Graph, JSON-LD, sitemap və robots üçün public sayt origin-i | `http://localhost:3000` |
| `NEXT_PUBLIC_MAP_EMBED_URL` | Xarici xəritə inteqrasiyası üçün rezerv edilmiş optional dəyər; hazırkı `MapBlock` daxili vizualdan istifadə edir | boş |
| `NEXT_PUBLIC_USE_MOCK_API` | Public məzmunu və formaları lokal (`true`) və ya real API (`false`) rejimində işlədir | `false` |
| `NEXT_PUBLIC_ADMIN_DEMO_MODE` | Admin auth/data rejimini ayrıca idarə edir; verilmədikdə yalnız public mock flag açıqdırsa demo olur | `false` |

İki rejim müstəqil seçilə bilər:

| Public flag | Admin flag | Nəticə |
| --- | --- | --- |
| `true` | `true` | Tam standalone demo; backend lazım deyil |
| `false` | `true` | Canlı public sayt, demo admin |
| `true` | `false` | Lokal public məzmun, real admin |
| `false` | `false` | Tam real API rejimi |

`NEXT_PUBLIC_ADMIN_DEMO_MODE` ümumiyyətlə verilməzsə admin rejimi `NEXT_PUBLIC_USE_MOCK_API` dəyərindən götürülür. `NEXT_PUBLIC_*` dəyərləri brauzer bundle-ına daxil olduğu üçün production build-dən əvvəl təyin edilməli, dəyişiklikdən sonra tətbiq yenidən build edilməlidir.

Backend işləyərkən real public məzmun və forma sorğuları üçün `NEXT_PUBLIC_USE_MOCK_API=false` seçin. Frontend aşağıdakı public endpoint-lərlə işləyir:

- `GET /public/configuration`
- `GET /public/doctors`
- `GET /public/doctors/:slug`
- `GET /public/departments`
- `GET /public/departments/:slug`
- `GET /public/services`
- `GET /public/services/:slug`
- `GET /public/articles`
- `GET /public/articles/:slug`
- `GET /public/content/branches`
- `GET /public/content/faqs`
- `GET /public/content/testimonials`
- `GET /public/content/gallery`
- `GET /public/content/certificates`
- `GET /public/pages/about`
- `POST /public/contact`

Tam URL `NEXT_PUBLIC_API_URL` ilə birləşdirilir; public rejim üçün bu dəyişən `/api/v1` hissəsini də daşımalıdır. URL komponentlərdə hardcode edilmir. Admin servis qatı həm `http://localhost:4000`, həm də `http://localhost:4000/api/v1` formasını normallaşdıra bilir, lakin bütün tətbiq üçün yuxarıdakı tam baza URL-dən istifadə etmək tövsiyə olunur.

Əlaqə formu `firstName`, `lastName`, `email`, `phone`, `subject`, `message` və `privacyConsent` müqaviləsinə normallaşdırılır. Əsas çağırış düymələri hospitalın rəsmi telefon nömrəsinə birbaşa zəng başladır.

## Public məzmun rejimləri

Yalnız açıq şəkildə seçilən `NEXT_PUBLIC_USE_MOCK_API=true` rejimində ana səhifə, kataloqlar, axtarış, FAQ, əlaqə/filial, haqqımızda kontent blokları və detail səhifələri lokal data ilə yaradılır; əlaqə forması gecikməni simulyasiya edən lokal uğurlu cavab qaytarır. Backend olmadan həm lint, həm də production build tamamlanır.

`NEXT_PUBLIC_USE_MOCK_API=false` olduqda ana səhifədəki seçilmiş kontent, həkim/şöbə/xidmət/məqalə indeksləri və detail route-ları, axtarış datası, FAQ, rəylər, filiallar, qalereya, sertifikatlar və “Haqqımızda” səhifəsi server tərəfdə public API-dən alınır. Public konfiqurasiya sorğusu brend adı/sloqanı, hero məzmununu, əlaqə məlumatlarını, ayrıca header/footer naviqasiyasını, sosial linkləri, qlobal SEO, optional GA4 identifikatorunu, cookie banner görünməsini və maintenance vəziyyətini idarə edir. Analytics yalnız istifadəçi “bütün kukilər” seçdikdən sonra yüklənir. Sitemap-də detail URL-ləri ilə yanaşı adminin yaratdığı yeni nəşr edilmiş CMS səhifələri də eyni canlı mənbədən qurulur.

Kolleksiya və konfiqurasiya GET sorğuları Next.js Data Cache vasitəsilə 300 saniyəlik `revalidate` intervalı ilə yenilənir; səhifə qurucusunun `ContentPage/PageSection` sorğuları isə admin dəyişikliklərini gecikdirmədən göstərmək üçün `no-store` işləyir. Hər sorğu üçün 5 saniyəlik timeout tətbiq olunur. API müvəqqəti əlçatmaz olduqda kolleksiyalar və konfiqurasiya xəbərdarlıqla lokal fallback-a keçir. Server uğurla boş kolleksiya, naviqasiya və ya sosial-link siyahısı qaytararsa demo dəyərləri bərpa edilmir; bu, həqiqi empty state kimi qəbul olunur.

Detail route-larında `generateStaticParams` mock slug-ları ilkin prebuild üçün saxlayır, `dynamicParams=true` isə CMS-də sonradan yaradılan slug-ların runtime-da açılmasına imkan verir. Real API `404` qaytararsa səhifə not-found vəziyyətinə keçir. API müvəqqəti əlçatmaz olduqda mövcud mock slug-lar açıq xəbərdarlıqla nümunə məzmuna keçir; yalnız backend-də ola biləcək naməlum slug üçün professional 503 vəziyyəti göstərilir.

## Əsas komandalar

```bash
npm run dev
npm run lint
npm run build
npm run start
```

`npm run build` production bundle yaradır, `npm run start` həmin bundle-ı işə salır.

## Public səhifələr

- Ana səhifə, haqqımızda, şöbələr, xidmətlər və həkimlər
- Dinamik həkim, şöbə, xidmət və məqalə detail səhifələri
- Xəbərlər və tibbi məqalələr
- Birbaşa telefon əlaqəsi və əlaqə forması
- FAQ, axtarış, məxfilik, istifadə şərtləri və kuki siyasəti
- 404, 500, loading, empty, error və success vəziyyətləri

## Admin panel

`/admin/login` giriş səhifəsi, `/admin` isə qorunan idarəetmə shell-i açır. Hazır modullar:

- Dashboard, ümumi göstəricilər və fəaliyyət axını
- Həkim, şöbə, xidmət, məqalə və istifadəçi CRUD ekranları
- Əlaqə mesajları
- Ana səhifə, “Haqqımızda”, FAQ, filial, rəy, qalereya, sertifikat, naviqasiya, sosial hesab və əlaqə kontenti
- Baş direktorun adı, vəzifəsi, fotosu, müraciəti, imzası və ana səhifədə görünməsi
- WordPress tipli səhifə qurucusu: yeni səhifə, blok tipi, mətn, media/link parametrləri, görünürlük, sıra, nəşr statusu, SEO və revision bərpası
- Rollar və icazələr
- Sayt, əlaqə, sosial media və SEO parametrləri

`NEXT_PUBLIC_ADMIN_DEMO_MODE=true` olduqda admin interfeysi lokal demo data ilə işləyir və real credential tələb etmir. Dəyişikliklər yalnız cari UI sessiyasında simulyasiya olunur, backend-ə yazılmır. Bu rejim təqdimat və frontend yoxlaması üçündür. Dəyişən verilməzsə admin panel yalnız `NEXT_PUBLIC_USE_MOCK_API=true` olduqda demo rejiminə keçir; heç bir flag verilmədikdə real rejim seçilir.

Real rejimdə giriş `POST /auth/login` ilə aparılır. Access token yalnız JavaScript yaddaşında saxlanır; refresh token backend tərəfindən `HttpOnly` cookie kimi idarə edilir. API sorğusu `401` aldıqda frontend `POST /auth/refresh` çağırışını tək prosesdə birləşdirir, yeni access tokenlə sorğunu bir dəfə təkrarlayır və refresh uğursuz olarsa session-expired hadisəsi ilə login səhifəsinə yönləndirir. Logout `POST /auth/logout` vasitəsilə server sessiyasını bağlayır.

Real admin rejimində dashboard və audit axını API-dən oxunur; əsas resurslar və məzmun modulları create/update/delete əməliyyatlarını backend-ə yazır; əlaqə mesajları, istifadəçilər, rollar/icazələr, media və sayt parametrləri ayrıca endpoint-lərlə idarə olunur. Admin naviqasiyası sessiyanın permission siyahısına görə süzülür. Mesaj ekranındakı cavab qaralaması backend-də daxili qeyd kimi saxlanılır, lakin mail göndərmə endpoint-i olmadığı üçün UI uğurlu e-mail göndərişi iddia etmir. Daha detallı contract xəritəsi [admin komponent sənədində](./components/admin/README.md) verilib.

Kod bazasında hardcoded admin e-maili, şifrə, access token və ya refresh token yoxdur. Real secret-lər yalnız backend mühitində saxlanmalıdır.

## Qovluq strukturu

```text
frontend/
├── app/
│   ├── (public)/          # Public route-lar və public layout
│   ├── admin/             # Admin panel route-ları
│   ├── globals.css
│   ├── layout.js
│   ├── robots.js
│   └── sitemap.js
├── components/
│   ├── animations/
│   ├── common/
│   ├── departments/
│   ├── doctors/
│   ├── forms/
│   ├── home/
│   ├── layout/
│   ├── news/
│   ├── search/
│   └── services/
├── constants/
├── data/
├── hooks/
├── public/images/
├── services/
├── styles/
└── utils/
```

## SEO və media

`utils/seo.js` canonical, robots, keywords, Open Graph və Twitter metadata-nı mərkəzləşdirir. Həkim, şöbə, xidmət və məqalələrin CMS-dəki fərdi SEO sahələri dinamik metadata-ya tətbiq olunur; qlobal SEO parametrləri ana səhifənin fallback metadata-sını idarə edir. `app/sitemap.js` aktiv content mənbəyindən bütün detail URL-lərini yaradır. `app/robots.js` normal halda admin və API route-larını indeksləmədən çıxarır; real konfiqurasiyada indeksləmə söndürülərsə bütün sayt üçün `Disallow: /` qaytarır.

Orijinal PNG vizuallar `public/images` altında saxlanılır. `next/image` brauzer dəstəyinə uyğun AVIF və WebP təqdim edir, responsive `sizes` və lazy loading istifadə olunur. Real API origin-i avtomatik olaraq remote image qaydalarına əlavə edilir; CMS-dən şəkil gəlmədikdə `SmartImage` əlçatan lokal fallback göstərir.

## Accessibility və animasiya

Saytda semantik HTML, skip link, görünən focus, klaviatura ilə idarə olunan mobil drawer və accordion, form label/error əlaqələri, canlı success/error statusları və minimum rahat touch ölçüləri nəzərə alınıb. `prefers-reduced-motion: reduce` aktiv olduqda reveal, counter və mikroanimasiya minimuma endirilir.

## Deployment

Production üçün:

1. `NEXT_PUBLIC_SITE_URL` real HTTPS domeninə dəyişdirin.
2. `NEXT_PUBLIC_API_URL` production API gateway ünvanına yönəldin.
3. `NEXT_PUBLIC_USE_MOCK_API=false` və `NEXT_PUBLIC_ADMIN_DEMO_MODE=false` seçin.
4. `npm ci && npm run lint && npm run build` icra edin.
5. `.next` bundle-ını Node.js hostingdə `npm run start` ilə başladın və ya Next.js uyğun platformaya yerləşdirin.
6. Frontend origin-in backend `CORS_ORIGINS` siyahısında olduğunu və HTTPS mühitində backend refresh cookie parametrlərinin production üçün qurulduğunu yoxlayın.

Real secret-lər frontend env dəyişənlərinə yazılmamalıdır. `NEXT_PUBLIC_*` dəyişənləri brauzer bundle-ında görünür.

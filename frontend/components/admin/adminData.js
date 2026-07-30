export const adminNavigation = [
  {
    label: "Ümumi",
    items: [{ label: "İdarə paneli", href: "/admin", icon: "dashboard", exact: true }],
  },
  {
    label: "Tibbi kontent",
    items: [
      { label: "Həkimlər", href: "/admin/doctors", icon: "doctors", badge: "24" },
      { label: "Şöbələr", href: "/admin/departments", icon: "departments" },
      { label: "Xidmətlər", href: "/admin/services", icon: "services" },
      { label: "Məqalələr", href: "/admin/articles", icon: "articles", badge: "3" },
    ],
  },
  {
    label: "Kommunikasiya",
    items: [
      { label: "Mesajlar", href: "/admin/messages", icon: "messages", badge: "5", accent: true },
    ],
  },
  {
    label: "Sayt və sistem",
    items: [
      { label: "Sayt kontenti", href: "/admin/content", icon: "content" },
      { label: "Baş direktor", href: "/admin/content/director", icon: "users" },
      { label: "Səhifə qurucusu", href: "/admin/pages", icon: "menu" },
      { label: "Parametrlər", href: "/admin/settings", icon: "settings" },
      { label: "İstifadəçilər", href: "/admin/users", icon: "users" },
      { label: "Rollar və icazələr", href: "/admin/roles", icon: "roles" },
    ],
  },
];

export const pageMeta = {
  "/admin": ["İdarə paneli", "Medicare üzrə son göstəricilər"],
  "/admin/doctors": ["Həkimlər", "Tibbi heyət və profillər"],
  "/admin/departments": ["Şöbələr", "Klinik istiqamətlər"],
  "/admin/services": ["Xidmətlər", "Tibbi xidmət kataloqu"],
  "/admin/articles": ["Məqalələr", "Xəbərlər və sağlamlıq materialları"],
  "/admin/messages": ["Mesajlar", "Əlaqə mərkəzi gələnlər qutusu"],
  "/admin/content": ["Sayt kontenti", "Public səhifə və bölmələr"],
  "/admin/content/director": ["Baş direktor", "Ana səhifədəki rəhbər təqdimatı"],
  "/admin/pages": ["Səhifə qurucusu", "Səhifə, bölmə, sıra və nəşr idarəsi"],
  "/admin/settings": ["Parametrlər", "Sayt və sistem konfiqurasiyası"],
  "/admin/users": ["İstifadəçilər", "Admin hesablarının idarəsi"],
  "/admin/roles": ["Rollar və icazələr", "Giriş səlahiyyətləri"],
};

export const dashboardStats = [
  { label: "Aktiv həkimlər", value: "24", change: "+2 bu ay", trend: "up", icon: "doctors", tone: "blue" },
  { label: "Tibbi şöbələr", value: "10", change: "Hamısı aktiv", trend: "neutral", icon: "departments", tone: "navy" },
  { label: "Dərc olunmuş məqalə", value: "18", change: "Kontent bazası", trend: "neutral", icon: "articles", tone: "red" },
  { label: "Oxunmamış mesaj", value: "5", change: "3 prioritet", trend: "down", icon: "messages", tone: "amber" },
];

export const activityItems = [
  { actor: "Nigar Məmmədova", action: "“Kardioloji check-up” xidmətini yenilədi", time: "8 dəq əvvəl", type: "edit" },
  { actor: "Murad Əliyev", action: "yeni əlaqə mesajını cavablandırdı", time: "24 dəq əvvəl", type: "check" },
  { actor: "Aysel Həsənli", action: "“Mövsümi allergiyadan qorunma” məqaləsini yayımladı", time: "1 saat əvvəl", type: "publish" },
  { actor: "Sistem", action: "gecə ehtiyat nüsxəsini uğurla tamamladı", time: "Bu gün, 04:00", type: "system" },
  { actor: "Elvin Qasımov", action: "Dr. Leyla Məmmədovanın qrafikini dəyişdi", time: "Dünən, 17:42", type: "calendar" },
];

export const resourceConfigs = {
  doctors: {
    title: "Həkimlər",
    description: "Həkim profillərini, iş qrafiklərini və görünmə statuslarını idarə edin.",
    singular: "Həkim",
    createLabel: "Yeni həkim",
    createHref: "/admin/doctors/new",
    editBase: "/admin/doctors",
    searchPlaceholder: "Həkim adı, ixtisas və ya şöbə...",
    columns: [
      { key: "name", label: "Həkim", type: "person" },
      { key: "department", label: "Şöbə" },
      { key: "branch", label: "Filial" },
      { key: "experience", label: "Təcrübə" },
      { key: "status", label: "Status", type: "status" },
    ],
    rows: [
      { id: "dr-elcin-rzayev", name: "Dr. Elçin Rzayev", detail: "Kardioloq · invaziv kardiologiya", initials: "ER", department: "Kardiologiya", branch: "Medicare Hospital — Sabunçu", experience: "18 il", status: "Aktiv", featured: true, updatedAt: "23.07.2026" },
      { id: "dr-nigar-aliyeva", name: "Dr. Nigar Əliyeva", detail: "Nevroloq · klinik neyrofiziologiya", initials: "NA", department: "Nevrologiya", branch: "Medicare Hospital — Sabunçu", experience: "14 il", status: "Aktiv", featured: true, updatedAt: "22.07.2026" },
      { id: "dr-kamran-ismayilov", name: "Dr. Kamran İsmayılov", detail: "Pediatr · uşaq infeksiyaları", initials: "Kİ", department: "Pediatriya", branch: "Medicare Hospital — Sabunçu", experience: "12 il", status: "Aktiv", featured: false, updatedAt: "20.07.2026" },
      { id: "dr-leyla-mammadova", name: "Dr. Leyla Məmmədova", detail: "Dermatoloq · dermatoonkologiya", initials: "LM", department: "Dermatologiya", branch: "Medicare Hospital — Sabunçu", experience: "11 il", status: "Aktiv", featured: true, updatedAt: "19.07.2026" },
      { id: "dr-orxan-sadigov", name: "Dr. Orxan Sadıqov", detail: "Ümumi cərrah · laparoskopiya", initials: "OS", department: "Cərrahiyyə", branch: "Medicare Hospital — Sabunçu", experience: "16 il", status: "Məzuniyyətdə", featured: false, updatedAt: "18.07.2026" },
      { id: "dr-sevinc-babayevа", name: "Dr. Sevinc Babayeva", detail: "Oftalmoloq · retina mütəxəssisi", initials: "SB", department: "Oftalmologiya", branch: "Medicare Hospital — Sabunçu", experience: "9 il", status: "Qaralama", featured: false, updatedAt: "17.07.2026" },
    ],
    groups: [
      {
        title: "Əsas məlumatlar",
        description: "Public profildə görünəcək şəxsiyyət və ixtisas məlumatları.",
        fields: [
          { name: "firstName", label: "Ad", type: "text", required: true, placeholder: "Məsələn, Elçin", width: "half" },
          { name: "lastName", label: "Soyad", type: "text", required: true, placeholder: "Məsələn, Rzayev", width: "half" },
          { name: "specialty", label: "İxtisas", type: "text", required: true, placeholder: "Kardioloq", width: "half" },
          { name: "department", label: "Şöbə", type: "select", required: true, options: ["Kardiologiya", "Nevrologiya", "Pediatriya", "Cərrahiyyə", "Dermatologiya", "Oftalmologiya"], width: "half" },
          { name: "branch", label: "Filial", type: "select", required: true, options: ["Medicare Hospital — Sabunçu"], width: "half" },
          { name: "experience", label: "İş təcrübəsi (il)", type: "number", required: true, placeholder: "10", width: "half" },
          { name: "bio", label: "Qısa peşəkar təqdimat", type: "textarea", required: true, placeholder: "Həkimin klinik təcrübəsi və əsas ekspertiza sahələri..." },
          { name: "photo", label: "Profil şəkli", type: "file", accept: "image/png,image/jpeg,image/webp", help: "JPG, PNG və ya WebP · maksimum 5 MB · tövsiyə olunan 900×1100 px" },
        ],
      },
      {
        title: "Peşəkar profil",
        description: "Təhsil, sertifikat və klinik fəaliyyət məlumatları.",
        fields: [
          { name: "education", label: "Təhsil", type: "textarea", placeholder: "Hər təhsil qeydini yeni sətirdən yazın", width: "half" },
          { name: "certificates", label: "Sertifikatlar", type: "textarea", placeholder: "Sertifikat adı və verilmə ili", width: "half" },
          { name: "languages", label: "Bildiyi dillər", type: "tags", placeholder: "Dil yazıb Enter basın", width: "half" },
          { name: "conditions", label: "Müalicə etdiyi xəstəliklər", type: "tags", placeholder: "Xəstəlik yazıb Enter basın", width: "half" },
          { name: "procedures", label: "İcra etdiyi prosedurlar", type: "textarea", placeholder: "Prosedurları yeni sətirdən daxil edin" },
        ],
      },
      {
        title: "Əlaqə və iş qrafiki",
        description: "Qəbul planlaması və peşəkar əlaqə kanalları.",
        fields: [
          { name: "email", label: "İş e-maili", type: "email", placeholder: "doctor@medicarehospital.az", width: "half" },
          { name: "phone", label: "Daxili telefon", type: "tel", placeholder: "+994 12 000 00 00", width: "half" },
          { name: "schedule", label: "İş günləri", type: "multiselect", options: ["Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə"], width: "half" },
          { name: "hours", label: "Qəbul saatları", type: "text", placeholder: "09:00–17:00", width: "half" },
        ],
      },
      {
        title: "SEO və görünmə",
        description: "Axtarış nəticələri və saytda təqdimat parametrləri.",
        fields: [
          { name: "slug", label: "URL slug", type: "slug", required: true, placeholder: "dr-ad-soyad" },
          { name: "seoTitle", label: "SEO başlıq", type: "text", maxLength: 60, placeholder: "Dr. Ad Soyad — İxtisas | Medicare" },
          { name: "seoDescription", label: "Meta təsvir", type: "textarea", maxLength: 160, placeholder: "Axtarış nəticələrində görünəcək qısa təsvir..." },
          { name: "featured", label: "Seçilmiş həkim", type: "toggle", help: "Ana səhifənin seçilmiş həkimlər bölməsində göstərilsin." },
          { name: "active", label: "Profili aktiv et", type: "toggle", defaultChecked: true, help: "Aktiv profil public saytda görünür." },
        ],
      },
    ],
  },
  departments: {
    title: "Şöbələr",
    description: "Tibbi şöbələrin kontentini, həkimlərini və sıralamasını idarə edin.",
    singular: "Şöbə",
    createLabel: "Yeni şöbə",
    createHref: "/admin/departments/new",
    editBase: "/admin/departments",
    searchPlaceholder: "Şöbə adı və ya rəhbər həkim...",
    columns: [
      { key: "name", label: "Şöbə", type: "entity" },
      { key: "head", label: "Şöbə rəhbəri" },
      { key: "doctors", label: "Həkim sayı" },
      { key: "order", label: "Sıra" },
      { key: "status", label: "Status", type: "status" },
    ],
    rows: [
      { id: "kardiologiya", name: "Kardiologiya", detail: "Ürək və damar sağlamlığı", initials: "KR", head: "Dr. Elçin Rzayev", doctors: "4 həkim", order: "01", status: "Aktiv", updatedAt: "23.07.2026" },
      { id: "nevrologiya", name: "Nevrologiya", detail: "Sinir sistemi xəstəlikləri", initials: "NV", head: "Dr. Nigar Əliyeva", doctors: "3 həkim", order: "02", status: "Aktiv", updatedAt: "22.07.2026" },
      { id: "pediatriya", name: "Pediatriya", detail: "Uşaq sağlamlığı və inkişafı", initials: "PD", head: "Dr. Kamran İsmayılov", doctors: "4 həkim", order: "03", status: "Aktiv", updatedAt: "21.07.2026" },
      { id: "cerrahiyye", name: "Cərrahiyyə", detail: "Ümumi və minimal invaziv cərrahiyyə", initials: "CR", head: "Dr. Orxan Sadıqov", doctors: "5 həkim", order: "04", status: "Aktiv", updatedAt: "20.07.2026" },
      { id: "dermatologiya", name: "Dermatologiya", detail: "Dəri sağlamlığı və estetik tibb", initials: "DR", head: "Dr. Leyla Məmmədova", doctors: "2 həkim", order: "05", status: "Aktiv", updatedAt: "19.07.2026" },
      { id: "stomatologiya", name: "Stomatologiya", detail: "Ağız və diş sağlamlığı", initials: "ST", head: "Təyin edilməyib", doctors: "0 həkim", order: "08", status: "Qaralama", updatedAt: "16.07.2026" },
    ],
    groups: [
      {
        title: "Şöbə məlumatları",
        description: "Şöbənin public səhifəsində görünəcək əsas kontent.",
        fields: [
          { name: "name", label: "Şöbənin adı", type: "text", required: true, placeholder: "Məsələn, Kardiologiya", width: "half" },
          { name: "order", label: "Sıralama", type: "number", required: true, placeholder: "1", width: "half" },
          { name: "summary", label: "Qısa təsvir", type: "textarea", required: true, maxLength: 220, placeholder: "Şöbənin əsas fəaliyyət istiqaməti..." },
          { name: "description", label: "Ətraflı məzmun", type: "richtext", required: true, placeholder: "Şöbənin imkanları, yanaşması və üstünlükləri..." },
          { name: "image", label: "Cover şəkli", type: "file", accept: "image/png,image/jpeg,image/webp", help: "Tövsiyə olunan ölçü 1600×900 px." },
        ],
      },
      {
        title: "Klinik struktur",
        description: "Əlaqəli həkim, xidmət və məlumat blokları.",
        fields: [
          { name: "head", label: "Şöbə rəhbəri", type: "select", options: ["Dr. Elçin Rzayev", "Dr. Nigar Əliyeva", "Dr. Kamran İsmayılov", "Dr. Orxan Sadıqov"], width: "half" },
          { name: "doctors", label: "Həkimlər", type: "multiselect", options: ["Dr. Elçin Rzayev", "Dr. Nigar Əliyeva", "Dr. Kamran İsmayılov", "Dr. Leyla Məmmədova"], width: "half" },
          { name: "services", label: "Əlaqəli xidmətlər", type: "multiselect", options: ["Kardioloji check-up", "Exokardioqrafiya", "EEQ müayinəsi", "Laborator paket"], width: "half" },
          { name: "conditions", label: "Müalicə olunan xəstəliklər", type: "tags", placeholder: "Xəstəlik adı yazıb Enter basın" },
          { name: "faq", label: "FAQ qeydləri", type: "textarea", placeholder: "Sual və cavabları strukturlaşdırılmış şəkildə daxil edin" },
        ],
      },
      {
        title: "SEO və nəşr",
        description: "URL, axtarış görünüşü və status.",
        fields: [
          { name: "slug", label: "URL slug", type: "slug", required: true, placeholder: "kardiologiya" },
          { name: "seoTitle", label: "SEO başlıq", type: "text", maxLength: 60 },
          { name: "seoDescription", label: "Meta təsvir", type: "textarea", maxLength: 160 },
          { name: "active", label: "Şöbəni aktiv et", type: "toggle", defaultChecked: true, help: "Aktiv şöbə public kataloqda görünür." },
        ],
      },
    ],
  },
  services: {
    title: "Xidmətlər",
    description: "Xidmət kataloqunu, şöbə əlaqələrini və qiymət məlumatlarını idarə edin.",
    singular: "Xidmət",
    createLabel: "Yeni xidmət",
    createHref: "/admin/services/new",
    editBase: "/admin/services",
    searchPlaceholder: "Xidmət və ya şöbə üzrə axtarın...",
    columns: [
      { key: "name", label: "Xidmət", type: "entity" },
      { key: "department", label: "Şöbə" },
      { key: "price", label: "Qiymət" },
      { key: "updatedAt", label: "Yenilənib" },
      { key: "status", label: "Status", type: "status" },
    ],
    rows: [
      { id: "kardioloji-check-up", name: "Kardioloji check-up", detail: "Kompleks ürək-damar müayinəsi", initials: "KC", department: "Kardiologiya", price: "120 AZN-dən", updatedAt: "23.07.2026", status: "Aktiv" },
      { id: "exokardioqrafiya", name: "Exokardioqrafiya", detail: "Rəngli Doppler ürək müayinəsi", initials: "EX", department: "Kardiologiya", price: "65 AZN", updatedAt: "21.07.2026", status: "Aktiv" },
      { id: "eeq-muayinesi", name: "EEQ müayinəsi", detail: "Beyin bioelektrik aktivliyinin ölçülməsi", initials: "EE", department: "Nevrologiya", price: "45 AZN", updatedAt: "20.07.2026", status: "Aktiv" },
      { id: "usaq-check-up", name: "Uşaq check-up paketi", detail: "0–16 yaş üçün profilaktik müayinə", initials: "UC", department: "Pediatriya", price: "95 AZN-dən", updatedAt: "19.07.2026", status: "Aktiv" },
      { id: "dermatoskopiya", name: "Rəqəmsal dermatoskopiya", detail: "Xalların və dəri törəmələrinin analizi", initials: "RD", department: "Dermatologiya", price: "50 AZN", updatedAt: "18.07.2026", status: "Aktiv" },
      { id: "genetik-panel", name: "Genetik risk paneli", detail: "Fərdiləşdirilmiş genetik analiz", initials: "GP", department: "Laboratoriya", price: "Sorğu ilə", updatedAt: "15.07.2026", status: "Qaralama" },
    ],
    groups: [
      {
        title: "Xidmət məlumatları",
        description: "Xidmət kartı və detal səhifəsi üçün əsas kontent.",
        fields: [
          { name: "name", label: "Xidmət adı", type: "text", required: true, placeholder: "Məsələn, Kardioloji check-up" },
          { name: "department", label: "Şöbə", type: "select", required: true, options: ["Kardiologiya", "Nevrologiya", "Pediatriya", "Cərrahiyyə", "Dermatologiya", "Laboratoriya"], width: "half" },
          { name: "icon", label: "İkon açarı", type: "text", placeholder: "heart-pulse", width: "half", help: "Saytın daxili SVG ikon kataloqundan açar." },
          { name: "summary", label: "Qısa təsvir", type: "textarea", maxLength: 220, required: true },
          { name: "description", label: "Ətraflı məzmun", type: "richtext", required: true },
          { name: "image", label: "Xidmət şəkli", type: "file", accept: "image/png,image/jpeg,image/webp" },
        ],
      },
      {
        title: "Qiymət və hazırlıq",
        description: "Pasiyent üçün prosedur öncəsi faydalı məlumatlar.",
        fields: [
          { name: "price", label: "Başlanğıc qiyməti", type: "number", placeholder: "120", width: "half" },
          { name: "currency", label: "Valyuta", type: "select", options: ["AZN", "USD", "EUR"], width: "half" },
          { name: "duration", label: "Müddət", type: "text", placeholder: "45–60 dəqiqə", width: "half" },
          { name: "preparation", label: "Hazırlıq qaydaları", type: "textarea", placeholder: "Müayinədən öncə nəzərə alınmalı məqamlar..." },
          { name: "included", label: "Paketə daxildir", type: "tags", placeholder: "Bənd yazıb Enter basın" },
        ],
      },
      {
        title: "SEO və nəşr",
        description: "URL, axtarış görünüşü və status.",
        fields: [
          { name: "slug", label: "URL slug", type: "slug", required: true, placeholder: "kardioloji-check-up" },
          { name: "seoTitle", label: "SEO başlıq", type: "text", maxLength: 60 },
          { name: "seoDescription", label: "Meta təsvir", type: "textarea", maxLength: 160 },
          { name: "featured", label: "Seçilmiş xidmət", type: "toggle", help: "Ana səhifədə önə çıxarılsın." },
          { name: "active", label: "Xidməti aktiv et", type: "toggle", defaultChecked: true },
        ],
      },
    ],
  },
  articles: {
    title: "Məqalələr",
    description: "Xəbər və tibbi məqalələri planlayın, redaktə edin və yayımlayın.",
    singular: "Məqalə",
    createLabel: "Yeni məqalə",
    createHref: "/admin/articles/new",
    editBase: "/admin/articles",
    searchPlaceholder: "Başlıq, müəllif və ya kateqoriya...",
    columns: [
      { key: "name", label: "Məqalə", type: "article" },
      { key: "category", label: "Kateqoriya" },
      { key: "author", label: "Müəllif" },
      { key: "publishDate", label: "Nəşr tarixi" },
      { key: "status", label: "Status", type: "status" },
    ],
    rows: [
      { id: "urek-saglamligi-ucun-7-addim", name: "Ürək sağlamlığını qorumaq üçün 7 praktik addım", detail: "6 dəq oxuma · 1 284 baxış", initials: "ÜS", category: "Kardiologiya", author: "Dr. Elçin Rzayev", publishDate: "23.07.2026", status: "Dərc olunub", featured: true },
      { id: "yuxu-keyfiyyeti-ve-beyin", name: "Yuxu keyfiyyəti beyin sağlamlığına necə təsir edir?", detail: "8 dəq oxuma · 946 baxış", initials: "YQ", category: "Nevrologiya", author: "Dr. Nigar Əliyeva", publishDate: "21.07.2026", status: "Dərc olunub", featured: false },
      { id: "usaqlarda-yay-infeksiyalari", name: "Uşaqlarda yay infeksiyaları: valideyn bələdçisi", detail: "5 dəq oxuma · 738 baxış", initials: "UY", category: "Pediatriya", author: "Dr. Kamran İsmayılov", publishDate: "19.07.2026", status: "Dərc olunub", featured: false },
      { id: "gunesten-dogru-qorunma", name: "Günəşdən doğru qorunma və SPF seçimi", detail: "4 dəq oxuma · planlaşdırılıb", initials: "GQ", category: "Dermatologiya", author: "Dr. Leyla Məmmədova", publishDate: "25.07.2026, 10:00", status: "Planlaşdırılıb", featured: true },
      { id: "profilaktik-checkup", name: "Profilaktik check-up nə zaman edilməlidir?", detail: "7 dəq oxuma · redaktədə", initials: "PC", category: "Profilaktika", author: "Aysel Həsənli", publishDate: "—", status: "Qaralama", featured: false },
      { id: "laborator-netice", name: "Laborator nəticələri düzgün anlamaq", detail: "9 dəq oxuma · yoxlamada", initials: "LN", category: "Laboratoriya", author: "Aysel Həsənli", publishDate: "—", status: "Yoxlamada", featured: false },
    ],
    groups: [
      {
        title: "Məqalə kontenti",
        description: "Başlıq, cover və təhlükəsiz strukturlaşdırılmış məzmun.",
        fields: [
          { name: "title", label: "Məqalə başlığı", type: "text", required: true, maxLength: 100, placeholder: "Aydın və informativ başlıq yazın" },
          { name: "lead", label: "Qısa giriş", type: "textarea", required: true, maxLength: 280, placeholder: "Oxucunun məqalədə nə öyrənəcəyini qısa izah edin..." },
          { name: "content", label: "Məqalə mətni", type: "richtext", required: true, placeholder: "Məzmunu bölmələr və semantik başlıqlarla yazın..." },
          { name: "cover", label: "Cover şəkli", type: "file", accept: "image/png,image/jpeg,image/webp", help: "Tövsiyə olunan ölçü 1600×900 px · alt mətn əlavə etməyi unutmayın." },
          { name: "coverAlt", label: "Şəkil alt mətni", type: "text", required: true, placeholder: "Şəkildə nə təsvir olunduğunu yazın" },
        ],
      },
      {
        title: "Təsnifat və müəllif",
        description: "Məqalənin kataloq və əlaqəli kontent parametrləri.",
        fields: [
          { name: "category", label: "Kateqoriya", type: "select", required: true, options: ["Kardiologiya", "Nevrologiya", "Pediatriya", "Dermatologiya", "Profilaktika", "Laboratoriya"], width: "half" },
          { name: "author", label: "Müəllif", type: "select", required: true, options: ["Dr. Elçin Rzayev", "Dr. Nigar Əliyeva", "Dr. Kamran İsmayılov", "Dr. Leyla Məmmədova", "Aysel Həsənli"], width: "half" },
          { name: "tags", label: "Teqlər", type: "tags", placeholder: "Teq yazıb Enter basın", width: "half" },
          { name: "related", label: "Əlaqəli məqalələr", type: "multiselect", options: ["Ürək sağlamlığını qorumaq üçün 7 addım", "Yuxu keyfiyyəti və beyin", "Profilaktik check-up"], width: "half" },
          { name: "featured", label: "Seçilmiş məqalə", type: "toggle", help: "Ana səhifə və xəbərlər səhifəsində önə çıxarılsın." },
        ],
      },
      {
        title: "Nəşr və SEO",
        description: "Dərc planı və axtarış nəticəsi görünüşü.",
        fields: [
          { name: "status", label: "Nəşr statusu", type: "select", required: true, options: ["Qaralama", "Yoxlamada", "Dərc olunub", "Planlaşdırılıb"], width: "half" },
          { name: "publishDate", label: "Dərc tarixi", type: "datetime-local", width: "half" },
          { name: "slug", label: "URL slug", type: "slug", required: true, placeholder: "meqale-basligi" },
          { name: "seoTitle", label: "SEO başlıq", type: "text", maxLength: 60 },
          { name: "seoDescription", label: "Meta təsvir", type: "textarea", maxLength: 160 },
        ],
      },
    ],
  },
  users: {
    title: "İstifadəçilər",
    description: "Admin hesablarını, rolları və hesab statuslarını idarə edin.",
    singular: "İstifadəçi",
    createLabel: "Yeni istifadəçi",
    createHref: "/admin/users/new",
    editBase: "/admin/users",
    searchPlaceholder: "Ad, e-mail və ya rol...",
    columns: [
      { key: "name", label: "İstifadəçi", type: "person" },
      { key: "role", label: "Rol" },
      { key: "lastSeen", label: "Son aktivlik" },
      { key: "status", label: "Status", type: "status" },
    ],
    rows: [
      { id: "nigar-mammadova", name: "Nigar Məmmədova", detail: "nigar.m@medicarehospital.az", initials: "NM", role: "Super Admin", lastSeen: "İndi aktivdir", twoFactor: "Aktiv", status: "Aktiv" },
      { id: "aysel-hasanli", name: "Aysel Həsənli", detail: "aysel.h@medicarehospital.az", initials: "AH", role: "Content Manager", lastSeen: "18 dəq əvvəl", twoFactor: "Aktiv", status: "Aktiv" },
      { id: "elvin-qasimov", name: "Elvin Qasımov", detail: "elvin.q@medicarehospital.az", initials: "EQ", role: "Doctor Manager", lastSeen: "2 saat əvvəl", twoFactor: "Aktiv", status: "Aktiv" },
      { id: "murad-aliyev", name: "Murad Əliyev", detail: "murad.a@medicarehospital.az", initials: "MA", role: "Support Operator", lastSeen: "5 dəq əvvəl", twoFactor: "Deaktiv", status: "Aktiv" },
      { id: "jale-rahimova", name: "Jalə Rəhimova", detail: "jale.r@medicarehospital.az", initials: "JR", role: "Content Manager", lastSeen: "12.07.2026", twoFactor: "Deaktiv", status: "Dəvət göndərilib" },
      { id: "test-user", name: "Arxiv hesabı", detail: "archive@medicarehospital.az", initials: "AA", role: "Support Operator", lastSeen: "03.05.2026", twoFactor: "Deaktiv", status: "Bloklanıb" },
    ],
    groups: [
      {
        title: "Hesab məlumatları",
        description: "İstifadəçinin identifikasiya və giriş məlumatları.",
        fields: [
          { name: "firstName", label: "Ad", type: "text", required: true, width: "half" },
          { name: "lastName", label: "Soyad", type: "text", required: true, width: "half" },
          { name: "email", label: "E-mail", type: "email", required: true, placeholder: "ad.soyad@medicarehospital.az" },
          { name: "password", label: "İlkin şifrə", type: "password", requiredOnCreate: true, placeholder: "Ən azı 12 simvol", help: "Böyük və kiçik hərf, rəqəm və xüsusi simvol daxil edilməlidir." },
          { name: "phone", label: "Telefon", type: "tel", width: "half", placeholder: "+994 50 000 00 00" },
          { name: "jobTitle", label: "Vəzifə", type: "text", width: "half", placeholder: "Kontent mütəxəssisi" },
        ],
      },
      {
        title: "Giriş və səlahiyyət",
        description: "Rol, təhlükəsizlik və hesab statusu.",
        fields: [
          { name: "role", label: "Rol", type: "select", required: true, options: ["Super Admin", "Content Manager", "Doctor Manager", "Support Operator"], width: "half" },
          { name: "language", label: "İnterfeys dili", type: "select", options: ["Azərbaycan dili", "English", "Русский"], width: "half" },
          { name: "active", label: "Hesabı aktiv et", type: "toggle", defaultChecked: true },
        ],
      },
    ],
  },
};

export const messageRows = [
  { id: "MSG-2205", sender: "Səbinə Quliyeva", email: "sabina.q@example.com", phone: "+994 50 382 44 18", subject: "Laborator nəticələrin əldə edilməsi", preview: "Salam, dünən verdiyim analizlərin nəticəsini onlayn əldə edə bilərəmmi?", body: "Salam. Dünən Sabunçu filialında qan analizləri vermişəm. Nəticələrin hazır olub-olmadığını və onları onlayn şəkildə necə əldə edə biləcəyimi öyrənmək istəyirəm. Əvvəlcədən təşəkkür edirəm.", time: "10:42", date: "23 iyul 2026", unread: true, priority: "Normal", category: "Laboratoriya" },
  { id: "MSG-2204", sender: "Orxan Abbasov", email: "orxan.a@example.com", phone: "+994 55 217 09 61", subject: "Korporativ check-up təklifi", preview: "Şirkətimizin 40 əməkdaşı üçün korporativ check-up paketi ilə maraqlanırıq.", body: "Salam. Şirkətimizin 40 əməkdaşı üçün illik korporativ check-up proqramı təşkil etməyi planlaşdırırıq. Paketlər, qiymətlər və mümkün tarixlər barədə kommersiya təklifi göndərməyinizi xahiş edirik.", time: "09:18", date: "23 iyul 2026", unread: true, priority: "Prioritet", category: "Korporativ" },
  { id: "MSG-2203", sender: "Məlahət İbrahimova", email: "malahat.i@example.com", phone: "+994 70 880 21 05", subject: "Həkimin iş qrafiki", preview: "Dr. Nigar Əliyevanın şənbə günü qəbul edib-etmədiyini bilmək istəyirəm.", body: "Salam. Dr. Nigar Əliyevanın şənbə günü qəbul saatlarının olub-olmadığını və ən yaxın boş vaxtı öyrənmək istəyirəm.", time: "Dünən", date: "22 iyul 2026", unread: true, priority: "Normal", category: "Qəbul" },
  { id: "MSG-2202", sender: "Ramin Əsgərov", email: "ramin.a@example.com", phone: "+994 51 640 73 12", subject: "Təşəkkür məktubu", preview: "Kardiologiya şöbəsinin bütün komandasına diqqət və qayğıya görə təşəkkür edirəm.", body: "Kardiologiya şöbəsinin bütün komandasına, xüsusilə Dr. Elçin Rzayevə göstərilən peşəkar yanaşma, diqqət və qayğıya görə təşəkkürümü bildirirəm.", time: "Dünən", date: "22 iyul 2026", unread: false, priority: "Normal", category: "Rəy" },
  { id: "MSG-2201", sender: "Fidan Məmmədli", email: "fidan.m@example.com", phone: "+994 50 922 36 57", subject: "Sığorta tərəfdaşlığı", preview: "Xidmətlərinizin hansı sığorta şirkətləri tərəfindən qarşılandığını dəqiqləşdirmək istəyirəm.", body: "Salam. Kardioloji müayinə üçün müraciət etmək istəyirəm. Xidmətlərinizin hansı sığorta şirkətləri tərəfindən qarşılandığını dəqiqləşdirə bilərsinizmi?", time: "21 iyul", date: "21 iyul 2026", unread: false, priority: "Normal", category: "Maliyyə" },
];

export const contentSections = [
  { id: "home", title: "Ana səhifə", description: "Əsas hero təqdimatı və CTA keçidləri", icon: "home", items: 1, updated: "18 dəq əvvəl", status: "Aktiv" },
  { id: "director", title: "Baş direktor", description: "Ad, vəzifə, foto, müraciət, imza və ana səhifə görünməsi", icon: "users", items: 1, updated: "İndi", status: "Aktiv" },
  { id: "about", title: "Haqqımızda", description: "Tarix, missiya, vizyon, dəyərlər və infrastruktur", icon: "content", items: 9, updated: "Dünən", status: "Aktiv" },
  { id: "faq", title: "Tez-tez verilən suallar", description: "Kateqoriyalar üzrə sual-cavab bazası", icon: "messages", items: 18, updated: "19 iyul", status: "Aktiv" },
  { id: "testimonials", title: "Pasiyent rəyləri", description: "Təsdiqlənmiş rəylər və görünmə sırası", icon: "users", items: 8, updated: "18 iyul", status: "Aktiv" },
  { id: "branches", title: "Filiallar", description: "Ünvanlar, iş saatları və xəritə koordinatları", icon: "departments", items: 3, updated: "16 iyul", status: "Aktiv" },
  { id: "gallery", title: "Qalereya", description: "Hospital məkanları və tədbir şəkilləri", icon: "image", items: 42, updated: "12 iyul", status: "Aktiv" },
  { id: "certificates", title: "Sertifikatlar", description: "Akkreditasiya və keyfiyyət sənədləri", icon: "services", items: 6, updated: "10 iyul", status: "Aktiv" },
  { id: "navigation", title: "Naviqasiya", description: "Header, mobil menyu və footer linkləri", icon: "menu", items: 21, updated: "8 iyul", status: "Aktiv" },
  { id: "social", title: "Sosial media", description: "Public saytda görünən rəsmi sosial hesablar", icon: "external", items: 4, updated: "8 iyul", status: "Aktiv" },
  { id: "contact", title: "Əlaqə məlumatları", description: "Telefon, e-mail, ünvan və iş saatları", icon: "phone", items: 1, updated: "7 iyul", status: "Aktiv" },
];

export const contentEditorMeta = {
  home: { title: "Ana səhifə kontenti", description: "Hero başlığını, açıqlamasını, CTA keçidlərini və görünməsini idarə edin." },
  director: { title: "Baş direktor", description: "Direktor profilini və ana səhifədəki təqdimat kartını idarə edin." },
  about: { title: "Haqqımızda kontenti", description: "Korporativ hekayə, missiya, vizyon və dəyərləri yeniləyin." },
  faq: { title: "FAQ idarəetməsi", description: "Sual-cavab bloklarını kateqoriyalar üzrə təşkil edin." },
  testimonials: { title: "Pasiyent rəyləri", description: "Rəyləri yoxlayın, sıralayın və yayımlayın." },
  branches: { title: "Filiallar", description: "Filial ünvanları, xəritə və iş saatlarını yeniləyin." },
  gallery: { title: "Qalereya", description: "Media fayllarını kolleksiyalar üzrə təşkil edin." },
  certificates: { title: "Sertifikatlar", description: "Akkreditasiya və keyfiyyət sənədlərini idarə edin." },
  navigation: { title: "Naviqasiya", description: "Header və footer linklərinin sırasını yeniləyin." },
  social: { title: "Sosial media", description: "Rəsmi sosial hesabların etiket, platforma və URL-lərini idarə edin." },
  contact: { title: "Əlaqə məlumatları", description: "Əsas telefon, e-mail, ünvan və iş saatlarını idarə edin." },
};

export const roles = [
  { id: "super-admin", name: "Super Admin", users: 1, description: "Bütün modullara və sistem parametrlərinə tam giriş.", tone: "red" },
  { id: "content-manager", name: "Content Manager", users: 2, description: "Məqalə, səhifə kontenti və media idarəetməsi.", tone: "blue" },
  { id: "doctor-manager", name: "Doctor Manager", users: 1, description: "Həkim, şöbə, xidmət və iş qrafiklərinin idarəsi.", tone: "navy" },
  { id: "support-operator", name: "Support Operator", users: 2, description: "Əlaqə mesajlarının işlənməsi.", tone: "amber" },
];

export const permissionGroups = [
  { key: "dashboard", label: "İdarə paneli", permissions: ["Baxış"] },
  { key: "doctors", label: "Həkimlər", permissions: ["Baxış", "Dəyişiklik", "Silmə"] },
  { key: "departments", label: "Şöbələr və xidmətlər", permissions: ["Baxış", "Dəyişiklik", "Silmə"] },
  { key: "articles", label: "Məqalələr", permissions: ["Baxış", "Dəyişiklik", "Nəşr", "Silmə"] },
  { key: "messages", label: "Mesajlar", permissions: ["Baxış", "Dəyişiklik", "Silmə"] },
  { key: "content", label: "Sayt kontenti", permissions: ["Baxış", "Dəyişiklik", "Silmə"] },
  { key: "settings", label: "Sistem parametrləri", permissions: ["Baxış", "Dəyişiklik"] },
  { key: "users", label: "İstifadəçi və rollar", permissions: ["Baxış", "Dəyişiklik", "Silmə"] },
];

export const departments = [
  {
    slug: "kardiologiya",
    name: "Kardiologiya",
    shortName: "Ürək sağlamlığı",
    summary:
      "Ürək-damar xəstəliklərinin erkən diaqnostikası, müalicəsi və uzunmüddətli nəzarəti.",
    description:
      "Kardiologiya komandamız ürək sağlamlığını yalnız simptomlarla deyil, həyat tərzi və risk faktorları ilə birlikdə qiymətləndirir. Mütəxəssislərimiz fərdi diaqnostika planı qurur, nəticələri konsiliumda təhlil edir və pasiyentlə birgə aydın müalicə yol xəritəsi hazırlayır.",
    icon: "pulse",
    image: "/images/department-placeholder.svg",
    conditions: ["Arterial hipertenziya", "Ürək ritm pozğunluğu", "Koronar arteriya xəstəliyi", "Ürək çatışmazlığı"],
    serviceSlugs: ["kardioloji-check-up", "exokardioqrafiya", "laborator-diaqnostika"],
    technologies: ["Rəqəmsal EKQ", "24–72 saatlıq Holter", "Stress exokardioqrafiya"],
    faq: [
      { question: "Profilaktik ürək müayinəsinə nə vaxt başlamaq lazımdır?", answer: "Ailə tarixçəsi və risk faktorları yoxdursa, 30 yaşdan etibarən illik təzyiq və əsas laborator göstəricilərin qiymətləndirilməsi tövsiyə olunur." },
      { question: "Sinə ağrısı hər zaman ürəklə bağlıdır?", answer: "Xeyr, lakin qəfil və sıxıcı sinə ağrısı, təngnəfəslik və soyuq tərləmə təcili qiymətləndirilməlidir." }
    ]
  },
  {
    slug: "nevrologiya",
    name: "Nevrologiya",
    shortName: "Sinir sistemi",
    summary: "Beyin, onurğa və periferik sinir sistemi xəstəliklərinə dəqiq, kompleks yanaşma.",
    description: "Nevroloqlarımız baş ağrısından mürəkkəb neyrodegenerativ vəziyyətlərə qədər geniş spektrdə müayinə aparır. Görüntüləmə və funksional diaqnostika vahid klinik kontekstdə təhlil edilir.",
    icon: "brain",
    image: "/images/department-placeholder.svg",
    conditions: ["Miqren", "Epilepsiya", "Baş gicəllənməsi", "Nevropatiyalar"],
    serviceSlugs: ["mrt-diaqnostika", "laborator-diaqnostika", "fizioterapiya-reabilitasiya"],
    technologies: ["3 Tesla MRT", "EEQ monitorinq", "Elektroneyromioqrafiya"],
    faq: [
      { question: "Tez-tez baş ağrısı üçün həkimə müraciət etməliyəm?", answer: "Ağrı yeni başlayıbsa, güclənirsə və ya görmə, nitq, keyimə kimi əlamətlərlə müşayiət olunursa nevroloq müayinəsi vacibdir." }
    ]
  },
  {
    slug: "pediatriya",
    name: "Pediatriya",
    shortName: "Uşaq sağlamlığı",
    summary: "Doğuşdan yeniyetməlik dövrünədək uşaqlar üçün təhlükəsiz və ailə yönümlü tibbi qayğı.",
    description: "Pediatriya şöbəmiz uşağın fiziki və emosional rahatlığını birlikdə qoruyan mühit təqdim edir. Böyümə, inkişaf, immunizasiya və kəskin xəstəliklər vahid tarixçə ilə izlənir.",
    icon: "family",
    image: "/images/department-placeholder.svg",
    conditions: ["Kəskin respirator infeksiyalar", "Allergik vəziyyətlər", "İnkişaf ləngiməsi", "Həzm problemləri"],
    serviceSlugs: ["usaq-check-up", "laborator-diaqnostika", "vaksinasiya"],
    technologies: ["Uşaq USM", "Sürətli test paneli", "İnkişaf skrininqi"],
    faq: [
      { question: "Sağlam uşaq müayinəsi nə qədər tez-tez olmalıdır?", answer: "İlk yaşda daha sıx, sonrakı dövrdə isə pediatrın fərdi inkişaf planına uyğun ən azı ildə bir dəfə tövsiyə edilir." }
    ]
  },
  {
    slug: "cerrahiyye",
    name: "Cərrahiyyə",
    shortName: "Minimal invaziv müalicə",
    summary: "Təhlükəsiz anesteziya və sürətli bərpa protokolları ilə müasir cərrahi xidmət.",
    description: "Cərrahiyyə komandası əməliyyatdan öncə riskləri multidissiplinar dəyərləndirir və mümkün olduqda minimal invaziv üsullara üstünlük verir.",
    icon: "cross",
    image: "/images/facility-placeholder.svg",
    conditions: ["Öd daşı xəstəliyi", "Yırtıqlar", "Tiroid düyünləri", "Yumşaq toxuma patologiyaları"],
    serviceSlugs: ["laparoskopik-cerrahiyye", "anestezioloji-konsultasiya"],
    technologies: ["4K laparoskopiya", "Elektrocərrahi platforma", "İnteqrə olunmuş əməliyyat zalı"],
    faq: [
      { question: "Minimal invaziv əməliyyatın üstünlüyü nədir?", answer: "Kiçik kəsik, daha az ağrı və çox vaxt daha sürətli gündəlik həyata dönüş imkanı yaradır." }
    ]
  },
  {
    slug: "ginekologiya",
    name: "Ginekologiya",
    shortName: "Qadın sağlamlığı",
    summary: "Həyatın hər mərhələsində qadınlara məxfi, həssas və sübut əsaslı tibbi dəstək.",
    description: "Profilaktik baxış, reproduktiv sağlamlıq və ginekoloji xəstəliklərin müalicəsi komfortlu, məxfiliyə əsaslanan şəraitdə aparılır.",
    icon: "flower",
    image: "/images/department-placeholder.svg",
    conditions: ["Menstrual pozğunluqlar", "Endometrioz", "Uşaqlıq boynu xəstəlikləri", "Menopauza simptomları"],
    serviceSlugs: ["qadin-check-up", "ultrases-muayinesi", "laborator-diaqnostika"],
    technologies: ["Rəqəmsal kolposkopiya", "4D USM", "Minimal invaziv histeroskopiya"],
    faq: [
      { question: "Profilaktik ginekoloji baxış nə qədər tez-tez aparılmalıdır?", answer: "Şəxsi risklər nəzərə alınmaqla əksər qadınlar üçün ildə bir dəfə planlı müayinə uyğundur." }
    ]
  },
  {
    slug: "dermatologiya",
    name: "Dermatologiya",
    shortName: "Dəri sağlamlığı",
    summary: "Dəri, saç və dırnaq problemlərinin dermatoskopik qiymətləndirilməsi və fərdi müalicəsi.",
    description: "Dermatoloji müayinə vizual baxış, rəqəmsal dermatoskopiya və ehtiyac olduqda laborator diaqnostika ilə tamamlanır.",
    icon: "skin",
    image: "/images/department-placeholder.svg",
    conditions: ["Akne", "Dermatit", "Psoriaz", "Dəri törəmələri"],
    serviceSlugs: ["dermatoskopiya", "laborator-diaqnostika"],
    technologies: ["Rəqəmsal dermatoskopiya", "Fototerapiya", "Dəri xəritələndirmə"],
    faq: [
      { question: "Xalın dəyişməsi nə zaman riskli sayılır?", answer: "Forma, sərhəd, rəng və ölçüdə dəyişiklik və ya qanama olduqda gecikmədən dermatoloqa müraciət edin." }
    ]
  },
  {
    slug: "stomatologiya",
    name: "Stomatologiya",
    shortName: "Ağız və diş sağlamlığı",
    summary: "Rəqəmsal planlama ilə profilaktika, estetik və funksional stomatoloji müalicə.",
    description: "Diş və diş əti sağlamlığını uzunmüddətli qorumaq üçün profilaktik, bərpaedici və estetik xidmətləri vahid planda birləşdiririk.",
    icon: "tooth",
    image: "/images/department-placeholder.svg",
    conditions: ["Karies", "Diş əti xəstəlikləri", "Diş sırası pozğunluğu", "Diş itkisi"],
    serviceSlugs: ["reqemsal-stomatologiya", "laborator-diaqnostika"],
    technologies: ["3D dental tomoqrafiya", "İntraoral skaner", "CAD/CAM planlama"],
    faq: [
      { question: "Profilaktik diş müayinəsi nə qədər tez-tez lazımdır?", answer: "Fərdi riskə görə dəyişsə də, adətən hər altı aydan bir müayinə və professional təmizlik tövsiyə olunur." }
    ]
  },
  {
    slug: "oftalmologiya",
    name: "Oftalmologiya",
    shortName: "Görmə sağlamlığı",
    summary: "Görmə keyfiyyətinin rəqəmsal ölçülməsi, erkən risk aşkarlanması və müalicə.",
    description: "Gözün ön və arxa seqmenti yüksək dəqiqlikli cihazlarla qiymətləndirilir, nəticələr yaş və həyat tərzinə uyğun planlaşdırılır.",
    icon: "eye",
    image: "/images/department-placeholder.svg",
    conditions: ["Refraksiya qüsurları", "Qlaukoma", "Katarakta", "Tor qişa xəstəlikləri"],
    serviceSlugs: ["goz-diaqnostikasi", "laborator-diaqnostika"],
    technologies: ["OCT angioqrafiya", "Avtorefraktometriya", "Rəqəmsal fundus kamera"],
    faq: [
      { question: "Görmədə qəfil zəifləmə olarsa nə etməliyəm?", answer: "Bu təcili oftalmoloji qiymətləndirmə tələb edə bilər. Eyni gün klinika ilə əlaqə saxlayın." }
    ]
  },
  {
    slug: "radiologiya",
    name: "Radiologiya",
    shortName: "Görüntüləmə",
    summary: "Aşağı doza protokolları və ixtisaslaşmış radioloq rəyi ilə dəqiq görüntüləmə.",
    description: "Radiologiya şöbəsi klinik sualı düzgün cavablandırmaq üçün uyğun müayinə protokolunu seçir və nəticəni yönləndirən həkimlə paylaşır.",
    icon: "scan",
    image: "/images/diagnostic-suite.png",
    conditions: ["Nevroloji patologiyalar", "Dayaq-hərəkət zədələri", "Orqan xəstəlikləri", "Profilaktik skrininq"],
    serviceSlugs: ["mrt-diaqnostika", "komputer-tomoqrafiya", "ultrases-muayinesi"],
    technologies: ["3 Tesla MRT", "128 kəsikli KT", "Elastoqrafiyalı USM"],
    faq: [
      { question: "MRT üçün hazırlıq lazımdır?", answer: "Müayinə növündən asılıdır. Metal implant, hamiləlik və digər vacib məlumatları əvvəlcədən bildirmək lazımdır." }
    ]
  },
  {
    slug: "laboratoriya",
    name: "Laboratoriya",
    shortName: "Klinik analizlər",
    summary: "Avtomatlaşdırılmış proses, ikili keyfiyyət nəzarəti və sürətli nəticələr.",
    description: "Laboratoriyamız preanalitik mərhələdən nəticənin həkim tərəfindən təsdiqinədək beynəlxalq keyfiyyət nəzarəti prinsipləri ilə işləyir.",
    icon: "flask",
    image: "/images/facility-placeholder.svg",
    conditions: ["Profilaktik skrininq", "Hormonal qiymətləndirmə", "İnfeksiya diaqnostikası", "Müalicə monitorinqi"],
    serviceSlugs: ["laborator-diaqnostika", "genetik-testler", "evde-analiz"],
    technologies: ["Avtomat biokimya xətti", "PCR laboratoriyası", "Barkod izləmə sistemi"],
    faq: [
      { question: "Analiz üçün ac gəlmək lazımdır?", answer: "Bəzi analizlər üçün 8–12 saat aclıq tələb olunur. Sifariş zamanı sizə fərdi hazırlıq qaydası təqdim edilir." }
    ]
  }
];

export function getDepartment(slug) {
  return departments.find((department) => department.slug === slug);
}

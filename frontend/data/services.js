export const services = [
  {
    slug: "kardioloji-check-up",
    name: "Kardioloji check-up",
    department: "kardiologiya",
    summary: "Ürək-damar risklərini erkən aşkar edən kompleks müayinə proqramı.",
    description: "Kardioloji check-up şəxsi risk profilinizə uyğun müayinə, laborator analiz və kardioloq konsultasiyasını bir paketdə birləşdirir.",
    icon: "pulse",
    duration: "2–3 saat",
    preparation: "Analizlər üçün 8 saat ac qalmaq tövsiyə olunur.",
    includes: ["Kardioloq konsultasiyası", "EKQ və exokardioqrafiya", "Əsas laborator risk paneli", "Fərdi profilaktika planı"],
    image: "/images/department-placeholder.svg"
  },
  {
    slug: "mrt-diaqnostika",
    name: "3 Tesla MRT",
    department: "radiologiya",
    summary: "Yüksək ayırdetmə ilə şüalanmasız və dəqiq maqnit-rezonans görüntüləmə.",
    description: "3 Tesla MRT sistemi daha qısa müddətdə detallı görüntülər əldə etməyə və mürəkkəb klinik sualları dəqiqləşdirməyə imkan verir.",
    icon: "scan",
    duration: "20–50 dəqiqə",
    preparation: "Müayinə sahəsinə görə fərdi təlimat təqdim olunur.",
    includes: ["İlkin təhlükəsizlik sorğusu", "Fərdi görüntüləmə protokolu", "Radioloq rəyi", "Rəqəmsal nəticə"],
    image: "/images/diagnostic-suite.png"
  },
  {
    slug: "laborator-diaqnostika",
    name: "Laborator diaqnostika",
    department: "laboratoriya",
    summary: "Geniş analiz spektri, rəqəmsal nəticə və iki mərhələli keyfiyyət nəzarəti.",
    description: "Klinik laboratoriyamız rutin analizlərdən geniş hormonal və immunoloji panellərə qədər dəqiq nəticələr təqdim edir.",
    icon: "flask",
    duration: "Nəticəyə görə 60 dəqiqədən",
    preparation: "Analizin növünə görə dəyişir.",
    includes: ["Barkodla nümunə izləmə", "Avtomat analiz", "Mütəxəssis təsdiqi", "Onlayn nəticə"],
    image: "/images/facility-placeholder.svg"
  },
  {
    slug: "ultrases-muayinesi",
    name: "Ultrasəs müayinəsi",
    department: "radiologiya",
    summary: "Real vaxt rejimində təhlükəsiz və rahat görüntüləmə.",
    description: "Müasir ultrasəs sistemləri daxili orqan, damar və yumşaq toxumaların dinamik qiymətləndirilməsini təmin edir.",
    icon: "waves",
    duration: "15–30 dəqiqə",
    preparation: "Müayinə sahəsindən asılı olaraq məlumat verilir.",
    includes: ["Hədəfli müayinə", "Doppler qiymətləndirmə", "Həkim rəyi", "Rəqəmsal hesabat"],
    image: "/images/department-placeholder.svg"
  },
  {
    slug: "laparoskopik-cerrahiyye",
    name: "Laparoskopik cərrahiyyə",
    department: "cerrahiyye",
    summary: "Kiçik kəsiklər və sürətləndirilmiş bərpa protokolu ilə cərrahi müalicə.",
    description: "Əməliyyat planı cərrah, anestezioloq və müvafiq ixtisas həkimlərinin birgə qərarı əsasında hazırlanır.",
    icon: "cross",
    duration: "Fərdi əməliyyat planı",
    preparation: "Əməliyyatönü müayinə və anestezioloq konsultasiyası.",
    includes: ["Cərrah konsultasiyası", "Əməliyyatönü risk qiymətləndirilməsi", "Minimal invaziv müdaxilə", "Bərpa izlənməsi"],
    image: "/images/facility-placeholder.svg"
  },
  {
    slug: "usaq-check-up",
    name: "Uşaq check-up",
    department: "pediatriya",
    summary: "Uşağın böyümə və inkişafını yaşına uyğun qiymətləndirən proqram.",
    description: "Pediatrın rəhbərliyi ilə həyata keçirilən proqram fiziki inkişaf, görmə, eşitmə və əsas laborator göstəriciləri əhatə edir.",
    icon: "family",
    duration: "2 saat",
    preparation: "Əvvəlki tibbi sənədləri gətirmək faydalıdır.",
    includes: ["Pediatr müayinəsi", "İnkişaf skrininqi", "Əsas analizlər", "Valideyn üçün tövsiyə planı"],
    image: "/images/department-placeholder.svg"
  },
  {
    slug: "qadin-check-up",
    name: "Qadın sağlamlığı proqramı",
    department: "ginekologiya",
    summary: "Yaş və risk profilinə uyğun preventiv qadın sağlamlığı müayinəsi.",
    description: "Məxfi və komfortlu şəraitdə ginekoloji baxış, görüntüləmə və laborator skrininq bir plan daxilində aparılır.",
    icon: "flower",
    duration: "2–3 saat",
    preparation: "Qəbul zamanı fərdi hazırlıq məlumatı təqdim edilir.",
    includes: ["Ginekoloq konsultasiyası", "Ultrasəs müayinəsi", "Skrininq analizləri", "Fərdi izləmə planı"],
    image: "/images/department-placeholder.svg"
  },
  {
    slug: "fizioterapiya-reabilitasiya",
    name: "Fizioterapiya və reabilitasiya",
    department: "nevrologiya",
    summary: "Hərəkət funksiyasını və həyat keyfiyyətini bərpa edən fərdi proqram.",
    description: "Reabilitasiya həkimi və fizioterapevt funksional vəziyyəti ölçür, real hədəflər müəyyən edir və mərhələli bərpa planı qurur.",
    icon: "motion",
    duration: "45–60 dəqiqə / seans",
    preparation: "Rahat geyim və əvvəlki müayinə nəticələri.",
    includes: ["Funksional qiymətləndirmə", "Fərdi hərəkət proqramı", "Ağrı nəzarəti", "Proqres ölçümü"],
    image: "/images/department-placeholder.svg"
  },
  {
    slug: "reqemsal-stomatologiya",
    name: "Rəqəmsal stomatologiya",
    department: "stomatologiya",
    summary: "İntraoral skan və 3D planlama ilə dəqiq, rahat diş müalicəsi.",
    description: "Rəqəmsal ölçü və vizual planlama müalicənin nəticəsini əvvəlcədən görməyə, prosesi daha rahat və proqnozlaşdırılan etməyə kömək edir.",
    icon: "tooth",
    duration: "Müalicəyə görə dəyişir",
    preparation: "Xüsusi hazırlıq tələb olunmur.",
    includes: ["Stomatoloq baxışı", "İntraoral skan", "3D müalicə planı", "Nəticə izlənməsi"],
    image: "/images/department-placeholder.svg"
  },
  {
    slug: "goz-diaqnostikasi",
    name: "Kompleks göz diaqnostikası",
    department: "oftalmologiya",
    summary: "Görmə və göz strukturlarının yüksək dəqiqlikli tam qiymətləndirilməsi.",
    description: "Görmə itiliyi, göz təzyiqi, ön və arxa seqment bir qəbul daxilində müasir cihazlarla qiymətləndirilir.",
    icon: "eye",
    duration: "60–90 dəqiqə",
    preparation: "Bəbək genişləndirilməsi səbəbilə avtomobil idarə etməmək tövsiyə edilə bilər.",
    includes: ["Görmə ölçümü", "Göz təzyiqi", "OCT müayinəsi", "Oftalmoloq rəyi"],
    image: "/images/department-placeholder.svg"
  }
];

export function getService(slug) {
  return services.find((service) => service.slug === slug);
}

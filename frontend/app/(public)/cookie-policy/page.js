import CmsLegalDocument from "@/components/common/CmsLegalDocument";
import { getPageContent } from "@/services/content";
import { createCmsMetadata } from "@/utils/seo";

export async function generateMetadata() {
  const result = await getPageContent("cookie-policy", {
    slug: "cookie-policy",
    title: "Kuki siyasəti",
    excerpt: "Medicare Hospital saytında istifadə olunan zəruri və seçimə bağlı kukilər haqqında məlumat."
  });
  return createCmsMetadata(result.item, {
    title: "Kuki siyasəti",
    description: "Medicare Hospital saytında istifadə olunan zəruri və seçimə bağlı kukilər haqqında məlumat.",
    path: "/cookie-policy"
  });
}

const sections = [
  {
    title: "Kuki nədir?",
    paragraphs: ["Kuki saytın işləməsi və seçiminizin yadda saxlanması üçün brauzerinizdə saxlanan kiçik məlumat faylıdır. Kuki cihazınızdakı digər fayllara çıxış vermir."]
  },
  {
    title: "Zəruri kukilər",
    paragraphs: ["Bu kukilər təhlükəsizlik, forma funksiyaları və kuki seçiminizin yadda saxlanması kimi əsas imkanlar üçün tələb olunur. Onları söndürmək saytın bəzi hissələrinin işləməsinə təsir edə bilər."],
    items: ["Təhlükəsiz sessiya idarəetməsi", "Kuki razılığı seçimi", "Formanın texniki vəziyyəti"]
  },
  {
    title: "Analitika kukiləri",
    paragraphs: ["Analitika kukiləri ziyarətçilərin saytdan necə istifadə etdiyini ümumi və mümkün qədər anonim göstəricilərlə anlamağa kömək edir. Onlar yalnız razılığınız olduqda aktivləşdirilir."]
  },
  {
    title: "Seçimlərin idarə olunması",
    paragraphs: ["İlk ziyarətdə yalnız zəruri kukiləri və ya bütün icazə verilən kukiləri seçə bilərsiniz. Brauzer parametrlərindən saxlanmış kukiləri silmək də mümkündür."]
  },
  {
    title: "Siyasətdə dəyişiklik",
    paragraphs: ["İstifadə etdiyimiz texnologiyalar dəyişdikdə bu siyasət yenilənir. Əhəmiyyətli dəyişikliklər saytda aydın şəkildə göstəriləcək."]
  }
];

export default function CookiePolicyPage() {
  return <CmsLegalDocument slug="cookie-policy" eyebrow="Hüquqi məlumat" title="Kuki siyasəti" description="Saytın işləməsi və rahat istifadəsi üçün kukilərdən necə istifadə etdiyimizi şəffaf izah edirik." sections={sections} />;
}

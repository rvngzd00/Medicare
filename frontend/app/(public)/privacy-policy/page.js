import CmsLegalDocument from "@/components/common/CmsLegalDocument";
import { getPageContent } from "@/services/content";
import { createCmsMetadata } from "@/utils/seo";

export async function generateMetadata() {
  const result = await getPageContent("privacy-policy", {
    slug: "privacy-policy",
    title: "Məxfilik siyasəti",
    excerpt: "Medicare Hospital şəxsi məlumatların toplanması, istifadəsi, qorunması və pasiyent hüquqları haqqında məxfilik siyasəti."
  });
  return createCmsMetadata(result.item, {
    title: "Məxfilik siyasəti",
    description: "Medicare Hospital şəxsi məlumatların toplanması, istifadəsi, qorunması və pasiyent hüquqları haqqında məxfilik siyasəti.",
    path: "/privacy-policy"
  });
}

const sections = [
  {
    title: "Topladığımız məlumatlar",
    paragraphs: ["Qəbul və əlaqə sorğusu zamanı təqdim etdiyiniz məlumatları yalnız xidmətin təşkili və sizinlə əlaqə məqsədilə toplayırıq."],
    items: ["Ad, soyad və əlaqə məlumatları", "Seçdiyiniz şöbə, həkim və qəbul vaxtı", "Sorğuda könüllü paylaşdığınız qısa tibbi məlumat", "Saytın təhlükəsizliyi üçün texniki sessiya məlumatları"]
  },
  {
    title: "Məlumatlardan istifadə",
    paragraphs: ["Şəxsi məlumatlar qəbulun planlanması, sorğuların cavablandırılması, xidmət keyfiyyətinin yaxşılaşdırılması və qanuni öhdəliklərin icrası üçün işlənir.", "Marketinq məlumatı yalnız ayrıca razılıq verdiyiniz halda göndərilir."]
  },
  {
    title: "Qorunma və saxlanma",
    paragraphs: ["Məlumatlara giriş vəzifə və ehtiyac prinsipi ilə məhdudlaşdırılır. Texniki və təşkilati təhlükəsizlik tədbirləri mütəmadi nəzərdən keçirilir.", "Məlumatlar məqsəd üçün tələb olunan və qanunla müəyyən edilən müddətdən artıq saxlanmır."]
  },
  {
    title: "Məlumatların paylaşılması",
    paragraphs: ["Məlumatlarınız satılmır. Xidmətin göstərilməsi üçün zəruri olduqda məxfilik öhdəliyi daşıyan texniki tərəfdaşlarla və qanuni tələb olduqda səlahiyyətli qurumlarla paylaşılması mümkündür."]
  },
  {
    title: "Hüquqlarınız",
    paragraphs: ["Qanunvericiliyin imkan verdiyi çərçivədə məlumatlarınıza çıxış, düzəliş, silinmə və işlənmənin məhdudlaşdırılmasını tələb edə bilərsiniz."],
    items: ["Məlumatların surətini almaq", "Yanlış məlumatı düzəltdirmək", "Razılığı geri götürmək", "Müraciətinizə dair izahat almaq"]
  }
];

export default function PrivacyPage() {
  return <CmsLegalDocument slug="privacy-policy" eyebrow="Hüquqi məlumat" title="Məxfilik siyasəti" description="Şəxsi və tibbi məlumatlarınıza ehtiyatla yanaşır, onları şəffaf prinsiplərlə işləyirik." sections={sections} />;
}

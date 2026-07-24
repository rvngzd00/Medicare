import CmsLegalDocument from "@/components/common/CmsLegalDocument";
import { getPageContent } from "@/services/content";
import { createCmsMetadata } from "@/utils/seo";

export async function generateMetadata() {
  const result = await getPageContent("terms", {
    slug: "terms",
    title: "İstifadə şərtləri",
    excerpt: "Medicare Hospital saytından istifadə, tibbi məlumatların xarakteri və onlayn əlaqə üzrə şərtlər."
  });
  return createCmsMetadata(result.item, {
    title: "İstifadə şərtləri",
    description: "Medicare Hospital saytından istifadə, tibbi məlumatların xarakteri və onlayn əlaqə üzrə şərtlər.",
    path: "/terms"
  });
}

const sections = [
  {
    title: "Saytın məqsədi",
    paragraphs: ["Bu sayt Medicare Hospital, onun həkimləri, şöbələri və xidmətləri haqqında məlumat vermək və hospital ilə əlaqəni asanlaşdırmaq məqsədi daşıyır."]
  },
  {
    title: "Tibbi məlumatlar",
    paragraphs: ["Saytdakı məqalələr və xidmət təsvirləri ümumi məlumat xarakterlidir. Onlar fərdi diaqnoz, müalicə təyinatı və ya təcili tibbi yardımın əvəzi deyil.", "Kəskin və həyati təhlükəli vəziyyətdə saytdakı formadan istifadə etməyin; dərhal 103 təcili tibbi yardım xidmətinə zəng edin."]
  },
  {
    title: "Əlaqə forması",
    paragraphs: ["Onlayn formanın göndərilməsi tibbi məsləhət və ya xidmət təsdiqi sayılmır.", "Təcili olmayan suallar üçün əlaqə formundan və ya hospitalın telefon nömrəsindən istifadə edə bilərsiniz."]
  },
  {
    title: "Məzmun və müəllif hüquqları",
    paragraphs: ["Saytın dizaynı, mətnləri, vizualları və digər materialları qanunla qorunur. Yazılı icazə olmadan kommersiya məqsədli kopyalama və yayım qadağandır."]
  },
  {
    title: "Məsuliyyət və dəyişikliklər",
    paragraphs: ["Məlumatların düzgün və aktual saxlanmasına çalışırıq, lakin həkim qrafiki və xidmət imkanları dəyişə bilər. Son məlumatı əlaqə mərkəzi təsdiqləyir.", "Şərtlər qanunvericilik və xidmət dəyişikliklərinə uyğun yenilənə bilər."]
  }
];

export default function TermsPage() {
  return <CmsLegalDocument slug="terms" eyebrow="Hüquqi məlumat" title="İstifadə şərtləri" description="Saytdan istifadə etməzdən və onlayn sorğu göndərməzdən əvvəl əsas şərtlərlə tanış olun." sections={sections} />;
}

import PageHero from "@/components/common/PageHero";
import DoctorsDirectory from "@/components/doctors/DoctorsDirectory";
import AppointmentCta from "@/components/common/AppointmentCta";
import { ContentStatusNotice } from "@/components/common/ContentStatus";
import { CmsPageSection } from "@/components/common/CmsPageSections";
import { getDoctorsContent, getPageContent } from "@/services/content";
import { createCmsMetadata } from "@/utils/seo";
import { resolvePageSections } from "@/utils/cmsSections";

const PAGE_FALLBACK = {
  slug: "doctors",
  title: "Həkimlər",
  excerpt: "Medicare həkim komandası.",
  body: { version: 2, blocks: [] },
  sections: [
    { key: "hero", type: "HERO", label: "Səhifə təqdimatı", eyebrow: "Həkim komandası", title: "Sağlamlığınızı etibar edə biləcəyiniz mütəxəssislər", description: "İxtisaslaşmış təcrübə, diqqətli dinləmə və aydın müalicə planı — uyğun həkimi ehtiyacınıza görə seçin.", active: true },
    { key: "collection", type: "COLLECTION", label: "Həkim siyahısı", active: true },
    { key: "appointment", type: "CTA", label: "Qəbul çağırışı", title: "Uyğun həkimlə qəbulunuzu planlayın", description: "Komandamız ehtiyacınıza uyğun mütəxəssisi seçməyə kömək etsin.", active: true },
  ],
};

export async function generateMetadata() {
  const result = await getPageContent("doctors", PAGE_FALLBACK);
  return createCmsMetadata(result.item, {
    title: "Həkimlər",
    description: "Medicare Hospital həkimlərini şöbə, ixtisas və təcrübəyə görə axtarın, profil və iş qrafikləri ilə tanış olun.",
    path: "/doctors"
  });
}

export default async function DoctorsPage({ searchParams }) {
  const [params, content, pageContent] = await Promise.all([
    searchParams,
    getDoctorsContent(),
    getPageContent("doctors", PAGE_FALLBACK),
  ]);
  const initialDepartment = params?.department || "";
  const sections = resolvePageSections(pageContent.item, PAGE_FALLBACK.sections);
  return (
    <div className="cmsPageFlow">
      {sections.map((section) => {
        if (section.key === "hero") return <PageHero key={section.id || section.key} eyebrow={section.eyebrow} title={section.title} description={section.description} breadcrumbs={[{ label: "Həkimlər" }]} />;
        if (section.key === "collection") return (
          <section className="section directorySection" key={section.id || section.key}>
            <div className="container">
              <ContentStatusNotice result={content} />
              <DoctorsDirectory doctors={content.items} initialDepartment={initialDepartment} />
            </div>
          </section>
        );
        if (section.key === "appointment") return <AppointmentCta key={section.id || section.key} eyebrow={section.eyebrow} title={section.title} text={section.description} primaryLabel={section.content.primaryLabel} primaryHref={section.content.primaryHref} secondaryLabel={section.content.secondaryLabel} secondaryHref={section.content.secondaryHref} />;
        return <CmsPageSection key={section.id || section.key} section={section} />;
      })}
    </div>
  );
}

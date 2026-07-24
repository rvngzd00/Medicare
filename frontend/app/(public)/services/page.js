import PageHero from "@/components/common/PageHero";
import ServiceCard from "@/components/services/ServiceCard";
import AppointmentCta from "@/components/common/AppointmentCta";
import { ContentStatusNotice } from "@/components/common/ContentStatus";
import EmptyState from "@/components/common/EmptyState";
import Reveal from "@/components/animations/Reveal";
import { CmsPageSection } from "@/components/common/CmsPageSections";
import { getPageContent, getServicesContent } from "@/services/content";
import { createCmsMetadata } from "@/utils/seo";
import { resolvePageSections } from "@/utils/cmsSections";

const PAGE_FALLBACK = {
  slug: "services",
  title: "Tibbi xidmətlər",
  body: { version: 2, blocks: [] },
  sections: [
    { key: "hero", type: "HERO", label: "Səhifə təqdimatı", eyebrow: "Tibbi xidmətlər", title: "Profilaktikadan müalicəyədək aydın xidmət yolu", description: "Hər xidmət klinik ehtiyaca uyğun planlanır, hazırlıq və nəticə mərhələləri əvvəlcədən izah edilir.", active: true },
    { key: "collection", type: "COLLECTION", label: "Xidmət siyahısı", active: true },
    { key: "appointment", type: "CTA", label: "Qəbul çağırışı", title: "Sizə uyğun xidməti birlikdə seçək", description: "Hazırlıq və qəbul mərhələləri haqqında komandamızdan məlumat alın.", active: true },
  ],
};

export async function generateMetadata() {
  const result = await getPageContent("services", PAGE_FALLBACK);
  return createCmsMetadata(result.item, {
    title: "Tibbi xidmətlər",
    description: "Medicare Hospital-da check-up, laboratoriya, görüntüləmə, cərrahiyyə və digər tibbi xidmətlər barədə ətraflı məlumat.",
    path: "/services"
  });
}

export default async function ServicesPage() {
  const [content, pageContent] = await Promise.all([
    getServicesContent(),
    getPageContent("services", PAGE_FALLBACK),
  ]);
  const sections = resolvePageSections(pageContent.item, PAGE_FALLBACK.sections);
  return (
    <div className="cmsPageFlow">
      {sections.map((section) => {
        if (section.key === "hero") return <PageHero key={section.id || section.key} eyebrow={section.eyebrow} title={section.title} description={section.description} breadcrumbs={[{ label: "Xidmətlər" }]} />;
        if (section.key === "collection") return (
          <section className="section" key={section.id || section.key}>
            <div className="container">
              <ContentStatusNotice result={content} />
              {content.items.length > 0 ? (
                <div className="cardGrid cardGrid--three">
                  {content.items.map((service, index) => <Reveal key={service.slug} delay={(index % 3) * 60}><ServiceCard service={service} index={index} /></Reveal>)}
                </div>
              ) : <EmptyState title="Aktiv xidmət tapılmadı" text="Xidmət məlumatları yeniləndikdən sonra bu bölmədə görünəcək." />}
            </div>
          </section>
        );
        if (section.key === "appointment") return <AppointmentCta key={section.id || section.key} eyebrow={section.eyebrow} title={section.title} text={section.description} primaryLabel={section.content.primaryLabel} primaryHref={section.content.primaryHref} secondaryLabel={section.content.secondaryLabel} secondaryHref={section.content.secondaryHref} />;
        return <CmsPageSection key={section.id || section.key} section={section} />;
      })}
    </div>
  );
}

import PageHero from "@/components/common/PageHero";
import ServiceCard from "@/components/services/ServiceCard";
import ServicePriceCatalog from "@/components/services/ServicePriceCatalog";
import ContactCta from "@/components/common/ContactCta";
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
    { key: "contact-cta", type: "CTA", label: "Telefon əlaqə çağırışı", title: "Sizə uyğun xidməti birlikdə seçək", description: "Hazırlıq qaydaları və xidmət detalları haqqında komandamızdan telefonla məlumat alın.", active: true },
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
  const pricedServices = content.items.filter((service) => service.priceItems?.length);
  const overviewServices = content.items.filter((service) => !service.priceItems?.length);
  return (
    <div className="cmsPageFlow">
      {sections.map((section) => {
        if (section.key === "hero") return <PageHero key={section.id || section.key} eyebrow={section.eyebrow} title={section.title} description={section.description} breadcrumbs={[{ label: "Xidmətlər" }]} />;
        if (section.key === "collection") return (
          <section className="section" key={section.id || section.key}>
            <div className="container">
              <ContentStatusNotice result={content} />
              {content.items.length > 0 ? (
                <>
                  {pricedServices.length > 0 && <ServicePriceCatalog services={pricedServices} />}
                  {overviewServices.length > 0 && (
                    <div className="serviceOverview">
                      <div className="sectionHeading">
                        <span className="eyebrow">Ətraflı xidmətlər</span>
                        <h2>Müayinə və qayğı proqramları</h2>
                      </div>
                      <div className="cardGrid cardGrid--three">
                        {overviewServices.map((service, index) => <Reveal key={service.slug} delay={(index % 3) * 60}><ServiceCard service={service} index={index} /></Reveal>)}
                      </div>
                    </div>
                  )}
                </>
              ) : <EmptyState title="Aktiv xidmət tapılmadı" text="Xidmət məlumatları yeniləndikdən sonra bu bölmədə görünəcək." />}
            </div>
          </section>
        );
        if (section.key === "contact-cta") return <ContactCta key={section.id || section.key} eyebrow={section.eyebrow} title={section.title} text={section.description} />;
        return <CmsPageSection key={section.id || section.key} section={section} />;
      })}
    </div>
  );
}

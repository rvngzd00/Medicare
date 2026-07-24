import PageHero from "@/components/common/PageHero";
import Accordion from "@/components/common/Accordion";
import ContactCta from "@/components/common/ContactCta";
import Icon from "@/components/common/Icon";
import JsonLd from "@/components/seo/JsonLd";
import { ContentStatusNotice } from "@/components/common/ContentStatus";
import EmptyState from "@/components/common/EmptyState";
import { CmsPageSection } from "@/components/common/CmsPageSections";
import {
  getFaqsContent,
  getPageContent,
  getPublicConfigurationContent
} from "@/services/content";
import { createCmsMetadata } from "@/utils/seo";
import { resolvePageSections } from "@/utils/cmsSections";

const PAGE_FALLBACK = {
  slug: "faq",
  title: "Tez-tez verilən suallar",
  body: { version: 2, blocks: [] },
  sections: [
    { key: "hero", type: "HERO", label: "Səhifə təqdimatı", eyebrow: "Kömək mərkəzi", title: "Sualınızı cavabsız qoymuruq", description: "Qəbul və müayinə prosesinə dair ən çox verilən sualları kateqoriyalar üzrə topladıq.", active: true },
    { key: "questions", type: "FAQ", label: "Sual-cavab siyahısı", active: true },
    { key: "contact-cta", type: "CTA", label: "Telefon əlaqə çağırışı", title: "Cavab tapmadınız?", description: "Əlaqə komandamız sizə kömək etməyə hazırdır.", active: true },
  ],
};

export async function generateMetadata() {
  const result = await getPageContent("faq", PAGE_FALLBACK);
  return createCmsMetadata(result.item, {
    title: "Tez-tez verilən suallar",
    description: "Medicare Hospital-da qəbul, müayinə hazırlığı, analiz nəticələri, sığorta və təcili yardım haqqında suallar.",
    path: "/faq"
  });
}

export default async function FaqPage() {
  const [content, configurationContent, pageContent] = await Promise.all([
    getFaqsContent(),
    getPublicConfigurationContent(),
    getPageContent("faq", PAGE_FALLBACK),
  ]);
  const contact = configurationContent.configuration.contact;
  const faqs = content.items;
  const categories = [...new Set(faqs.map((item) => item.category))];
  const sections = resolvePageSections(pageContent.item, PAGE_FALLBACK.sections);
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  return (
    <>
      <div className="cmsPageFlow">
        {sections.map((section) => {
          if (section.key === "hero") return <PageHero key={section.id || section.key} eyebrow={section.eyebrow} title={section.title} description={section.description} breadcrumbs={[{ label: "FAQ" }]} />;
          if (section.key === "questions") return (
            <section className="section faqPage" key={section.id || section.key}>
              <div className="container">
                <ContentStatusNotice result={content} />
                <div className="faqPage__grid">
                  <aside>
                    <span className="eyebrow">{section.eyebrow || "Mövzular"}</span>
                    <nav aria-label="FAQ kateqoriyaları">
                      {categories.map((category) => <a href={`#${category.toLocaleLowerCase("az").replace(/\s/g, "-")}`} key={category}>{category}<Icon name="arrow" size={16} /></a>)}
                    </nav>
                    <div className="faqHelp"><Icon name="chat" size={24} /><h2>{section.title || "Cavab tapmadınız?"}</h2><p>{section.description || "Əlaqə komandamız sizə kömək etməyə hazırdır."}</p><a href={contact.phoneHref}>{contact.phone}</a></div>
                  </aside>
                  <div className="faqGroups">
                    {categories.length ? categories.map((category) => (
                      <section id={category.toLocaleLowerCase("az").replace(/\s/g, "-")} key={category}>
                        <h2>{category}</h2>
                        <Accordion items={faqs.filter((item) => item.category === category)} />
                      </section>
                    )) : <EmptyState title="FAQ qeydi yoxdur" text="Suallar yenilənir. Bu müddətdə əlaqə mərkəzimiz sizə kömək edə bilər." />}
                  </div>
                </div>
              </div>
            </section>
          );
          if (section.key === "contact-cta") return <ContactCta key={section.id || section.key} contact={contact} eyebrow={section.eyebrow} title={section.title} text={section.description} />;
          return <CmsPageSection key={section.id || section.key} section={section} />;
        })}
      </div>
      <JsonLd data={schema} />
    </>
  );
}

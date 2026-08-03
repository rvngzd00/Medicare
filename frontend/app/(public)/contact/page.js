import PageHero from "@/components/common/PageHero";
import ContactForm from "@/components/forms/ContactForm";
import MapBlock from "@/components/common/MapBlock";
import SmartImage from "@/components/common/SmartImage";
import Icon from "@/components/common/Icon";
import JsonLd from "@/components/seo/JsonLd";
import { ContentStatusNotice } from "@/components/common/ContentStatus";
import EmptyState from "@/components/common/EmptyState";
import { CmsPageSection } from "@/components/common/CmsPageSections";
import {
  getBranchesContent,
  getPageContent,
  getPublicConfigurationContent
} from "@/services/content";
import { createCmsMetadata, absoluteUrl } from "@/utils/seo";
import { resolvePageSections } from "@/utils/cmsSections";

const PAGE_FALLBACK = {
  slug: "contact",
  title: "Bizimlə əlaqə",
  body: { version: 2, blocks: [] },
  sections: [
    { key: "hero", type: "HERO", label: "Səhifə təqdimatı", eyebrow: "Əlaqə", title: "Sualınız varsa, doğru ünvandasınız", description: "Qəbul, xidmət və hospitalımız haqqında məlumat üçün komandamızla sizə rahat olan kanaldan əlaqə saxlayın.", active: true },
    { key: "details", type: "CONTACT", label: "Əlaqə məlumatları", title: "Medicare Hospital — Sabunçu", active: true },
    { key: "form", type: "CUSTOM", label: "Əlaqə forması", eyebrow: "Bizə yazın", title: "Müraciətinizi dinləyirik", active: true },
    { key: "map", type: "CONTACT", label: "Xəritə", eyebrow: "Ünvanımız", title: "Medicare Hospital-a necə gəlmək olar?", description: "Hospital Sabunçu qəsəbəsində, 3 saylı Şəhər Klinik Xəstəxanasının qarşısında yerləşir.", active: true },
    { key: "social", type: "CUSTOM", label: "Sosial media", eyebrow: "Sosial mediada", title: "Sağlamlıq yeniliklərini izləyin", active: true },
  ],
};

export async function generateMetadata() {
  const result = await getPageContent("contact", PAGE_FALLBACK);
  return createCmsMetadata(result.item, {
    title: "Əlaqə",
    description: "Medicare Hospital-un Sabunçu ünvanı, rəsmi telefonları, WhatsApp, iş saatları və onlayn əlaqə forması.",
    path: "/contact",
    image: "/images/medicare-hospital-sabunchu.jpg"
  });
}

export default async function ContactPage() {
  const [configurationContent, branchContent, pageContent] = await Promise.all([
    getPublicConfigurationContent(),
    getBranchesContent(),
    getPageContent("contact", PAGE_FALLBACK),
  ]);
  const { contact: CONTACT, socialLinks: SOCIAL_LINKS } =
    configurationContent.configuration;
  const branches = branchContent.items;
  const contentStatus = {
    unavailable:
      configurationContent.unavailable || branchContent.unavailable,
    source:
      configurationContent.unavailable || branchContent.unavailable
        ? "fallback"
        : configurationContent.source === "live" &&
            branchContent.source === "live"
          ? "live"
          : "mock"
  };
  const primaryBranch = branches[0];
  const sections = resolvePageSections(pageContent.item, PAGE_FALLBACK.sections);
  const schema = branches.map((branch) => ({
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: branch.name,
    url: absoluteUrl("/contact"),
    telephone: branch.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: branch.address,
      addressLocality: "Bakı",
      addressCountry: "AZ"
    },
    openingHours: branch.hours,
    parentOrganization: { "@id": absoluteUrl("/#hospital") }
  }));

  return (
    <>
      <div className="cmsPageFlow">
        {sections.map((section) => {
          if (section.key === "hero") return <PageHero key={section.id || section.key} eyebrow={section.eyebrow} title={section.title} description={section.description} breadcrumbs={[{ label: "Əlaqə" }]} />;
          if (section.key === "details") return (
            <section className="section contactCardsSection" key={section.id || section.key}>
              <div className="container">
                <ContentStatusNotice result={contentStatus} />
                <div className="contactCards">
                  <a href={CONTACT.phoneHref}><span><Icon name="phone" size={24} /></span><p><small>Əlaqə mərkəzi</small><strong>{CONTACT.phone}</strong><em>{CONTACT.phoneSecondary || CONTACT.hours}</em></p><Icon name="arrowUpRight" size={18} /></a>
                  <a href={CONTACT.emailHref}><span><Icon name="mail" size={24} /></span><p><small>E-mail</small><strong>{CONTACT.email}</strong><em>1 iş günü ərzində cavab</em></p><Icon name="arrowUpRight" size={18} /></a>
                  <div className="contactCards__address"><span><Icon name="location" size={24} /></span><p><small>{section.eyebrow || "Faktiki ünvan"}</small><strong>{primaryBranch?.address || CONTACT.address}</strong><em>{primaryBranch?.hours || CONTACT.hours}</em></p></div>
                  <a className="contactCards__emergency" href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer"><span><Icon name="chat" size={24} /></span><p><small>WhatsApp / mobil</small><strong>{CONTACT.whatsapp}</strong><em>Mesaj və zəng üçün</em></p><Icon name="arrowUpRight" size={18} /></a>
                </div>
              </div>
            </section>
          );
          if (section.key === "form") return (
            <section className="section section--soft" key={section.id || section.key}>
              <div className="container contactMedia">
                <div className="contactMedia__image">
                  <SmartImage src={section.content.image || "/images/medicare-hospital-sabunchu.jpg"} alt={section.content.imageAlt || "Medicare Hospital-un Sabunçu qəsəbəsindəki binası"} sizes="(max-width: 900px) 100vw, 48vw" priority />
                  <div className="contactMedia__label"><Icon name="location" size={21} /><span><strong>{primaryBranch?.name || "Medicare Hospital — Sabunçu"}</strong>{primaryBranch?.address || CONTACT.address}</span></div>
                </div>
                <div className="formCard">
                  <div className="formCard__header"><div><span className="eyebrow">{section.eyebrow}</span><h2>{section.title}</h2><p>{section.description}</p></div><Icon name="chat" size={28} /></div>
                  <ContactForm />
                </div>
              </div>
            </section>
          );
          if (section.key === "map") return (
            <section className="section" key={section.id || section.key}>
              <div className="container">
                <div className="sectionHeading"><span className="eyebrow">{section.eyebrow}</span><h2>{section.title}</h2><p>{section.description}</p></div>
                {branches.length > 0 ? <MapBlock branchItems={branches} /> : <EmptyState title="Ünvan məlumatı tapılmadı" text="Ünvan məlumatı yenilənir. Əlaqə mərkəzimiz sizə hospitalın yerini dəqiqləşdirə bilər." />}
              </div>
            </section>
          );
          if (section.key === "social") return SOCIAL_LINKS.length > 0 ? (
            <section className="section section--dark socialSection" key={section.id || section.key}>
              <div className="container socialSection__inner">
                <div><span className="eyebrow eyebrow--light">{section.eyebrow}</span><h2>{section.title}</h2></div>
                <div>{SOCIAL_LINKS.map((social) => <a href={social.href} target="_blank" rel="noopener noreferrer" key={social.id || social.label}>{social.label}<Icon name="arrowUpRight" size={18} /></a>)}</div>
              </div>
            </section>
          ) : null;
          return <CmsPageSection key={section.id || section.key} section={section} />;
        })}
      </div>
      {schema.map((item) => <JsonLd data={item} key={item.name} />)}
    </>
  );
}

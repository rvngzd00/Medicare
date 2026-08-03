import { notFound } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/common/PageHero";
import SectionHeading from "@/components/common/SectionHeading";
import SmartImage from "@/components/common/SmartImage";
import ServiceCard from "@/components/services/ServiceCard";
import DoctorCard from "@/components/doctors/DoctorCard";
import ContactCta from "@/components/common/ContactCta";
import Accordion from "@/components/common/Accordion";
import Icon from "@/components/common/Icon";
import JsonLd from "@/components/seo/JsonLd";
import Reveal from "@/components/animations/Reveal";
import {
  ContentStatusNotice,
  ContentUnavailable
} from "@/components/common/ContentStatus";
import {
  getDepartmentContent,
  getDepartmentsContent,
  getPublicConfigurationContent
} from "@/services/content";
import { createMetadata, absoluteUrl } from "@/utils/seo";

export const dynamicParams = true;

export async function generateStaticParams() {
  const result = await getDepartmentsContent();
  return result.items.map((department) => ({ slug: department.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { item: department } = await getDepartmentContent(slug);
  if (!department) return {};
  const seo = department.seo || {};
  return createMetadata({
    title: seo.title || department.name,
    description: seo.description || department.summary,
    path: `/departments/${department.slug}`,
    image: seo.ogImage?.url || department.image,
    canonical: seo.canonicalUrl,
    keywords: seo.keywords,
    robots: seo.robots,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    twitterCard: seo.twitterCard
  });
}

export default async function DepartmentDetailPage({ params }) {
  const { slug } = await params;
  const [content, configurationContent] = await Promise.all([
    getDepartmentContent(slug),
    getPublicConfigurationContent()
  ]);
  const contact = configurationContent.configuration.contact;
  const department = content.item;
  if (!department && content.unavailable) {
    return <ContentUnavailable title="Şöbə məlumatını yükləyə bilmədik" />;
  }
  if (!department) notFound();
  const relatedServices = department.services?.length
    ? department.services
    : [];
  const departmentDoctors = department.doctors?.length
    ? department.doctors
    : [];

  const clinicSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: `Medicare ${department.name} şöbəsi`,
    url: absoluteUrl(`/departments/${department.slug}`),
    image: absoluteUrl(department.image),
    description: department.summary,
    parentOrganization: { "@id": absoluteUrl("/#hospital") },
    telephone: contact.phone,
    inLanguage: "az-AZ"
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: department.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  return (
    <>
      <PageHero
        eyebrow={department.shortName}
        title={`${department.name} şöbəsi`}
        description={department.summary}
        breadcrumbs={[
          { label: "Şöbələr", href: "/departments" },
          { label: department.name }
        ]}
      >
        <div className="pageHero__actions">
          <a className="button button--primary" href={contact.phoneHref}>Bizimlə əlaqə saxla <Icon name="phone" size={18} /></a>
        </div>
      </PageHero>
      <section className="section departmentIntro">
        <div className="container departmentIntro__grid">
          <Reveal className="departmentIntro__visual">
            <SmartImage src={department.image} alt={`Medicare ${department.name} şöbəsi`} sizes="(max-width: 900px) 100vw, 50vw" priority fallbackLabel={department.name} />
            <div className="departmentIntro__badge"><Icon name="shield" size={23} /><span><strong>Multidissiplinar</strong>kliniki yanaşma</span></div>
          </Reveal>
          <Reveal className="departmentIntro__copy" variant="left">
            <ContentStatusNotice result={content} />
            <SectionHeading eyebrow="Şöbə haqqında" title="Diaqnozdan izləməyədək vahid komanda" />
            <p>{department.description}</p>
            <div className="miniFeatures">
              <p><Icon name="check" size={17} /><span><strong>Fərdi diaqnostika</strong>Risk və simptomlara uyğun plan</span></p>
              <p><Icon name="check" size={17} /><span><strong>Komanda qərarı</strong>Ehtiyac olduqda ortaq konsilium</span></p>
              <p><Icon name="check" size={17} /><span><strong>Davamlı izləmə</strong>Müalicə nəticələrinin ölçülməsi</span></p>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="section section--soft">
        <div className="container">
          <div>
            <SectionHeading eyebrow="Müalicə istiqamətləri" title="Kompleks qiymətləndirdiyimiz hallar" text="Siyahıda olmayan şikayətlər üçün də şöbə koordinatoru sizi uyğun mütəxəssisə yönləndirəcək." />
            <ul className="largeCheckList">{department.conditions.map((item) => <li key={item}><Icon name="check" size={18} />{item}</li>)}</ul>
          </div>
        </div>
      </section>
      {relatedServices.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHeading eyebrow="Şöbə xidmətləri" title="Müayinə və müalicə imkanları" />
            <div className="cardGrid cardGrid--three">
              {relatedServices.map((service, index) => <ServiceCard service={service} index={index} key={service.slug} />)}
            </div>
          </div>
        </section>
      )}
      {departmentDoctors.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <SectionHeading eyebrow="Həkim komandası" title={`${department.name} mütəxəssisləri`} />
            <div className="cardGrid cardGrid--three">{departmentDoctors.map((doctor) => <DoctorCard doctor={doctor} phoneHref={contact.phoneHref} key={doctor.slug} />)}</div>
          </div>
        </section>
      )}
      {department.faq.length > 0 && (
        <section className="section">
          <div className="container splitIntro">
            <SectionHeading eyebrow="Suallar və cavablar" title={`${department.name} haqqında ən çox soruşulanlar`} text="Əlavə sualınız varsa, şöbə koordinatoru ilə əlaqə saxlaya bilərsiniz." />
            <Accordion items={department.faq} />
          </div>
        </section>
      )}
      <ContactCta contact={contact} title={`${department.name} haqqında məlumat alın`} />
      <JsonLd data={clinicSchema} />
      {department.faq.length > 0 && <JsonLd data={faqSchema} />}
    </>
  );
}

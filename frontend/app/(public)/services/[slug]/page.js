import { notFound } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/common/PageHero";
import SmartImage from "@/components/common/SmartImage";
import ServiceCard from "@/components/services/ServiceCard";
import ContactCta from "@/components/common/ContactCta";
import Icon from "@/components/common/Icon";
import JsonLd from "@/components/seo/JsonLd";
import {
  ContentStatusNotice,
  ContentUnavailable
} from "@/components/common/ContentStatus";
import {
  getPublicConfigurationContent,
  getServiceContent,
  getServicesContent
} from "@/services/content";
import { createMetadata, absoluteUrl } from "@/utils/seo";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { item: service } = await getServiceContent(slug);
  if (!service) return {};
  const seo = service.seo || {};
  return createMetadata({
    title: seo.title || service.name,
    description: seo.description || service.summary,
    path: `/services/${service.slug}`,
    image: seo.ogImage?.url || service.image,
    canonical: seo.canonicalUrl,
    keywords: seo.keywords,
    robots: seo.robots,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    twitterCard: seo.twitterCard
  });
}

export default async function ServiceDetailPage({ params }) {
  const { slug } = await params;
  const [content, directory, configurationContent] = await Promise.all([
    getServiceContent(slug),
    getServicesContent(),
    getPublicConfigurationContent()
  ]);
  const contact = configurationContent.configuration.contact;
  const service = content.item;
  if (!service && content.unavailable) {
    return <ContentUnavailable title="Xidmət məlumatını yükləyə bilmədik" />;
  }
  if (!service) notFound();
  const department = {
    name: service.departmentName || "Medicare",
    slug: service.department
  };
  const related = directory.items
    .filter(
      (item) =>
        item.slug !== service.slug &&
        item.department === service.department
    )
    .slice(0, 3);
  const fallbackRelated = related.length
    ? related
    : directory.items.filter((item) => item.slug !== service.slug).slice(0, 3);
  const degradedResult = content.unavailable ? content : directory;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: service.name,
    url: absoluteUrl(`/services/${service.slug}`),
    description: service.summary,
    image: absoluteUrl(service.image),
    procedureType: "NoninvasiveProcedure",
    bodyLocation: department?.name,
    provider: { "@id": absoluteUrl("/#hospital") },
    inLanguage: "az-AZ"
  };

  return (
    <>
      <PageHero
        eyebrow={department?.name}
        title={service.name}
        description={service.summary}
        breadcrumbs={[
          { label: "Xidmətlər", href: "/services" },
          { label: service.name }
        ]}
      >
        <div className="pageHero__actions">
          <a className="button button--primary" href={contact.phoneHref}>Bizimlə əlaqə saxla <Icon name="phone" size={18} /></a>
        </div>
      </PageHero>
      <section className="section serviceDetail">
        <div className="container serviceDetail__grid">
          <div className="serviceDetail__content">
            <ContentStatusNotice result={degradedResult} />
            <span className="eyebrow">Xidmət haqqında</span>
            <h2>Planlı, təhlükəsiz və aydın proses</h2>
            <p className="lead">{service.description}</p>
            <div className="serviceFacts">
              <article><Icon name="clock" size={22} /><p><small>Təxmini müddət</small><strong>{service.duration}</strong></p></article>
              <article><Icon name="location" size={22} /><p><small>Şöbə</small><strong>{department?.name}</strong></p></article>
            </div>
            {service.pricingVisible !== false && service.priceItems?.length > 0 && (
              <section className="servicePricing">
                <div className="servicePricing__heading">
                  <div><span className="eyebrow">Qiymət siyahısı</span><h2>{service.name}</h2></div>
                  <span>{service.priceItems.length} xidmət</span>
                </div>
                <div className="servicePricing__list">
                  {service.priceItems.map((item) => (
                    <article key={item.id}>
                      <span className="servicePricing__code">{item.code || "—"}</span>
                      <p><strong>{item.name}</strong>{item.note && <small>{item.note}</small>}</p>
                      <strong className="servicePricing__price">{formatServicePrice(item.price, item.currency)}</strong>
                    </article>
                  ))}
                </div>
                <small className="servicePricing__notice">Yekun məbləği xidmət planına uyğun olaraq əlaqə mərkəzindən dəqiqləşdirə bilərsiniz.</small>
              </section>
            )}
            <section className="includedSection">
              <h2>Proqrama daxildir</h2>
              <ul>{service.includes.map((item) => <li key={item}><Icon name="check" size={18} /><span>{item}</span></li>)}</ul>
            </section>
            <section className="preparationBox">
              <span><Icon name="document" size={24} /></span>
              <div><h2>Hazırlıq qaydası</h2><p>{service.preparation}</p><small>Dəqiq təlimat üçün əlaqə mərkəzimizə zəng edə bilərsiniz.</small></div>
            </section>
          </div>
          <aside className="serviceDetail__aside">
            <div className="serviceDetail__image">
              <SmartImage src={service.image} alt={`${service.name} xidməti`} sizes="(max-width: 900px) 100vw, 38vw" priority fallbackLabel={service.name} />
            </div>
            <div className="contactCard">
              <span className="contactCard__icon"><Icon name={service.icon} size={26} /></span>
              <h2>Müayinə planınızı dəqiqləşdirin</h2>
              <p>Koordinatorumuz uyğun həkim və hazırlıq qaydası barədə məlumat verəcək.</p>
              <a className="button button--primary button--wide" href={contact.phoneHref}><Icon name="phone" size={17} /> Bizimlə əlaqə saxla</a>
              <a href={contact.phoneHref}><Icon name="phone" size={17} />{contact.phone}</a>
            </div>
          </aside>
        </div>
      </section>
      {fallbackRelated.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <SectionTitle />
            <div className="cardGrid cardGrid--three">{fallbackRelated.map((item, index) => <ServiceCard service={item} index={index} key={item.slug} />)}</div>
          </div>
        </section>
      )}
      <ContactCta contact={contact} />
      <JsonLd data={serviceSchema} />
    </>
  );
}

function SectionTitle() {
  return <div className="sectionHeading"><span className="eyebrow">Əlaqəli xidmətlər</span><h2>Sizin üçün faydalı ola bilər</h2></div>;
}

function formatServicePrice(value, currency = "AZN") {
  if (value === null || value === undefined || value === "" || Number(value) <= 0) return "Sorğu ilə";
  const amount = new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: Number(value) % 1 ? 2 : 0,
    maximumFractionDigits: 2
  }).format(Number(value));
  return currency === "AZN" ? amount + " ₼" : amount + " " + currency;
}

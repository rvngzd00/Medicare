import { notFound } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/common/PageHero";
import SmartImage from "@/components/common/SmartImage";
import DoctorCard from "@/components/doctors/DoctorCard";
import ContactCta from "@/components/common/ContactCta";
import Icon from "@/components/common/Icon";
import JsonLd from "@/components/seo/JsonLd";
import Reveal from "@/components/animations/Reveal";
import {
  ContentStatusNotice,
  ContentUnavailable
} from "@/components/common/ContentStatus";
import {
  getDoctorContent,
  getDoctorsContent,
  getPublicConfigurationContent
} from "@/services/content";
import { createMetadata, absoluteUrl } from "@/utils/seo";

export const dynamicParams = true;

export async function generateStaticParams() {
  const result = await getDoctorsContent();
  return result.items.map((doctor) => ({ slug: doctor.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { item: doctor } = await getDoctorContent(slug);
  if (!doctor) return {};
  const seo = doctor.seo || {};
  return createMetadata({
    title: seo.title || doctor.name,
    description: seo.description || `${doctor.name} — ${doctor.specialty}, ${doctor.experience} il təcrübə. Profil, iş qrafiki və birbaşa əlaqə məlumatları.`,
    path: `/doctors/${doctor.slug}`,
    image: seo.ogImage?.url || doctor.image,
    canonical: seo.canonicalUrl,
    keywords: seo.keywords,
    robots: seo.robots,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    twitterCard: seo.twitterCard
  });
}

export default async function DoctorDetailPage({ params }) {
  const { slug } = await params;
  const [content, directory, configurationContent] = await Promise.all([
    getDoctorContent(slug),
    getDoctorsContent(),
    getPublicConfigurationContent()
  ]);
  const contact = configurationContent.configuration.contact;
  const doctor = content.item;
  if (!doctor && content.unavailable) {
    return <ContentUnavailable title="Həkim profilini yükləyə bilmədik" />;
  }
  if (!doctor) notFound();
  const relatedDoctors = doctor.relatedDoctors?.length
    ? doctor.relatedDoctors
    : directory.items
        .filter(
          (item) =>
            item.slug !== doctor.slug &&
            item.department === doctor.department
        )
        .slice(0, 3);
  const fallbackRelated = relatedDoctors.length
    ? relatedDoctors
    : directory.items.filter((item) => item.slug !== doctor.slug).slice(0, 3);
  const degradedResult = content.unavailable ? content : directory;

  const physicianSchema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: doctor.name,
    image: absoluteUrl(doctor.image),
    url: absoluteUrl(`/doctors/${doctor.slug}`),
    description: doctor.bio,
    medicalSpecialty: doctor.specialty,
    worksFor: {
      "@type": "Hospital",
      name: "Medicare Hospital",
      url: absoluteUrl("/")
    },
    knowsLanguage: doctor.languages,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bakı",
      addressCountry: "AZ"
    }
  };

  return (
    <>
      <PageHero
        compact
        eyebrow={doctor.departmentName || "Medicare mütəxəssisi"}
        title={doctor.name}
        description={doctor.specialty}
        breadcrumbs={[
          { label: "Həkimlər", href: "/doctors" },
          { label: doctor.name }
        ]}
      />
      <section className="section doctorProfile">
        <div className="container doctorProfile__grid">
          <aside>
            <Reveal className="doctorProfile__portrait">
              <SmartImage src={doctor.image} alt={`${doctor.name}, ${doctor.specialty}`} sizes="(max-width: 800px) 100vw, 36vw" priority fallbackLabel={doctor.name} />
              <span><i />Əlaqə mərkəzi açıqdır</span>
            </Reveal>
            <div className="doctorProfile__actions">
              <a className="button button--primary button--wide" href={contact.phoneHref}>
                <Icon name="phone" size={19} /> Bizimlə əlaqə saxla
              </a>
            </div>
            <div className="doctorProfile__contact">
              <p><Icon name="location" size={18} /><span><small>Filial</small>{doctor.branch}</span></p>
              <p><Icon name="globe" size={18} /><span><small>Dillər</small>{doctor.languages.join(", ")}</span></p>
              <p><Icon name="shield" size={18} /><span><small>Təcrübə</small>{doctor.experience} il</span></p>
            </div>
            <div className="doctorProfile__social">
              <span>Professional əlaqə</span>
              <a href="mailto:official@medicarehospital.az"><Icon name="mail" size={18} /> E-mail</a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer"><Icon name="arrowUpRight" size={18} /> LinkedIn</a>
            </div>
          </aside>
          <div className="doctorProfile__content">
            <ContentStatusNotice result={degradedResult} />
            <Reveal>
              <span className="eyebrow">Həkim haqqında</span>
              <h2>Fərdi ehtiyacı dinləyən klinik yanaşma</h2>
              <p className="lead">{doctor.about}</p>
            </Reveal>
            <div className="doctorProfile__highlights">
              <article><strong>{doctor.experience}+</strong><span>il klinik təcrübə</span></article>
              <article><strong>{doctor.conditions.length}</strong><span>əsas müalicə istiqaməti</span></article>
              <article><strong>{doctor.languages.length}</strong><span>dildə konsultasiya</span></article>
            </div>
            <ProfileSection icon="document" title="Təhsil">
              <ol className="profileTimeline">{doctor.education.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol>
            </ProfileSection>
            <ProfileSection icon="shield" title="Sertifikatlar">
              <ul className="checkList">{doctor.certificates.map((item) => <li key={item}><Icon name="check" size={16} />{item}</li>)}</ul>
            </ProfileSection>
            <ProfileSection icon="document" title="İş təcrübəsi">
              <ul className="profileLines">{doctor.career.map((item) => <li key={item}>{item}</li>)}</ul>
            </ProfileSection>
            <div className="profileDouble">
              <ProfileSection icon="heart" title="Müalicə etdiyi xəstəliklər">
                <ul className="tagList">{doctor.conditions.map((item) => <li key={item}>{item}</li>)}</ul>
              </ProfileSection>
              <ProfileSection icon="cross" title="İcra etdiyi prosedurlar">
                <ul className="tagList">{doctor.procedures.map((item) => <li key={item}>{item}</li>)}</ul>
              </ProfileSection>
            </div>
            <ProfileSection icon="calendar" title="İş qrafiki">
              <div className="scheduleList">
                {doctor.schedule.map((item) => {
                  const [day, time] = item.split(/ (?=\d)/);
                  return <p key={item}><span>{day}</span><strong>{time || ""}</strong></p>;
                })}
              </div>
              <small className="profileNote">İş qrafiki dəyişə bilər. Aktual məlumat üçün əlaqə mərkəzimizə zəng edin.</small>
            </ProfileSection>
          </div>
        </div>
      </section>
      {fallbackRelated.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <div className="sectionTop">
              <div className="sectionHeading"><span className="eyebrow">Əlaqəli mütəxəssislər</span><h2>Sizə uyğun digər həkimlər</h2></div>
              <Link className="textAction" href={`/doctors?department=${doctor.department}`}>Bütün həkimlər <Icon name="arrow" size={18} /></Link>
            </div>
            <div className="cardGrid cardGrid--three">
              {fallbackRelated.map((item) => <DoctorCard doctor={item} phoneHref={contact.phoneHref} key={item.slug} />)}
            </div>
          </div>
        </section>
      )}
      <ContactCta contact={contact} />
      <JsonLd data={physicianSchema} />
    </>
  );
}

function ProfileSection({ icon, title, children }) {
  return (
    <section className="profileSection">
      <div className="profileSection__title"><span><Icon name={icon} size={21} /></span><h2>{title}</h2></div>
      <div className="profileSection__body">{children}</div>
    </section>
  );
}

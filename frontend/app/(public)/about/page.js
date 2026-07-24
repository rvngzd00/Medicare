import Link from "next/link";
import PageHero from "@/components/common/PageHero";
import SectionHeading from "@/components/common/SectionHeading";
import SmartImage from "@/components/common/SmartImage";
import StatsStrip from "@/components/home/StatsStrip";
import ContactCta from "@/components/common/ContactCta";
import Icon from "@/components/common/Icon";
import Reveal from "@/components/animations/Reveal";
import { CmsPageSection } from "@/components/common/CmsPageSections";
import { ContentStatusNotice } from "@/components/common/ContentStatus";
import EmptyState from "@/components/common/EmptyState";
import { createMetadata } from "@/utils/seo";
import {
  getCertificatesContent,
  getGalleryContent,
  getLeadershipContent,
  getPageContent,
} from "@/services/content";
import { resolvePageSections } from "@/utils/cmsSections";
import { timeline, values } from "@/data/site";

const ABOUT_SECTIONS = [
  { key: "hero", type: "HERO", label: "Səhifə təqdimatı", eyebrow: "Medicare haqqında", title: "Dəqiq tibbin mərkəzində insan dayanır", description: "2017-ci ildən etibarən Sabunçuda klinik təcrübəni və insana yaxın tibbi xidməti bir araya gətiririk.", active: true },
  { key: "story", type: "RICH_TEXT", label: "Bizim hekayəmiz", eyebrow: "Bizim hekayəmiz", title: "Ambulator klinikadan Medicare Hospital-a", description: "Medicare bir sualla başladı: tibbi proses pasiyent üçün necə daha aydın, rahat və etibarlı ola bilər?", content: { text: "Medicare Hospital Sabunçu qəsəbəsində çoxprofilli tibbi xidmət göstərir.\n\nBizim üçün inkişaf daha çox cihaz deyil; daha düzgün sual, daha dəqiq protokol və daha yaxşı pasiyent təcrübəsidir." }, active: true },
  { key: "mission", type: "FEATURE_GRID", label: "Missiya və vizyon", eyebrow: "Məqsədimiz", title: "Missiyamız və vizyonumuz", description: "Elmi əsaslı tibbi xidməti insana yaxın, aydın və əlçatan formada təqdim edirik.", active: true },
  { key: "timeline", type: "FEATURE_GRID", label: "İnkişaf yolu", eyebrow: "İnkişaf yolu", title: "Hər mərhələdə daha güclü klinik sistem", description: "İnfrastruktur böyüdükcə əsas prinsipimiz dəyişməyib: təhlükəsiz və izah edilən tibbi qayğı.", active: true },
  { key: "values", type: "FEATURE_GRID", label: "Dəyərlərimiz", eyebrow: "Dəyərlərimiz", title: "Hər qərara istiqamət verən prinsiplər", description: "Tibbi nəticə ilə pasiyent təcrübəsini bir-birindən ayırmırıq.", active: true },
  { key: "leadership", type: "COLLECTION", label: "Rəhbərlik", eyebrow: "Rəhbərlik", title: "Keyfiyyət mədəniyyətini quran komanda", description: "Klinik, əməliyyat və pasiyent təcrübəsi üzrə vahid strateji baxış.", active: true },
  { key: "infrastructure", type: "MEDIA", label: "İnfrastruktur", eyebrow: "İnfrastruktur", title: "Dəqiqlik üçün düşünülmüş məkanlar", description: "Hər zona təhlükəsizlik, rahatlıq və klinik komandanın sürətli əməkdaşlığı üçün planlanıb.", active: true },
  { key: "certificates", type: "COLLECTION", label: "Keyfiyyət və etibar", eyebrow: "Keyfiyyət və etibar", title: "Standartlarımız sənədləşir, hər gün tətbiq olunur", description: "Daxili audit, infeksiya nəzarəti və klinik təhlükəsizlik göstəriciləri davamlı izlənir.", active: true },
  { key: "contact-cta", type: "CTA", label: "Telefon əlaqə çağırışı", eyebrow: "Əlaqə", title: "Medicare təcrübəsini yaxından tanıyın", description: "Hospitalımız, həkimlərimiz və sizə uyğun xidmət planı haqqında komandamızdan məlumat alın.", active: true },
];

const ABOUT_PAGE_FALLBACK = {
  slug: "about",
  title: "Dəqiq tibbin mərkəzində insan dayanır",
  excerpt:
    "2017-ci ildən etibarən Sabunçuda klinik təcrübəni və insana yaxın tibbi xidməti bir araya gətiririk.",
  body: {
    version: 1,
    blocks: [
      {
        type: "paragraph",
        text: "Medicare Hospital Sabunçu qəsəbəsində laboratoriya, ginekologiya, pediatriya, kosmetologiya, kardiologiya, terapiya və ultrasəs müayinəsi istiqamətlərində pasiyentlərə xidmət göstərir.",
      },
      {
        type: "paragraph",
        text: "Bizim üçün inkişaf daha çox cihaz deyil; daha düzgün sual, daha dəqiq protokol və daha yaxşı pasiyent təcrübəsidir.",
      },
    ],
  },
  sections: ABOUT_SECTIONS,
};

const missionItems = [
  {
    title: "Missiyamız",
    text: "Elmi əsaslı tibbi xidməti insana yaxın, aydın və əlçatan formada təqdim etməklə hər pasiyentin sağlam qərar verməsinə dəstək olmaq.",
  },
  {
    title: "Vizyonumuz",
    text: "Regionda klinik keyfiyyət, rəqəmsal koordinasiya və pasiyent təcrübəsi üzrə etibar edilən nümunəvi sağlamlıq şəbəkəsinə çevrilmək.",
  },
];

export async function generateMetadata() {
  const result = await getPageContent("about", ABOUT_PAGE_FALLBACK);
  const page = result.item || ABOUT_PAGE_FALLBACK;
  return createMetadata({
    title: page.seo?.title || page.title || "Haqqımızda",
    description:
      page.seo?.description ||
      page.excerpt ||
      "Medicare Hospital-ın tarixi, missiyası, tibbi yanaşması, rəhbərliyi və müasir infrastrukturu ilə tanış olun.",
    path: "/about",
    image: page.seo?.ogImage?.url,
    canonical: page.seo?.canonicalUrl,
    keywords: page.seo?.keywords,
    robots: page.seo?.robots,
    ogTitle: page.seo?.ogTitle,
    ogDescription: page.seo?.ogDescription,
    twitterCard: page.seo?.twitterCard,
  });
}

export default async function AboutPage() {
  const [
    pageContent,
    leadershipContent,
    galleryContent,
    certificateContent,
  ] = await Promise.all([
    getPageContent("about", ABOUT_PAGE_FALLBACK),
    getLeadershipContent(),
    getGalleryContent(),
    getCertificatesContent(),
  ]);
  const page = pageContent.item || ABOUT_PAGE_FALLBACK;
  const sections = resolvePageSections(page, ABOUT_SECTIONS);
  const aboutContentStatus = {
    unavailable: [
      pageContent,
      leadershipContent,
      galleryContent,
      certificateContent,
    ].some((result) => result.unavailable),
    source: [
      pageContent,
      leadershipContent,
      galleryContent,
      certificateContent,
    ].some((result) => result.unavailable)
      ? "fallback"
      : [
            pageContent,
            leadershipContent,
            galleryContent,
            certificateContent,
          ].every((result) => result.source === "live")
        ? "live"
        : "mock",
  };
  const leadership = leadershipContent.items;
  const gallery = galleryContent.items;
  const certificates = certificateContent.items;

  return (
    <div className="cmsPageFlow">
      {sections.map((section) => {
        if (section.key === "hero") {
          return (
            <PageHero
              key={section.id || section.key}
              eyebrow={section.eyebrow}
              title={section.title}
              description={section.description}
              breadcrumbs={[{ label: "Haqqımızda" }]}
            />
          );
        }

        if (section.key === "story") {
          const text =
            section.content.text ||
            page.paragraphs?.join("\n\n") ||
            ABOUT_PAGE_FALLBACK.body.blocks
              .map((block) => block.text)
              .join("\n\n");
          const paragraphs = String(text)
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean);
          return (
            <section className="section" key={section.id || section.key}>
              <div className="container">
                <ContentStatusNotice result={aboutContentStatus} />
              </div>
              <div className="container storyGrid">
                <Reveal className="storyGrid__visual">
                  <div className="storyGrid__image">
                    <SmartImage
                      src={
                        section.content.image ||
                        "/images/medicare-hospital-sabunchu.jpg"
                      }
                      alt={
                        section.content.imageAlt ||
                        "Medicare Hospital-un Sabunçu qəsəbəsindəki binası"
                      }
                      sizes="(max-width: 900px) 100vw, 50vw"
                      priority
                    />
                  </div>
                  <div className="storyGrid__note">
                    <strong>{section.content.year || "2017"}</strong>
                    <span>
                      {section.content.yearLabel || "fəaliyyətə başlanğıc"}
                    </span>
                  </div>
                </Reveal>
                <Reveal className="storyGrid__content" variant="left">
                  <SectionHeading
                    eyebrow={section.eyebrow}
                    title={section.title}
                    text={section.description}
                  />
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <Link
                    className="textAction"
                    href={section.content.linkHref || "/contact"}
                  >
                    {section.content.linkLabel || "Bizimlə tanış olun"}
                    <Icon name="arrow" size={18} />
                  </Link>
                </Reveal>
              </div>
            </section>
          );
        }

        if (section.key === "mission") {
          const items = Array.isArray(section.content.items)
            ? section.content.items
            : missionItems;
          return (
            <section
              className="section section--soft"
              key={section.id || section.key}
            >
              <div className="container">
                <SectionHeading
                  eyebrow={section.eyebrow}
                  title={section.title}
                  text={section.description}
                />
              </div>
              <div className="container missionGrid">
                {items.slice(0, 4).map((item, index) => (
                  <Reveal
                    className={`missionCard ${index === 0 ? "missionCard--primary" : ""}`}
                    delay={index * 80}
                    key={item.title || index}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <h2>{item.title}</h2>
                    <p>{item.text || item.description}</p>
                  </Reveal>
                ))}
              </div>
              <div className="container aboutStats"><StatsStrip /></div>
            </section>
          );
        }

        if (section.key === "timeline") {
          const items = Array.isArray(section.content.items)
            ? section.content.items
            : timeline;
          return (
            <section className="section" key={section.id || section.key}>
              <div className="container">
                <SectionHeading
                  eyebrow={section.eyebrow}
                  title={section.title}
                  text={section.description}
                />
                <div className="timeline">
                  {items.map((item, index) => (
                    <Reveal
                      className="timeline__item"
                      key={item.year || item.title || index}
                      delay={index * 70}
                    >
                      <span>{item.year || String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.text || item.description}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (section.key === "values") {
          const items = Array.isArray(section.content.items)
            ? section.content.items
            : values;
          return (
            <section
              className="section section--dark"
              key={section.id || section.key}
            >
              <div className="container">
                <SectionHeading
                  eyebrow={section.eyebrow}
                  title={section.title}
                  text={section.description}
                />
                <div className="valueGrid valueGrid--dark">
                  {items.map((value, index) => (
                    <Reveal
                      className="valueCard"
                      key={value.title || index}
                      delay={index * 60}
                    >
                      <span>
                        <Icon name={value.icon || "shield"} size={25} />
                      </span>
                      <h3>{value.title}</h3>
                      <p>{value.text || value.description}</p>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (section.key === "leadership") {
          return (
            <section className="section" key={section.id || section.key}>
              <div className="container">
                <SectionHeading
                  eyebrow={section.eyebrow}
                  title={section.title}
                  text={section.description}
                />
                {leadership.length > 0 ? (
                  <div className="leadershipGrid">
                    {leadership.map((member, index) => (
                      <Reveal
                        className="leaderCard"
                        key={member.id || member.name}
                        delay={index * 80}
                      >
                        <div className="leaderCard__image">
                          <SmartImage
                            src={member.image}
                            alt={`${member.name}, ${member.role}`}
                            sizes="(max-width: 640px) 100vw, 33vw"
                            fallbackLabel={member.name}
                          />
                        </div>
                        <div>
                          <span>{member.role}</span>
                          <h3>{member.name}</h3>
                          <p>{member.bio}</p>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Rəhbərlik profili yoxdur" />
                )}
              </div>
            </section>
          );
        }

        if (section.key === "infrastructure") {
          return (
            <section
              className="section section--soft"
              id="infrastructure"
              key={section.id || section.key}
            >
              <div className="container">
                <SectionHeading
                  eyebrow={section.eyebrow}
                  title={section.title}
                  text={section.description}
                />
                {gallery.length > 0 ? (
                  <div className="facilityGallery">
                    {gallery.map((facility, index) => (
                      <Reveal
                        className={`facilityGallery__item ${index === 0 ? "facilityGallery__item--large" : ""}`}
                        key={facility.id || facility.title}
                      >
                        <SmartImage
                          src={facility.image}
                          alt={facility.title}
                          sizes={
                            index === 0
                              ? "(max-width: 900px) 100vw, 66vw"
                              : "(max-width: 900px) 100vw, 33vw"
                          }
                          fallbackLabel={facility.title}
                        />
                        <div>
                          <span>{facility.metric}</span>
                          <h3>{facility.title}</h3>
                          <p>{facility.text}</p>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Qalereya qeydi yoxdur" />
                )}
              </div>
            </section>
          );
        }

        if (section.key === "certificates") {
          return (
            <section
              className="section certificateSection"
              key={section.id || section.key}
            >
              <div className="container certificateSection__grid">
                <SectionHeading
                  eyebrow={section.eyebrow}
                  title={section.title}
                  text={section.description}
                />
                {certificates.length > 0 ? (
                  <div className="certificateList">
                    {certificates.map((certificate) => (
                      <article key={certificate.id || certificate.code}>
                        <Icon name="shield" size={27} />
                        <p>
                          <strong>{certificate.code}</strong>
                          <span>{certificate.title}</span>
                        </p>
                        <Icon name="arrowUpRight" size={18} />
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Sertifikat qeydi yoxdur" />
                )}
              </div>
            </section>
          );
        }

        if (section.key === "contact-cta") {
          return (
            <ContactCta
              key={section.id || section.key}
              eyebrow={section.eyebrow}
              title={section.title}
              text={section.description}
            />
          );
        }

        return (
          <CmsPageSection
            key={section.id || section.key}
            section={section}
          />
        );
      })}
    </div>
  );
}

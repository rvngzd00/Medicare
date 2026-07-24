import Link from "next/link";
import HomeHero from "@/components/home/HomeHero";
import StatsStrip from "@/components/home/StatsStrip";
import SectionHeading from "@/components/common/SectionHeading";
import ServiceCard from "@/components/services/ServiceCard";
import DepartmentCard from "@/components/departments/DepartmentCard";
import DoctorCard from "@/components/doctors/DoctorCard";
import ArticleCard from "@/components/news/ArticleCard";
import AppointmentCta from "@/components/common/AppointmentCta";
import Accordion from "@/components/common/Accordion";
import MapBlock from "@/components/common/MapBlock";
import SmartImage from "@/components/common/SmartImage";
import Icon from "@/components/common/Icon";
import Reveal from "@/components/animations/Reveal";
import JsonLd from "@/components/seo/JsonLd";
import { CmsPageSection } from "@/components/common/CmsPageSections";
import { ContentStatusNotice } from "@/components/common/ContentStatus";
import EmptyState from "@/components/common/EmptyState";
import { createMetadata } from "@/utils/seo";
import {
  getArticlesContent,
  getBranchesContent,
  getDepartmentsContent,
  getDoctorsContent,
  getFaqsContent,
  getPageContent,
  getPublicConfigurationContent,
  getServicesContent,
  getTestimonialsContent,
} from "@/services/content";
import {
  positiveSectionLimit,
  resolvePageSections,
} from "@/utils/cmsSections";
import { facilities, values } from "@/data/site";
import { SITE_URL } from "@/constants/site";

const HOME_DESCRIPTION =
  "Medicare Hospital — müasir diaqnostika, ixtisaslaşmış həkimlər, 24/7 tibbi yardım və pasiyent yönümlü xidmət.";

const HOME_SECTIONS = [
  {
    key: "hero",
    type: "HERO",
    label: "Hero təqdimatı",
    eyebrow: "Sağlamlığınız bizim dəyərimizdir",
    title: "Sağlamlığınız üçün dəqiq qərarlar, qayğıkeş yanaşma",
    description:
      "Müasir diaqnostika və güvəndiyiniz həkim komandası bir məkanda.",
    content: {
      primaryLabel: "Qəbula yazıl",
      primaryHref: "/appointment",
      secondaryLabel: "Həkimləri tanı",
      secondaryHref: "/doctors",
    },
  },
  {
    key: "stats",
    type: "STATISTICS",
    label: "Etibar göstəriciləri",
  },
  {
    key: "assurance",
    type: "FEATURE_GRID",
    label: "Qayğı yolu",
    eyebrow: "Qayğı yolu",
    title: "Müraciətdən aydın tibbi plana qədər",
    description:
      "Sualınızı dinləyir, sizi doğru mütəxəssisə yönləndirir və növbəti addımları sadə dildə planlaşdırırıq.",
  },
  {
    key: "services",
    type: "COLLECTION",
    label: "Əsas xidmətlər",
    eyebrow: "Əsas xidmətlər",
    title: "Ehtiyacınıza uyğun tibbi həllər",
    description:
      "Profilaktik müayinədən mürəkkəb diaqnostikaya qədər hər xidmət vahid klinik standartla planlanır.",
    content: {
      limit: 4,
      linkLabel: "Bütün xidmətlər",
      linkHref: "/services",
    },
  },
  {
    key: "departments",
    type: "COLLECTION",
    label: "Tibbi şöbələr",
    eyebrow: "Tibbi şöbələr",
    title: "Bir-birini tamamlayan ixtisaslar",
    description:
      "Komandalarımız mürəkkəb halları birlikdə dəyərləndirir, siz isə bütün prosesi bir mərkəzdə tamamlayırsınız.",
    content: {
      limit: 6,
      linkLabel: "Bütün şöbələr",
      linkHref: "/departments",
    },
  },
  {
    key: "doctors",
    type: "COLLECTION",
    label: "Həkim komandamız",
    eyebrow: "Həkim komandamız",
    title: "Bilik qədər ünsiyyətə də önəm verən mütəxəssislər",
    description:
      "Sizin sualınızı dinləyən, seçimlərinizi aydın izah edən və müalicə yolunu birlikdə quran həkimlər.",
    content: {
      limit: 4,
      linkLabel: "Bütün həkimlər",
      linkHref: "/doctors",
    },
  },
  {
    key: "why-medicare",
    type: "FEATURE_GRID",
    label: "Niyə Medicare?",
    eyebrow: "Niyə Medicare?",
    title: "Tibbi dəqiqlik, insani diqqətlə birlikdə",
    description:
      "Sistemimizi pasiyentin özünü məlumatlı, təhlükəsiz və rahat hiss etməsi üçün qurmuşuq.",
  },
  {
    key: "technology",
    type: "MEDIA",
    label: "Texnologiya və imkanlar",
    eyebrow: "Texnologiya və imkanlar",
    title: "Daha aydın görüntü. Daha inamlı qərar.",
    description:
      "Avadanlığın gücünü ixtisaslaşmış həkim interpretasiyası və düzgün klinik protokolla tamamlayırıq.",
    content: {
      image: "/images/diagnostic-suite.png",
      imageAlt: "Medicare 3 Tesla MRT diaqnostika mərkəzi",
      linkLabel: "İnfrastrukturumuza bax",
      linkHref: "/about#infrastructure",
    },
  },
  {
    key: "appointment",
    type: "CTA",
    label: "Qəbula yazılma çağırışı",
    title: "Sağlamlığınızı təxirə salmayın",
    description:
      "Sizə uyğun şöbə və həkimi seçmək üçün komandamızla əlaqə saxlayın.",
  },
  {
    key: "testimonials",
    type: "COLLECTION",
    label: "Pasiyent rəyləri",
    eyebrow: "Pasiyent təcrübəsi",
    title: "Etibar, hər görüşdə yenidən qazanılır",
    description:
      "Pasiyentlərin paylaşdığı təcrübələr xidmətimizi daha yaxşı qurmağımıza kömək edir.",
  },
  {
    key: "articles",
    type: "COLLECTION",
    label: "Sağlamlıq jurnalı",
    eyebrow: "Sağlamlıq jurnalı",
    title: "Bilik, sağlam qərarın başlanğıcıdır",
    description:
      "Həkimlərimizin gündəlik sağlamlıq və müasir tibbi yanaşmalar haqqında aydın izahları.",
    content: {
      limit: 3,
      linkLabel: "Bütün məqalələr",
      linkHref: "/news",
    },
  },
  {
    key: "faq",
    type: "FAQ",
    label: "Tez-tez soruşulanlar",
    eyebrow: "Tez-tez soruşulanlar",
    title: "Qəbuldan əvvəl bilməli olduqlarınız",
    description:
      "Ən çox verilən sualları topladıq. Axtardığınız cavab yoxdursa, komandamızla əlaqə saxlayın.",
    content: {
      limit: 5,
      linkLabel: "Bütün suallara bax",
      linkHref: "/faq",
    },
  },
  {
    key: "contact",
    type: "CONTACT",
    label: "Ünvanımız",
    eyebrow: "Ünvanımız",
    title: "Medicare Hospital — Sabunçu",
    description:
      "Əslidar Məmmədəliyev küçəsi 5 ünvanında həftənin hər günü, 24 saat xidmətinizdəyik.",
  },
];

const HOME_PAGE_FALLBACK = {
  slug: "home",
  title: "Ana səhifə",
  excerpt: HOME_DESCRIPTION,
  template: "HOME",
  sectionLayoutConfigured: true,
  body: { version: 2, blocks: [] },
  sections: HOME_SECTIONS,
};

const assuranceSteps = [
  {
    icon: "chat",
    title: "Müraciətinizi bildirin",
    text: "Əlamətlərinizi və uyğun qəbul vaxtını əlaqə komandamızla paylaşın.",
  },
  {
    icon: "user",
    title: "Doğru həkimə yönləndirin",
    text: "Ehtiyacınıza uyğun şöbə və mütəxəssis seçimini birlikdə dəqiqləşdirək.",
  },
  {
    icon: "shield",
    title: "Aydın planla davam edin",
    text: "Müayinə, nəticə və növbəti addımlar vahid qayğı planında birləşdirilsin.",
  },
];

export async function generateMetadata() {
  const [configurationContent, pageContent] = await Promise.all([
    getPublicConfigurationContent(),
    getPageContent("home", HOME_PAGE_FALLBACK),
  ]);
  const configuration = configurationContent.configuration;
  const page = pageContent.item || HOME_PAGE_FALLBACK;
  const metadata = createMetadata({
    title: page.seo?.title,
    description:
      page.seo?.description ||
      page.excerpt ||
      configuration.seoDescription ||
      HOME_DESCRIPTION,
    path: "/",
    image: page.seo?.ogImage?.url || "/images/medicare-hero.png",
    canonical: page.seo?.canonicalUrl || configuration.canonical,
    keywords: page.seo?.keywords,
    robots: page.seo?.robots,
    ogTitle: page.seo?.ogTitle,
    ogDescription: page.seo?.ogDescription,
    twitterCard: page.seo?.twitterCard,
  });

  const seoTitle = page.seo?.title || configuration.seoTitle;
  if (seoTitle) {
    metadata.title = { absolute: seoTitle };
    metadata.openGraph.title = seoTitle;
    metadata.twitter.title = seoTitle;
  }
  return metadata;
}

export default async function HomePage() {
  const [
    pageContent,
    configurationContent,
    serviceContent,
    departmentContent,
    doctorContent,
    articleContent,
    testimonialContent,
    faqContent,
    branchContent,
  ] = await Promise.all([
    getPageContent("home", HOME_PAGE_FALLBACK),
    getPublicConfigurationContent(),
    getServicesContent(),
    getDepartmentsContent(),
    getDoctorsContent(),
    getArticlesContent(),
    getTestimonialsContent(),
    getFaqsContent(),
    getBranchesContent(),
  ]);
  const page = pageContent.item || HOME_PAGE_FALLBACK;
  const configuration = configurationContent.configuration;
  const sections = resolvePageSections(page, HOME_SECTIONS);
  const contentResults = [
    pageContent,
    configurationContent,
    serviceContent,
    departmentContent,
    doctorContent,
    articleContent,
    testimonialContent,
    faqContent,
    branchContent,
  ];
  const homeContentStatus = {
    unavailable: contentResults.some((result) => result.unavailable),
    source: contentResults.some((result) => result.unavailable)
      ? "fallback"
      : contentResults.every((result) => result.source === "live")
        ? "live"
        : "mock",
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: configuration.siteName,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL.replace(/\/+$/, "")}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <div className="cmsPageFlow">
        {sections.map((section) => {
          if (section.key === "hero") {
            return (
              <HomeHero
                key={section.id || section.key}
                content={section}
                contact={configuration.contact}
              />
            );
          }

          if (section.key === "stats") {
            return (
              <section
                className="trustBand"
                aria-label={section.label}
                key={section.id || section.key}
              >
                <div className="container"><StatsStrip /></div>
              </section>
            );
          }

          if (section.key === "assurance") {
            const steps = Array.isArray(section.content.items)
              ? section.content.items
              : assuranceSteps;
            return (
              <section
                className="section homeAssurance"
                key={section.id || section.key}
              >
                <div className="container homeAssurance__grid">
                  <div className="homeAssurance__intro">
                    <SectionHeading
                      eyebrow={section.eyebrow}
                      title={section.title}
                      text={section.description}
                    />
                    <a
                      className="homeAssurance__contact"
                      href={configuration.contact.phoneHref}
                    >
                      <span><Icon name="phone" size={18} /></span>
                      {configuration.contact.phone}
                    </a>
                  </div>
                  <div className="homeAssurance__steps">
                    {steps.slice(0, 3).map((step, index) => (
                      <article key={step.title || index}>
                        <span><Icon name={step.icon || "shield"} size={23} /></span>
                        <small>{String(index + 1).padStart(2, "0")}</small>
                        <h3>{step.title}</h3>
                        <p>{step.text || step.description}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          if (section.key === "services") {
            const items = selectFeatured(
              serviceContent.items,
              positiveSectionLimit(section, 4),
            );
            return (
              <section className="section" key={section.id || section.key}>
                <div className="container">
                  <ContentStatusNotice result={homeContentStatus} />
                  <SectionTop section={section} fallbackHref="/services" />
                  {items.length > 0 ? (
                    <div className="cardGrid cardGrid--four">
                      {items.map((service, index) => (
                        <Reveal key={service.slug} delay={index * 70}>
                          <ServiceCard service={service} index={index} />
                        </Reveal>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Aktiv xidmət tapılmadı" />
                  )}
                </div>
              </section>
            );
          }

          if (section.key === "departments") {
            const items = selectFeatured(
              departmentContent.items,
              positiveSectionLimit(section, 6),
            );
            return (
              <section
                className="section section--soft departmentShowcase"
                key={section.id || section.key}
              >
                <div className="container">
                  <SectionTop section={section} fallbackHref="/departments" />
                  {items.length > 0 ? (
                    <div className="cardGrid cardGrid--three">
                      {items.map((department, index) => (
                        <Reveal
                          key={department.slug}
                          delay={(index % 3) * 70}
                        >
                          <DepartmentCard
                            department={department}
                            index={index}
                          />
                        </Reveal>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Aktiv şöbə tapılmadı" />
                  )}
                </div>
              </section>
            );
          }

          if (section.key === "doctors") {
            const items = selectFeatured(
              doctorContent.items,
              positiveSectionLimit(section, 4),
            );
            return (
              <section className="section" key={section.id || section.key}>
                <div className="container">
                  <SectionTop section={section} fallbackHref="/doctors" />
                  {items.length > 0 ? (
                    <div className="cardGrid cardGrid--four">
                      {items.map((doctor, index) => (
                        <Reveal key={doctor.slug} delay={index * 70}>
                          <DoctorCard doctor={doctor} />
                        </Reveal>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Aktiv həkim profili tapılmadı" />
                  )}
                </div>
              </section>
            );
          }

          if (section.key === "why-medicare") {
            const valueItems = Array.isArray(section.content.items)
              ? section.content.items
              : values;
            return (
              <section
                className="section whySection"
                key={section.id || section.key}
              >
                <div className="container whySection__grid">
                  <Reveal className="whySection__intro">
                    <SectionHeading
                      eyebrow={section.eyebrow}
                      title={section.title}
                      text={section.description}
                    />
                    <div className="whySection__signature">
                      <span className="signatureMark">M</span>
                      <p>
                        <strong>
                          {section.content.directorName || "Dr. Kamran Rzayev"}
                        </strong>
                        <small>
                          {section.content.directorRole || "Baş direktor"}
                        </small>
                      </p>
                    </div>
                  </Reveal>
                  <div className="valueGrid">
                    {valueItems.map((value, index) => (
                      <Reveal
                        className="valueCard"
                        key={value.title || index}
                        delay={index * 70}
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

          if (section.key === "technology") {
            const facilityItems = Array.isArray(section.content.items)
              ? section.content.items
              : facilities;
            return (
              <section
                className="section technologySection"
                key={section.id || section.key}
              >
                <div className="container technologySection__grid">
                  <Reveal
                    className="technologySection__visual"
                    variant="right"
                  >
                    <SmartImage
                      src={
                        section.content.image ||
                        "/images/diagnostic-suite.png"
                      }
                      alt={
                        section.content.imageAlt ||
                        "Medicare diaqnostika mərkəzi"
                      }
                      sizes="(max-width: 900px) 100vw, 55vw"
                    />
                    <div className="technologySection__badge">
                      <strong>
                        {section.content.badgeMetric || "24/7"}
                      </strong>
                      <span>
                        {section.content.badgeLabel || "Diaqnostika xidməti"}
                      </span>
                    </div>
                  </Reveal>
                  <Reveal
                    className="technologySection__content"
                    variant="left"
                  >
                    <SectionHeading
                      eyebrow={section.eyebrow}
                      title={section.title}
                      text={section.description}
                    />
                    <div className="facilityList">
                      {facilityItems.map((facility, index) => (
                        <article key={facility.title || index}>
                          <strong>{facility.metric}</strong>
                          <div>
                            <h3>{facility.title}</h3>
                            <p>{facility.text || facility.description}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                    {section.content.linkHref && (
                      <Link
                        className="button button--dark"
                        href={section.content.linkHref}
                      >
                        {section.content.linkLabel || "Ətraflı bax"}
                        <Icon name="arrow" size={18} />
                      </Link>
                    )}
                  </Reveal>
                </div>
              </section>
            );
          }

          if (section.key === "appointment") {
            return (
              <AppointmentCta
                key={section.id || section.key}
                contact={configuration.contact}
                eyebrow={section.eyebrow}
                title={section.title}
                text={section.description}
                primaryLabel={section.content.primaryLabel}
                primaryHref={section.content.primaryHref}
                secondaryLabel={section.content.secondaryLabel}
                secondaryHref={section.content.secondaryHref}
              />
            );
          }

          if (section.key === "testimonials") {
            const items = testimonialContent.items.slice(
              0,
              positiveSectionLimit(
                section,
                testimonialContent.items.length || 6,
              ),
            );
            return (
              <section
                className="section section--soft testimonialsSection"
                key={section.id || section.key}
              >
                <div className="container">
                  <SectionHeading
                    eyebrow={section.eyebrow}
                    title={section.title}
                    text={section.description}
                    align="center"
                  />
                  {items.length > 0 ? (
                    <div className="testimonialGrid">
                      {items.map((testimonial, index) => (
                        <Reveal
                          className="testimonialCard"
                          key={testimonial.id || testimonial.name}
                          delay={index * 80}
                        >
                          <div className="testimonialCard__top">
                            <span className="quoteMark">“</span>
                            <div
                              className="rating"
                              aria-label={`${testimonial.rating} ulduz`}
                            >
                              {Array.from({
                                length: testimonial.rating,
                              }).map((_, ratingIndex) => (
                                <Icon
                                  name="star"
                                  size={15}
                                  key={ratingIndex}
                                />
                              ))}
                            </div>
                          </div>
                          <blockquote>{testimonial.quote}</blockquote>
                          <footer>
                            <span>{testimonial.name.charAt(0)}</span>
                            <p>
                              <strong>{testimonial.name}</strong>
                              <small>{testimonial.detail}</small>
                            </p>
                          </footer>
                        </Reveal>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Pasiyent rəyi yoxdur"
                      text="Təsdiqlənmiş rəylər əlavə olunduqca burada görünəcək."
                    />
                  )}
                </div>
              </section>
            );
          }

          if (section.key === "articles") {
            const items = selectFeatured(
              articleContent.items,
              positiveSectionLimit(section, 3),
            );
            return (
              <section className="section" key={section.id || section.key}>
                <div className="container">
                  <SectionTop section={section} fallbackHref="/news" />
                  {items.length > 0 ? (
                    <div className="cardGrid cardGrid--three">
                      {items.map((article, index) => (
                        <Reveal key={article.slug} delay={index * 70}>
                          <ArticleCard article={article} />
                        </Reveal>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Aktiv məqalə tapılmadı" />
                  )}
                </div>
              </section>
            );
          }

          if (section.key === "faq") {
            const limit = positiveSectionLimit(section, 5);
            return (
              <section
                className="section section--soft faqPreview"
                key={section.id || section.key}
              >
                <div className="container splitIntro">
                  <div>
                    <SectionHeading
                      eyebrow={section.eyebrow}
                      title={section.title}
                      text={section.description}
                    />
                    {section.content.linkHref && (
                      <Link
                        className="button button--outline"
                        href={section.content.linkHref}
                      >
                        {section.content.linkLabel || "Bütün suallara bax"}
                      </Link>
                    )}
                  </div>
                  {faqContent.items.length > 0 ? (
                    <Accordion items={faqContent.items.slice(0, limit)} />
                  ) : (
                    <EmptyState title="FAQ qeydi yoxdur" />
                  )}
                </div>
              </section>
            );
          }

          if (section.key === "contact") {
            return (
              <section
                className="section contactPreview"
                key={section.id || section.key}
              >
                <div className="container">
                  <SectionHeading
                    eyebrow={section.eyebrow}
                    title={section.title}
                    text={section.description}
                  />
                  {branchContent.items.length > 0 ? (
                    <MapBlock branchItems={branchContent.items} />
                  ) : (
                    <EmptyState title="Ünvan məlumatı tapılmadı" />
                  )}
                </div>
              </section>
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
      <JsonLd data={websiteSchema} />
    </>
  );
}

function SectionTop({ section, fallbackHref }) {
  const href = section.content.linkHref || fallbackHref;
  return (
    <div className="sectionTop">
      <SectionHeading
        eyebrow={section.eyebrow}
        title={section.title}
        text={section.description}
      />
      {href && (
        <Link className="textAction" href={href}>
          {section.content.linkLabel || "Hamısına bax"}
          <Icon name="arrow" size={18} />
        </Link>
      )}
    </div>
  );
}

function selectFeatured(items, limit) {
  return [
    ...items.filter((item) => item.featured),
    ...items.filter((item) => !item.featured),
  ].slice(0, limit);
}

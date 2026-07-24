import Link from "next/link";
import Accordion from "@/components/common/Accordion";
import ContactCta from "@/components/common/ContactCta";
import Icon from "@/components/common/Icon";
import PageHero from "@/components/common/PageHero";
import SectionHeading from "@/components/common/SectionHeading";
import SmartImage from "@/components/common/SmartImage";

function paragraphsFrom(section) {
  const text = section?.content?.text || section?.description || "";
  return String(text)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function safeItems(section) {
  return Array.isArray(section?.content?.items)
    ? section.content.items.filter(
        (item) => item && typeof item === "object" && !Array.isArray(item),
      )
    : [];
}

function safeCmsHref(value) {
  const href = typeof value === "string" ? value.trim() : "";
  return /^(?:\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(href) ? href : "";
}

function CmsLink({ href, className, children }) {
  const safeHref = safeCmsHref(href);
  if (!safeHref) return null;
  if (/^https?:\/\//i.test(safeHref)) {
    return (
      <a
        className={className}
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  return <Link className={className} href={safeHref}>{children}</Link>;
}

export function CmsPageSection({ section, breadcrumbs = [] }) {
  const content = section.content || {};
  const items = safeItems(section);

  if (section.type === "HERO") {
    return (
      <PageHero
        eyebrow={section.eyebrow}
        title={section.title || section.label}
        description={section.description}
        breadcrumbs={breadcrumbs}
      />
    );
  }

  if (section.type === "CTA") {
    return (
      <ContactCta
        eyebrow={section.eyebrow}
        title={section.title}
        text={section.description}
      />
    );
  }

  if (section.type === "MEDIA") {
    return (
      <section className="section cmsMediaSection">
        <div className="container cmsMediaSection__grid">
          <div className="cmsMediaSection__image">
            <SmartImage
              src={content.image || "/images/facility-placeholder.svg"}
              alt={content.imageAlt || section.title || section.label}
              sizes="(max-width: 900px) 100vw, 50vw"
              fallbackLabel={section.label}
            />
          </div>
          <div>
            <SectionHeading
              eyebrow={section.eyebrow}
              title={section.title || section.label}
              text={section.description}
            />
            {paragraphsFrom(section).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {safeCmsHref(content.linkHref) && content.linkLabel && (
              <CmsLink className="textAction" href={content.linkHref}>
                {content.linkLabel} <Icon name="arrow" size={18} />
              </CmsLink>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (section.type === "STATISTICS" && items.length) {
    return (
      <section className="section section--soft cmsStatsSection">
        <div className="container">
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.title || section.label}
            text={section.description}
            align="center"
          />
          <div className="cmsStatsGrid">
            {items.map((item, index) => (
              <article key={item.id || item.label || index}>
                <strong>{item.value || "—"}</strong>
                <span>{item.label || "Göstərici"}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (section.type === "FAQ" && items.length) {
    const accordionItems = items.map((item, index) => ({
      id: item.id || `${section.key}-${index}`,
      question: item.question || item.title || "Sual",
      answer: item.answer || item.text || "",
      category: item.category || section.eyebrow || "Ümumi",
    }));
    return (
      <section className="section section--soft">
        <div className="container splitIntro">
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.title || section.label}
            text={section.description}
          />
          <Accordion items={accordionItems} />
        </div>
      </section>
    );
  }

  if (["FEATURE_GRID", "CONTACT"].includes(section.type) && items.length) {
    return (
      <section className="section cmsFeatureSection">
        <div className="container">
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.title || section.label}
            text={section.description}
            align="center"
          />
          <div className="cmsFeatureGrid">
            {items.map((item, index) => (
              <article key={item.id || item.title || index}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title || item.label}</h3>
                <p>{item.text || item.description}</p>
                {safeCmsHref(item.href) && item.linkLabel && (
                  <CmsLink href={item.href}>{item.linkLabel}</CmsLink>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section cmsTextSection">
      <div className="container cmsTextSection__inner">
        <SectionHeading
          eyebrow={section.eyebrow}
          title={section.title || section.label}
          text={section.description}
        />
        <div className="cmsTextSection__body">
          {paragraphsFrom(section).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {safeCmsHref(content.linkHref) && content.linkLabel && (
          <CmsLink className="button button--outline" href={content.linkHref}>
            {content.linkLabel}
          </CmsLink>
        )}
      </div>
    </section>
  );
}

export default function CmsPageSections({ sections, breadcrumbs = [] }) {
  return (
    <div className="cmsPageFlow">
      {sections.map((section) => (
        <CmsPageSection
          key={section.id || section.key}
          section={section}
          breadcrumbs={breadcrumbs}
        />
      ))}
    </div>
  );
}

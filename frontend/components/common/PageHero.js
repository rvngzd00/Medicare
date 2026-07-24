import Breadcrumbs from "@/components/common/Breadcrumbs";
import Reveal from "@/components/animations/Reveal";

export default function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
  compact = false
}) {
  return (
    <section className={`pageHero ${compact ? "pageHero--compact" : ""}`}>
      <div className="pageHero__orb pageHero__orb--one" />
      <div className="pageHero__orb pageHero__orb--two" />
      <div className="container pageHero__inner">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <Reveal className="pageHero__copy">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}

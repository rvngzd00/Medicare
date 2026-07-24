import Link from "next/link";
import SmartImage from "@/components/common/SmartImage";
import Icon from "@/components/common/Icon";
import Reveal from "@/components/animations/Reveal";

export default function HomeHero({ content, contact }) {
  const primaryAction = content?.content?.primaryAction || {
    label: content?.content?.primaryLabel || "Qəbula yazıl",
    href: content?.content?.primaryHref || "/appointment"
  };
  const secondaryAction = content?.content?.secondaryAction || {
    label: content?.content?.secondaryLabel || "Həkim tap",
    href: content?.content?.secondaryHref || "/doctors"
  };
  const eyebrow =
    content?.content?.eyebrow ||
    content?.eyebrow ||
    "Beynəlxalq protokollar. İnsana yaxın qayğı.";
  const title = content?.title?.trim();
  const description =
    content?.description?.trim() ||
    content?.subtitle?.trim() ||
    "Müasir diaqnostikanı multidissiplinar həkim təcrübəsi ilə birləşdirərək sizin üçün aydın və fərdi müalicə yolu qururuq.";
  const emergency = contact?.emergency || "103";
  const emergencyHref = contact?.emergencyHref || "tel:103";

  return (
    <>
      <section className="homeHero">
        <div className="homeHero__grid" aria-hidden="true" />
        <div className="homeHero__orb" aria-hidden="true" />
        <div className="container homeHero__inner">
          <Reveal className="homeHero__content">
            <div className="homeHero__eyebrow">
              <span><Icon name="shield" size={15} /></span>
              {eyebrow}
            </div>
            <h1>
              {title || (
                <>Sağlamlığınız üçün <em>dəqiq qərarlar,</em> güvənli komanda.</>
              )}
            </h1>
            <p>{description}</p>
            <div className="homeHero__actions">
              <Link className="button button--primary button--large" href={primaryAction.href}>
                {primaryAction.label} <Icon name="arrow" size={19} />
              </Link>
              <Link className="button button--outline button--large" href={secondaryAction.href}>
                {secondaryAction.label}
              </Link>
            </div>
            <div className="homeHero__trust">
              <div className="avatarStack" aria-hidden="true">
                {["LM", "OƏ", "NS"].map((initials) => <span key={initials}>{initials}</span>)}
              </div>
              <p><strong>4.9 / 5</strong><span>Pasiyent təcrübəsi reytinqi</span></p>
            </div>
          </Reveal>
          <Reveal className="homeHero__visual" variant="left" delay={120}>
            <div className="homeHero__image">
              <SmartImage
                src={content?.content?.image || "/images/medicare-hero.png"}
                alt={content?.content?.imageAlt || "Medicare həkimi pasiyentlə konsultasiya zamanı"}
                sizes="(max-width: 900px) 100vw, 50vw"
                priority
                fallbackLabel="Etibarlı tibbi qayğı"
              />
            </div>
            <div className="heroFloat heroFloat--appointment">
              <span><Icon name="calendar" size={20} /></span>
              <p><small>Növbəti qəbul</small><strong>Bu gün, 14:30</strong></p>
            </div>
            <div className="heroFloat heroFloat--quality">
              <span><Icon name="shield" size={20} /></span>
              <p><strong>ISO 9001</strong><small>Keyfiyyət sistemi</small></p>
            </div>
            <div className="heroCross" aria-hidden="true"><span /><span /></div>
          </Reveal>
        </div>
      </section>
      <div className="homeHeroQuickShell">
        <nav className="container homeHero__quick" aria-label="Sürətli keçidlər">
          <Link href="/doctors"><Icon name="user" size={22} /><span><small>Mütəxəssis</small>Həkim tap</span><Icon name="arrow" size={17} /></Link>
          <Link href="/departments"><Icon name="cross" size={22} /><span><small>Tibbi xidmət</small>Şöbə seç</span><Icon name="arrow" size={17} /></Link>
          <Link href="/contact"><Icon name="location" size={22} /><span><small>Sabunçu</small>Ünvanı aç</span><Icon name="arrow" size={17} /></Link>
          <a href={emergencyHref} className="homeHero__emergency"><Icon name="phone" size={22} /><span><small>Təcili tibbi yardım</small>{emergency}</span><Icon name="arrow" size={17} /></a>
        </nav>
      </div>
    </>
  );
}

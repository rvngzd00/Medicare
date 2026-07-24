import Link from "next/link";
import Icon from "@/components/common/Icon";
import { getPublicConfigurationContent } from "@/services/content";

export default async function AppointmentCta({
  title = "Sağlamlığınız üçün ilk addımı bu gün atın",
  text = "Uyğun şöbə və həkimi seçin. Komandamız sorğunuzu qısa zamanda dəqiqləşdirəcək.",
  eyebrow = "Qayğıya bir addım",
  primaryLabel = "Qəbula yazıl",
  primaryHref = "/appointment",
  secondaryLabel,
  secondaryHref,
  contact
}) {
  const resolvedContact =
    contact || (await getPublicConfigurationContent()).configuration.contact;
  const safePrimaryHref = safeActionHref(primaryHref) || "/appointment";
  const safeSecondaryHref = safeActionHref(secondaryHref);

  return (
    <section className="appointmentCta section">
      <div className="container">
        <div className="appointmentCta__card">
          <div className="appointmentCta__pulse" aria-hidden="true"><span /><span /><span /></div>
          <div className="appointmentCta__copy">
            <span className="eyebrow eyebrow--light">{eyebrow}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
          <div className="appointmentCta__actions">
            <Link className="button button--white" href={safePrimaryHref}>
              {primaryLabel || "Qəbula yazıl"} <Icon name="arrow" size={18} />
            </Link>
            {safeSecondaryHref && secondaryLabel ? (
              <Link className="appointmentCta__phone" href={safeSecondaryHref}>
                <span><Icon name="arrowUpRight" size={19} /></span>
                <span><small>Daha ətraflı</small>{secondaryLabel}</span>
              </Link>
            ) : (
              <a className="appointmentCta__phone" href={resolvedContact.phoneHref}>
                <span><Icon name="phone" size={19} /></span>
                <span><small>və ya zəng edin</small>{resolvedContact.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function safeActionHref(value) {
  const href = typeof value === "string" ? value.trim() : "";
  return /^(?:\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(href) ? href : "";
}

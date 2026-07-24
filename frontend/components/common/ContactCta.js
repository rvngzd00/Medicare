import Icon from "@/components/common/Icon";
import { getPublicConfigurationContent } from "@/services/content";

export default async function ContactCta({
  title = "Sualınız var? Bizimlə birbaşa əlaqə saxlayın",
  text = "Əlaqə mərkəzimiz xidmətlər, şöbələr və həkimlər haqqında sizə ətraflı məlumat verməyə hazırdır.",
  eyebrow = "Hər gün, 24 saat",
  contact
}) {
  const resolvedContact =
    contact || (await getPublicConfigurationContent()).configuration.contact;

  return (
    <section className="contactCta section">
      <div className="container">
        <div className="contactCta__card">
          <div className="contactCta__pulse" aria-hidden="true"><span /><span /><span /></div>
          <div className="contactCta__copy">
            <span className="eyebrow eyebrow--light">{eyebrow}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
          <div className="contactCta__actions">
            <a className="button button--white" href={resolvedContact.phoneHref}>
              Bizimlə əlaqə saxla <Icon name="phone" size={18} />
            </a>
            <a className="contactCta__phone" href={resolvedContact.phoneHref}>
              <span><Icon name="phone" size={19} /></span>
              <span><small>Bir toxunuşla zəng edin</small>{resolvedContact.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

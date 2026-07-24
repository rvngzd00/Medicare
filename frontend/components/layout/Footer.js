import Link from "next/link";
import Logo from "@/components/common/Logo";
import Icon from "@/components/common/Icon";
import { CONTACT, MAIN_NAV, SOCIAL_LINKS } from "@/constants/site";
import { departments } from "@/data/departments";

export default function Footer({
  contact = CONTACT,
  navigation = MAIN_NAV,
  socialLinks = SOCIAL_LINKS,
  departmentItems = departments,
  siteName = "Medicare Hospital",
  tagline = "Dəqiq diaqnostika, güvənli həkim komandası və hər mərhələdə insana yaxın tibbi qayğı."
}) {
  return (
    <footer className="footer">
      <div className="footer__glow" />
      <div className="container footer__top">
        <div className="footer__intro">
          <Logo light siteName={siteName} />
          <p>{tagline}</p>
          {socialLinks.length > 0 && (
            <div className="footer__socials">
              {socialLinks.map((social) => (
                <a href={social.href} key={social.id || social.label} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                  <Icon name={socialIcon(social.label)} size={19} />
                </a>
              ))}
            </div>
          )}
        </div>
        {navigation.length > 0 && (
          <div className="footer__column">
            <h2>Naviqasiya</h2>
            <ul>
              {navigation.filter((item) => item.href !== "/").map((item) => (
                <li key={item.id || `${item.href}-${item.label}`}>
                  <Link
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="footer__column">
          <h2>Şöbələr</h2>
          <ul>
            {departmentItems.slice(0, 6).map((item) => (
              <li key={item.slug}><Link href={`/departments/${item.slug}`}>{item.name}</Link></li>
            ))}
          </ul>
        </div>
        <div className="footer__column footer__contact">
          <h2>Bizimlə əlaqə</h2>
          <a href={contact.phoneHref}><Icon name="phone" size={18} /><span><small>Əlaqə mərkəzi</small>{contact.phone}</span></a>
          <a href={contact.emailHref}><Icon name="mail" size={18} /><span><small>E-mail</small>{contact.email}</span></a>
          <span><Icon name="location" size={18} /><span><small>Ünvan</small>{contact.address}</span></span>
        </div>
      </div>
      <div className="container footer__bottom">
        <p>© {new Date().getFullYear()} {siteName}. Bütün hüquqlar qorunur.</p>
        <nav aria-label="Hüquqi sənədlər">
          <Link href="/privacy-policy">Məxfilik</Link>
          <Link href="/terms">Şərtlər</Link>
          <Link href="/cookie-policy">Kuki siyasəti</Link>
        </nav>
      </div>
    </footer>
  );
}

function socialIcon(label) {
  const normalized = String(label || "").toLocaleLowerCase("az");
  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("whatsapp")) return "whatsapp";
  return "globe";
}

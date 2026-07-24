import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Preloader from "@/components/common/Preloader";
import CookieNotice from "@/components/common/CookieNotice";
import AnalyticsConsent from "@/components/common/AnalyticsConsent";
import JsonLd from "@/components/seo/JsonLd";
import Icon from "@/components/common/Icon";
import { SITE_URL } from "@/constants/site";
import {
  getDepartmentsContent,
  getPublicConfigurationContent
} from "@/services/content";

export default async function PublicLayout({ children }) {
  const [configurationResult, departmentResult] = await Promise.all([
    getPublicConfigurationContent(),
    getDepartmentsContent()
  ]);
  const configuration = configurationResult.configuration;
  const contact = configuration.contact;
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Hospital", "MedicalOrganization"],
    "@id": `${SITE_URL}/#hospital`,
    name: configuration.siteName,
    url: SITE_URL,
    logo: `${SITE_URL}/images/medicare-logo.png`,
    telephone: contact.phone,
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address,
      addressLocality: "Bakı",
      addressCountry: "AZ"
    },
    medicalSpecialty: [
      "Cardiovascular",
      "Neurologic",
      "Pediatric",
      "Surgical",
      "Gynecologic"
    ]
  };

  if (configuration.maintenance) {
    return (
      <main className="statusPage" id="main-content" role="status">
        <div className="statusPage__signal" aria-hidden="true"><span /><span /><span /></div>
        <span className="statusPage__code"><Icon name="cross" size={42} /></span>
        <h1>Saytda planlı yenilənmə aparılır</h1>
        <p>Medicare komandası xidmət məlumatlarını yeniləyir. Təcili əlaqə və qəbul üçün çağrı mərkəzimiz açıqdır.</p>
        <a className="button button--primary" href={contact.phoneHref}>
          <Icon name="phone" size={18} /> {contact.phone}
        </a>
      </main>
    );
  }

  return (
    <>
      <a className="skipLink" href="#main-content">
        Əsas məzmuna keç
      </a>
      <Preloader />
      <Header
        contact={contact}
        navigation={configuration.navigation}
        siteName={configuration.siteName}
      />
      <main id="main-content">{children}</main>
      <Footer
        contact={contact}
        navigation={configuration.footerNavigation}
        socialLinks={configuration.socialLinks}
        departmentItems={departmentResult.items}
        siteName={configuration.siteName}
        tagline={configuration.tagline}
      />
      {configuration.cookieBanner && <CookieNotice />}
      {configuration.analyticsId && (
        <AnalyticsConsent measurementId={configuration.analyticsId} />
      )}
      <JsonLd data={organizationSchema} />
    </>
  );
}

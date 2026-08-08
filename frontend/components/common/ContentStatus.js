import Link from "next/link";
import Icon from "@/components/common/Icon";
import { getPublicConfigurationContent } from "@/services/content";

export async function ContentStatusNotice({ result }) {
  if (!result?.unavailable) return null;
  const { contact } = (await getPublicConfigurationContent()).configuration;

  return (
    <aside className="contentStatus" role="status">
      <span><Icon name="alert" size={21} /></span>
      <div>
        <strong>Canlı məlumatlar müvəqqəti əlçatmazdır</strong>
        <p>
          Bu bölmədə köhnə və ya nümunə məlumat göstərilmir. Qəbul və aktual
          məlumat üçün əlaqə mərkəzi ilə dəqiqləşdirin.
        </p>
      </div>
      <a href={contact.phoneHref}>Zəng et</a>
    </aside>
  );
}

export async function ContentUnavailable({
  title = "Məzmunu hazırda göstərə bilmirik",
  text = "Canlı məlumat xidməti ilə əlaqə yaratmaq mümkün olmadı. Bir qədər sonra yenidən yoxlayın."
}) {
  const { contact } = (await getPublicConfigurationContent()).configuration;

  return (
    <section className="statusPage" role="alert">
      <div className="statusPage__signal" aria-hidden="true"><span /><span /><span /></div>
      <span className="statusPage__code">503</span>
      <h1>{title}</h1>
      <p>{text}</p>
      <div>
        <Link className="button button--primary" href="/">Ana səhifəyə qayıt <Icon name="arrow" size={18} /></Link>
        <a className="button button--outline" href={contact.phoneHref}>Bizə zəng et</a>
      </div>
    </section>
  );
}

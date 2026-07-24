import Link from "next/link";
import Icon from "@/components/common/Icon";

export default function PublicNotFound() {
  return (
    <section className="statusPage">
      <div className="statusPage__signal" aria-hidden="true"><span /><span /><span /></div>
      <span className="statusPage__code">404</span>
      <h1>Axtardığınız səhifə burada deyil</h1>
      <p>Link dəyişmiş və ya səhifə silinmiş ola bilər. Ana səhifədən davam edin və ya sayt üzrə axtarış edin.</p>
      <div><Link className="button button--primary" href="/">Ana səhifəyə qayıt <Icon name="arrow" size={18} /></Link><Link className="button button--outline" href="/search">Saytda axtar</Link></div>
    </section>
  );
}

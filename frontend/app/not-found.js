import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <main className="statusPage">
      <span className="statusPage__code">404</span>
      <h1>Səhifə tapılmadı</h1>
      <p>Axtardığınız ünvan mövcud deyil.</p>
      <Link className="button button--primary" href="/">Ana səhifəyə qayıt</Link>
    </main>
  );
}

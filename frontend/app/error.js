"use client";

import Link from "next/link";
import Icon from "@/components/common/Icon";

export default function ErrorPage({ reset }) {
  return (
    <section className="statusPage" role="alert">
      <div className="statusPage__signal" aria-hidden="true"><span /><span /><span /></div>
      <span className="statusPage__code">500</span>
      <h1>Sorğunu tamamlaya bilmədik</h1>
      <p>Müvəqqəti texniki çətinlik yarandı. Yenidən yoxlaya və ya ana səhifəyə qayıda bilərsiniz.</p>
      <div>
        <button className="button button--primary" type="button" onClick={reset}>Yenidən yoxla <Icon name="arrow" size={18} /></button>
        <Link className="button button--outline" href="/">Ana səhifə</Link>
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/common/Icon";
import styles from "./ServicePriceCatalog.module.css";

function normalize(value) {
  return String(value || "").toLocaleLowerCase("az-AZ").trim();
}

function formatPrice(value, currency) {
  if (value === null || value === undefined || value === "" || Number(value) <= 0) {
    return "Sorğu ilə";
  }
  const amount = new Intl.NumberFormat("az-AZ", {
    minimumFractionDigits: Number(value) % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
  return currency === "AZN" ? amount + " ₼" : amount + " " + currency;
}

export default function ServicePriceCatalog({ services }) {
  const pricedServices = useMemo(
    () => services.filter(
      (service) => service.pricingVisible !== false && service.priceItems?.length
    ),
    [services],
  );
  const [query, setQuery] = useState("");
  const [openServices, setOpenServices] = useState(
    () => new Set(pricedServices.slice(0, 2).map((service) => service.slug)),
  );
  const normalizedQuery = normalize(query);

  const results = useMemo(() => pricedServices.map((service) => {
    const serviceMatches = normalize(service.name).includes(normalizedQuery)
      || normalize(service.departmentName).includes(normalizedQuery);
    const items = normalizedQuery
      ? service.priceItems.filter((item) => (
          serviceMatches
          || normalize(item.name).includes(normalizedQuery)
          || normalize(item.code).includes(normalizedQuery)
          || normalize(item.note).includes(normalizedQuery)
        ))
      : service.priceItems;
    return { service, items };
  }).filter((entry) => entry.items.length), [normalizedQuery, pricedServices]);

  const visiblePriceCount = results.reduce((total, entry) => total + entry.items.length, 0);

  function toggle(slug) {
    setOpenServices((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  return (
    <div className={styles.catalog}>
      <div className={styles.intro}>
        <div>
          <span className="eyebrow">Qiymət kataloqu</span>
          <h2>Xidmət və müayinə qiymətləri</h2>
          <p>Xidmət adını və ya kodunu yazaraq siyahıda sürətli axtarış edin.</p>
        </div>
        <div className={styles.summary}>
          <strong>{visiblePriceCount}</strong>
          <span>{normalizedQuery ? "uyğun nəticə" : "xidmət qiyməti"}</span>
        </div>
      </div>

      <label className={styles.search}>
        <Icon name="search" size={20} />
        <input
          type="search"
          value={query}
          placeholder="Məsələn: EKQ, USM, qan analizi..."
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button type="button" aria-label="Axtarışı təmizlə" onClick={() => setQuery("")}>
            <Icon name="close" size={16} />
          </button>
        )}
      </label>

      {results.length ? (
        <div className={styles.groups}>
          {results.map(({ service, items }) => {
            const isOpen = normalizedQuery || openServices.has(service.slug);
            return (
              <article className={styles.group} key={service.slug}>
                <button
                  className={styles.groupHeader}
                  type="button"
                  aria-expanded={Boolean(isOpen)}
                  onClick={() => toggle(service.slug)}
                >
                  <span className={styles.groupIcon}><Icon name={service.icon || "services"} size={22} /></span>
                  <span className={styles.groupTitle}>
                    <strong>{service.name}</strong>
                    <small>{service.departmentName || "Medicare Hospital"} · {items.length} xidmət</small>
                  </span>
                  <span className={styles.groupPrice}>
                    <small>Başlayan qiymət</small>
                    <strong>{formatPrice(service.priceFrom, service.currency)}</strong>
                  </span>
                  <span className={styles.groupToggle}><Icon name="chevron" size={18} /></span>
                </button>
                {isOpen && (
                  <div className={styles.priceList}>
                    <div className={styles.tableHead}>
                      <span>Kod</span><span>Xidmətin adı</span><span>Qiymət</span>
                    </div>
                    {items.map((item) => (
                      <div className={styles.priceRow} key={item.id}>
                        <span className={styles.code}>{item.code || "—"}</span>
                        <span className={styles.itemName}>
                          <strong>{item.name}</strong>
                          {item.note && <small>{item.note}</small>}
                        </span>
                        <strong className={styles.price}>{formatPrice(item.price, item.currency)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <Icon name="search" size={25} />
          <strong>Uyğun xidmət tapılmadı</strong>
          <p>Axtarış sözünü qısaldın və ya fərqli xidmət adı yoxlayın.</p>
        </div>
      )}

      <p className={styles.notice}>
        <Icon name="alert" size={17} />
        Qiymətlər məlumat xarakterlidir. Xidmət planına görə yekun məbləği əlaqə mərkəzindən dəqiqləşdirə bilərsiniz.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { activityItems, dashboardStats } from "./adminData";
import { ADMIN_DEMO_MODE, adminApi } from "./adminApi";
import { adaptActivity } from "./adminAdapters";
import { Icon } from "./AdminIcons";
import { EmptyState } from "./AdminPrimitives";
import styles from "../../app/admin/admin.module.css";

function StatCard({ item }) {
  return (
    <article className={styles.statCard}>
      <div className={styles.statTop}>
        <span className={`${styles.statIcon} ${styles[`stat${item.tone}`]}`}>
          <Icon name={item.icon} size={21} />
        </span>
        <span aria-hidden="true"><Icon name="activity" size={18} /></span>
      </div>
      <div className={styles.statValue}>{item.value}</div>
      <div className={styles.statBottom}>
        <span>{item.label}</span>
        <small className={styles.neutralChange}>{item.change}</small>
      </div>
    </article>
  );
}

function listFromResponse(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

function activityIcon(type) {
  if (type === "edit") return "edit";
  if (type === "check") return "check";
  if (type === "calendar") return "calendar";
  if (type === "publish") return "upload";
  return "settings";
}

export default function DashboardOverview() {
  const [summary, setSummary] = useState(null);
  const [recentActivity, setRecentActivity] = useState(() =>
    ADMIN_DEMO_MODE ? activityItems : []
  );
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;

    const controller = new AbortController();
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setLoadError(null);
      try {
        const [summaryData, activityData] = await Promise.all([
          adminApi.dashboard.getSummary({}, { signal: controller.signal }),
          adminApi.dashboard.getActivity(
            { limit: 8 },
            { signal: controller.signal }
          )
        ]);
        if (cancelled) return;
        setSummary(summaryData);
        setRecentActivity(listFromResponse(activityData).map(adaptActivity));
      } catch (error) {
        if (
          cancelled ||
          error.name === "AbortError" ||
          error.name === "SessionExpiredError"
        ) {
          return;
        }
        setLoadError(
          error.message || "İdarə panelinin məlumatlarını yükləmək mümkün olmadı."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadKey]);

  const stats = useMemo(() => {
    if (ADMIN_DEMO_MODE) return dashboardStats;
    const counts = summary?.counts || {};
    return [
      {
        label: "Aktiv həkimlər",
        value: String(counts.doctors ?? 0),
        change: "Cari aktiv heyət",
        icon: "doctors",
        tone: "blue"
      },
      {
        label: "Tibbi şöbələr",
        value: String(counts.departments ?? 0),
        change: `${counts.services ?? 0} aktiv xidmət`,
        icon: "departments",
        tone: "navy"
      },
      {
        label: "Dərc olunmuş məqalə",
        value: String(counts.publishedArticles ?? 0),
        change: "Public kontent",
        icon: "articles",
        tone: "red"
      },
      {
        label: "Oxunmamış mesaj",
        value: String(counts.unreadMessages ?? 0),
        change: "Əlaqə mərkəzi",
        icon: "messages",
        tone: "amber"
      }
    ];
  }, [summary]);

  const welcomeDate = ADMIN_DEMO_MODE
    ? "23 iyul, cümə axşamı"
    : new Intl.DateTimeFormat("az-AZ", {
        day: "numeric",
        month: "long",
        weekday: "long"
      }).format(new Date());

  if (loading) {
    return (
      <div
        className={`${styles.dashboard} ${styles.adminLoading}`}
        aria-label="İdarə paneli yüklənir"
        aria-live="polite"
      >
        <div className={styles.loadingHeader}><span /><span /></div>
        <div className={styles.loadingStats}><span /><span /><span /><span /></div>
        <div className={styles.loadingPanel}><span /><span /><span /></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.adminError} role="alert">
        <span><Icon name="warning" size={25} /></span>
        <h1>İdarə paneli yüklənmədi</h1>
        <p>{loadError}</p>
        <div>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Yenidən cəhd et
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <section className={styles.welcomeBar}>
        <div>
          <span className={styles.eyebrow}>{welcomeDate}</span>
          <h1>
            {ADMIN_DEMO_MODE
              ? "Sabahınız xeyir, Nigar xanım"
              : "Medicare idarə paneli"}
          </h1>
          <p>Medicare-də kontent və kommunikasiya üzrə əsas göstəricilər.</p>
        </div>
        <div className={styles.welcomeActions}>
          <Link className={styles.secondaryButton} href="/">
            <Icon name="external" size={17} />
            Sayta bax
          </Link>
          <Link className={styles.primaryButton} href="/admin/messages">
            <Icon name="messages" size={17} />
            Mesajları idarə et
          </Link>
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="Əsas göstəricilər">
        {stats.map((item) => <StatCard item={item} key={item.label} />)}
      </section>

      <section className={styles.dashboardSecondaryGrid}>
        <article
          className={`${styles.panel} ${styles.activityCard} ${styles.activityCardFull}`}
        >
          <div className={styles.panelHeader}>
            <div>
              <h2>Son fəaliyyətlər</h2>
              <p>Komanda və sistem yenilikləri</p>
            </div>
          </div>
          {recentActivity.length ? (
            <ol className={styles.activityList}>
              {recentActivity.map((item, index) => (
                <li key={`${item.actor}-${item.time}-${index}`}>
                  <span
                    className={`${styles.activityMarker} ${styles[`activity${item.type}`]}`}
                  >
                    <Icon name={activityIcon(item.type)} size={14} />
                  </span>
                  <div>
                    <p><strong>{item.actor}</strong> {item.action}</p>
                    <time>{item.time}</time>
                  </div>
                  {index < recentActivity.length - 1 && (
                    <span className={styles.activityLine} />
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              icon="activity"
              title="Fəaliyyət qeydi yoxdur"
              description="Komanda əməliyyatları burada görünəcək."
            />
          )}
        </article>
      </section>

      <section className={styles.quickActions}>
        <div>
          <span className={styles.quickIcon}>
            <Icon name="sparkles" size={20} />
          </span>
          <div>
            <h2>Sürətli əməliyyatlar</h2>
            <p>Ən çox istifadə olunan funksiyalara bir kliklə keçin.</p>
          </div>
        </div>
        <nav aria-label="Sürətli əməliyyatlar">
          <Link href="/admin/doctors/new"><Icon name="doctors" size={18} />Həkim əlavə et</Link>
          <Link href="/admin/articles/new"><Icon name="articles" size={18} />Məqalə yaz</Link>
          <Link href="/admin/content/home"><Icon name="home" size={18} />Ana səhifəni yenilə</Link>
          <Link href="/admin/messages"><Icon name="messages" size={18} />Mesajlara bax</Link>
        </nav>
      </section>
    </div>
  );
}

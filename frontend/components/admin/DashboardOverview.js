"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { activityItems, dashboardStats, upcomingAppointments } from "./adminData";
import { ADMIN_DEMO_MODE, adminApi } from "./adminApi";
import { adaptActivity, adaptAppointment } from "./adminAdapters";
import { Icon } from "./AdminIcons";
import { EmptyState, StatusBadge } from "./AdminPrimitives";
import styles from "../../app/admin/admin.module.css";

const ranges = {
  "7 gün": {
    appointments: [38, 46, 42, 63, 57, 71, 84],
    labels: ["17 İyl", "18 İyl", "19 İyl", "20 İyl", "21 İyl", "22 İyl", "23 İyl"],
    total: "401",
    delta: "+12.8%",
  },
  "30 gün": {
    appointments: [42, 38, 54, 47, 61, 70, 66, 78, 72, 84],
    labels: ["24 İyn", "", "30 İyn", "", "6 İyl", "", "12 İyl", "", "18 İyl", "23 İyl"],
    total: "1 284",
    delta: "+18.4%",
  },
  "3 ay": {
    appointments: [35, 41, 39, 55, 50, 58, 64, 61, 73, 79, 76, 88],
    labels: ["May", "", "", "", "İyn", "", "", "", "İyl", "", "", "23 İyl"],
    total: "3 746",
    delta: "+22.1%",
  },
};

function createLinePoints(values, width = 640, height = 190) {
  const max = 100;
  const xStep = width / (values.length - 1);
  return values.map((value, index) => `${Math.round(index * xStep)},${Math.round(height - (value / max) * height)}`).join(" ");
}

function StatCard({ item }) {
  return (
    <article className={styles.statCard}>
      <div className={styles.statTop}>
        <span className={`${styles.statIcon} ${styles[`stat${item.tone}`]}`}>
          <Icon name={item.icon} size={21} />
        </span>
        <button type="button" aria-label={`${item.label} seçimləri`}>
          <Icon name="more" size={18} />
        </button>
      </div>
      <div className={styles.statValue}>{item.value}</div>
      <div className={styles.statBottom}>
        <span>{item.label}</span>
        <small className={item.trend === "up" ? styles.positiveChange : item.trend === "down" ? styles.urgentChange : styles.neutralChange}>
          {item.trend === "up" && <Icon name="arrowUp" size={12} />}
          {item.change}
        </small>
      </div>
    </article>
  );
}

function listFromResponse(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export default function DashboardOverview() {
  const [range, setRange] = useState("30 gün");
  const [summary, setSummary] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState(() => ADMIN_DEMO_MODE ? upcomingAppointments : []);
  const [recentActivity, setRecentActivity] = useState(() => ADMIN_DEMO_MODE ? activityItems : []);
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
          adminApi.dashboard.getActivity({ limit: 5 }, { signal: controller.signal }),
        ]);
        if (cancelled) return;
        setSummary(summaryData);
        setRecentAppointments(listFromResponse(summaryData?.recentAppointments).map(adaptAppointment));
        setRecentActivity(listFromResponse(activityData).map(adaptActivity));
      } catch (error) {
        if (cancelled || error.name === "AbortError" || error.name === "SessionExpiredError") return;
        setLoadError(error.message || "İdarə panelinin məlumatlarını yükləmək mümkün olmadı.");
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

  const activeRange = ranges[range];
  const linePoints = useMemo(() => createLinePoints(activeRange.appointments), [activeRange]);
  const areaPoints = `0,190 ${linePoints} 640,190`;
  const stats = useMemo(() => {
    if (ADMIN_DEMO_MODE) return dashboardStats;
    const counts = summary?.counts || {};
    return [
      { label: "Aktiv həkimlər", value: String(counts.doctors ?? 0), change: "Cari aktiv heyət", trend: "neutral", icon: "doctors", tone: "blue" },
      { label: "Tibbi şöbələr", value: String(counts.departments ?? 0), change: `${counts.services ?? 0} aktiv xidmət`, trend: "neutral", icon: "departments", tone: "navy" },
      { label: "Yeni sorğular", value: String(counts.newAppointments ?? 0), change: "Cavab gözləyir", trend: "neutral", icon: "calendar", tone: "red" },
      { label: "Oxunmamış mesaj", value: String(counts.unreadMessages ?? 0), change: "Diqqət tələb edir", trend: "down", icon: "messages", tone: "amber" },
    ];
  }, [summary]);
  const welcomeDate = ADMIN_DEMO_MODE
    ? "23 iyul, cümə axşamı"
    : new Intl.DateTimeFormat("az-AZ", { day: "numeric", month: "long", weekday: "long" }).format(new Date());

  if (loading) {
    return (
      <div className={`${styles.dashboard} ${styles.adminLoading}`} aria-label="İdarə paneli yüklənir" aria-live="polite">
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
          <button className={styles.primaryButton} type="button" onClick={() => setReloadKey((value) => value + 1)}>
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
          <h1>{ADMIN_DEMO_MODE ? "Sabahınız xeyir, Nigar xanım" : "Medicare idarə paneli"}</h1>
          <p>Medicare-də bu gün üçün əsas göstəricilər və prioritet işlər.</p>
        </div>
        <div className={styles.welcomeActions}>
          <Link className={styles.secondaryButton} href="/">
            <Icon name="external" size={17} />
            Sayta bax
          </Link>
          <Link className={styles.primaryButton} href="/admin/appointments">
            <Icon name="calendar" size={17} />
            Sorğuları idarə et
          </Link>
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="Əsas göstəricilər">
        {stats.map((item) => <StatCard item={item} key={item.label} />)}
      </section>

      <section className={styles.dashboardMainGrid}>
        <article className={`${styles.panel} ${styles.analyticsPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Qəbul dinamikası</h2>
              <p>Onlayn qəbul sorğularının zaman üzrə dəyişimi</p>
            </div>
            <label className={styles.compactSelect}>
              <span className={styles.srOnly}>Müddət seçin</span>
              <select value={range} onChange={(event) => setRange(event.target.value)}>
                {Object.keys(ranges).map((item) => <option key={item}>{item}</option>)}
              </select>
              <Icon name="chevronDown" size={14} />
            </label>
          </div>

          {ADMIN_DEMO_MODE ? (
            <>
              <div className={styles.chartSummary}>
                <strong>{activeRange.total}</strong>
                <span>ümumi sorğu</span>
                <small><Icon name="arrowUp" size={12} />{activeRange.delta}</small>
                <em>əvvəlki dövrlə müqayisədə</em>
              </div>

              <div className={styles.lineChart} role="img" aria-label={`${range} ərzində qəbul sorğularının artım qrafiki`}>
                <div className={styles.yAxis}>
                  <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
                </div>
                <div className={styles.chartPlot}>
                  <span className={styles.gridLine} /><span className={styles.gridLine} /><span className={styles.gridLine} /><span className={styles.gridLine} /><span className={styles.gridLine} />
                  <svg viewBox="0 0 640 190" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="appointmentArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#d92636" stopOpacity=".2" />
                        <stop offset="1" stopColor="#d92636" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={areaPoints} fill="url(#appointmentArea)" />
                    <polyline points={linePoints} fill="none" stroke="#d92636" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                    {activeRange.appointments.map((value, index) => {
                      const x = (640 / (activeRange.appointments.length - 1)) * index;
                      const y = 190 - (value / 100) * 190;
                      return <circle cx={x} cy={y} r={index === activeRange.appointments.length - 1 ? 5 : 3} fill="#fff" stroke="#d92636" strokeWidth="2.5" key={`${x}-${y}`} />;
                    })}
                  </svg>
                  <div className={styles.xAxis}>
                    {activeRange.labels.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyState icon="activity" title="Dinamika məlumatı yoxdur" description="Dashboard API-si zaman seriyası təqdim etdikdə qəbul dinamikası burada görünəcək." />
          )}
        </article>

        <article className={`${styles.panel} ${styles.sourcePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Sorğu mənbələri</h2>
              <p>Son 30 gün</p>
            </div>
            <button className={styles.panelMenu} type="button" aria-label="Sorğu mənbələri seçimləri">
              <Icon name="more" size={18} />
            </button>
          </div>
          {ADMIN_DEMO_MODE ? (
            <>
              <div className={styles.donutWrap}>
                <div className={styles.donut} role="img" aria-label="Sayt formu 48 faiz, telefon 27 faiz, sosial media 16 faiz, digər 9 faiz">
                  <div><strong>1 284</strong><span>sorğu</span></div>
                </div>
              </div>
              <ul className={styles.sourceLegend}>
                <li><span className={styles.legendRed} /><p>Sayt formu</p><strong>48%</strong><small>616</small></li>
                <li><span className={styles.legendBlue} /><p>Telefon</p><strong>27%</strong><small>347</small></li>
                <li><span className={styles.legendNavy} /><p>Sosial media</p><strong>16%</strong><small>205</small></li>
                <li><span className={styles.legendGray} /><p>Digər</p><strong>9%</strong><small>116</small></li>
              </ul>
            </>
          ) : (
            <EmptyState icon="messages" title="Mənbə bölgüsü yoxdur" description="Dashboard API-si mənbə statistikası təqdim etdikdə bölgü burada görünəcək." />
          )}
        </article>
      </section>

      <section className={styles.dashboardSecondaryGrid}>
        <article className={`${styles.panel} ${styles.appointmentsCard}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2>{ADMIN_DEMO_MODE ? "Bugünkü qəbullar" : "Son qəbul sorğuları"}</h2>
              <p>{recentAppointments.length} {ADMIN_DEMO_MODE ? "planlaşdırılmış görüş" : "son müraciət"}</p>
            </div>
            <Link className={styles.textLink} href="/admin/appointments">
              Hamısına bax <Icon name="chevronRight" size={15} />
            </Link>
          </div>
          {recentAppointments.length ? (
            <div className={styles.dashboardTableWrap}>
              <table className={styles.dashboardTable}>
                <thead>
                  <tr><th>Saat</th><th>Pasiyent</th><th>Həkim / şöbə</th><th>Status</th><th><span className={styles.srOnly}>Əməl</span></th></tr>
                </thead>
                <tbody>
                  {recentAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td><strong className={styles.timeCell}>{appointment.time}</strong></td>
                      <td><div className={styles.tablePerson}><span>{appointment.patient.split(" ").map((part) => part[0]).join("")}</span><div><strong>{appointment.patient}</strong><small>{appointment.id}</small></div></div></td>
                      <td><strong>{appointment.doctor}</strong><small>{appointment.department}</small></td>
                      <td><StatusBadge>{appointment.status}</StatusBadge></td>
                      <td><Link className={styles.tableArrow} href="/admin/appointments" aria-label={`${appointment.patient} qəbuluna bax`}><Icon name="chevronRight" size={16} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="calendar" title="Qəbul sorğusu yoxdur" description="Yeni qəbul müraciətləri daxil olduqda burada görünəcək." />
          )}
        </article>

        <article className={`${styles.panel} ${styles.activityCard}`}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Son fəaliyyətlər</h2>
              <p>Komanda və sistem yenilikləri</p>
            </div>
            <button className={styles.panelMenu} type="button" aria-label="Fəaliyyət seçimləri"><Icon name="more" size={18} /></button>
          </div>
          {recentActivity.length ? (
            <ol className={styles.activityList}>
              {recentActivity.map((item, index) => (
                <li key={`${item.actor}-${item.time}-${index}`}>
                  <span className={`${styles.activityMarker} ${styles[`activity${item.type}`]}`}>
                    <Icon name={item.type === "edit" ? "edit" : item.type === "check" ? "check" : item.type === "calendar" ? "calendar" : item.type === "publish" ? "upload" : "settings"} size={14} />
                  </span>
                  <div>
                    <p><strong>{item.actor}</strong> {item.action}</p>
                    <time>{item.time}</time>
                  </div>
                  {index < recentActivity.length - 1 && <span className={styles.activityLine} />}
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon="activity" title="Fəaliyyət qeydi yoxdur" description="Komanda əməliyyatları burada görünəcək." />
          )}
        </article>
      </section>

      <section className={styles.quickActions}>
        <div>
          <span className={styles.quickIcon}><Icon name="sparkles" size={20} /></span>
          <div><h2>Sürətli əməliyyatlar</h2><p>Ən çox istifadə olunan funksiyalara bir kliklə keçin.</p></div>
        </div>
        <nav aria-label="Sürətli əməliyyatlar">
          <Link href="/admin/doctors/new"><Icon name="doctors" size={18} />Həkim əlavə et</Link>
          <Link href="/admin/articles/new"><Icon name="articles" size={18} />Məqalə yaz</Link>
          <Link href="/admin/content/home"><Icon name="home" size={18} />Ana səhifəni yenilə</Link>
          <Link href="/admin/users/new"><Icon name="users" size={18} />İstifadəçi yarat</Link>
        </nav>
      </section>
    </div>
  );
}

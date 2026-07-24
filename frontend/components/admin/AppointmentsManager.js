"use client";

import { useEffect, useMemo, useState } from "react";
import { appointmentRows } from "./adminData";
import { ADMIN_DEMO_MODE, adminApi } from "./adminApi";
import { adaptAppointment, toBackendStatus } from "./adminAdapters";
import { Icon } from "./AdminIcons";
import { EmptyState, PageHeader, StatusBadge, Toast } from "./AdminPrimitives";
import styles from "../../app/admin/admin.module.css";

const demoStatusOptions = ["Yeni", "Gözləyir", "Təsdiqlənib", "Tamamlanıb", "Ləğv edilib"];
const liveStatusOptions = ["Yeni", "Təsdiqlənib", "Tamamlanıb", "Ləğv edilib"];
const statusOptions = ADMIN_DEMO_MODE ? demoStatusOptions : liveStatusOptions;
const statusTabs = ADMIN_DEMO_MODE
  ? ["Hamısı", "Yeni", "Gözləyir", "Təsdiqlənib", "Ləğv edilib"]
  : ["Hamısı", ...liveStatusOptions];

function listFromResponse(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export default function AppointmentsManager() {
  const [appointments, setAppointments] = useState(() => ADMIN_DEMO_MODE ? appointmentRows : []);
  const [activeStatus, setActiveStatus] = useState("Hamısı");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState("list");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;

    const controller = new AbortController();
    let cancelled = false;

    async function loadAppointments() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await adminApi.appointments.list({ limit: 100 }, { signal: controller.signal });
        if (cancelled) return;
        setAppointments(listFromResponse(data).map(adaptAppointment));
        setSelected(null);
      } catch (error) {
        if (cancelled || error.name === "AbortError" || error.name === "SessionExpiredError") return;
        setLoadError(error.message || "Qəbul sorğularını yükləmək mümkün olmadı.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAppointments();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadKey]);

  const filtered = useMemo(
    () => appointments.filter((item) => {
      const text = `${item.patient} ${item.phone} ${item.doctor} ${item.department} ${item.id}`.toLocaleLowerCase("az");
      return text.includes(query.toLocaleLowerCase("az")) && (activeStatus === "Hamısı" || item.status === activeStatus);
    }),
    [activeStatus, appointments, query],
  );

  const appointmentStats = useMemo(() => {
    if (ADMIN_DEMO_MODE) {
      return [
        { tone: "red", icon: "calendar", value: "12", label: "Bu gün", detail: "+3 dünənə görə" },
        { tone: "blue", icon: "clock", value: "7", label: "Gözləyir", detail: "Diqqət tələb edir" },
        { tone: "navy", icon: "check", value: "82%", label: "Təsdiq faizi", detail: "+4.2% bu ay" },
        { tone: "amber", icon: "activity", value: "14 dəq", label: "Orta cavab", detail: "Hədəf: 20 dəq" },
      ];
    }

    const newCount = appointments.filter((item) => item.status === "Yeni").length;
    const confirmedCount = appointments.filter((item) => item.status === "Təsdiqlənib").length;
    const completedCount = appointments.filter((item) => item.status === "Tamamlanıb").length;
    const confirmationRate = appointments.length
      ? Math.round(((confirmedCount + completedCount) / appointments.length) * 100)
      : 0;
    return [
      { tone: "red", icon: "calendar", value: String(appointments.length), label: "Ümumi sorğu", detail: "Cari siyahıda" },
      { tone: "blue", icon: "clock", value: String(newCount), label: "Yeni", detail: "Diqqət tələb edir" },
      { tone: "navy", icon: "check", value: `${confirmationRate}%`, label: "Təsdiq faizi", detail: `${confirmedCount} təsdiqlənib` },
      { tone: "amber", icon: "activity", value: String(completedCount), label: "Tamamlanıb", detail: "Bağlanmış qəbullar" },
    ];
  }, [appointments]);

  function openAppointment(item) {
    setSelected(item);
    setNote(item.adminNotes || "");
  }

  async function persistAppointment(id, status, adminNotes, successMessage) {
    if (ADMIN_DEMO_MODE) {
      setAppointments((current) => current.map((item) => item.id === id ? { ...item, status, adminNotes } : item));
      setSelected((current) => current?.id === id ? { ...current, status, adminNotes } : current);
      setToast({ tone: "success", message: successMessage });
      return;
    }

    const controller = new AbortController();
    setSaving(true);
    try {
      const data = await adminApi.appointments.update(id, {
        status: toBackendStatus(status),
        adminNotes: adminNotes.trim() || null,
      }, { signal: controller.signal });
      const updated = adaptAppointment(data);
      setAppointments((current) => current.map((item) => item.id === id ? updated : item));
      setSelected((current) => current?.id === id ? updated : current);
      setNote(updated.adminNotes || "");
      setToast({ tone: "success", message: successMessage });
    } catch (error) {
      if (error.name === "AbortError" || error.name === "SessionExpiredError") return;
      setToast({ tone: "warning", message: error.message || "Dəyişikliyi yadda saxlamaq mümkün olmadı." });
    } finally {
      setSaving(false);
    }
  }

  function updateStatus(id, status) {
    persistAppointment(
      id,
      status,
      note,
      `${id} sorğusunun statusu “${status}” olaraq yeniləndi.`,
    );
  }

  function saveNote() {
    if (ADMIN_DEMO_MODE) {
      setToast({ tone: "success", message: "Daxili qeyd yadda saxlanıldı." });
      setNote("");
      return;
    }
    persistAppointment(selected.id, selected.status, note, "Daxili qeyd yadda saxlanıldı.");
  }

  function exportAppointments() {
    const content = "\uFEFF" + [
      ["Sorğu", "Pasiyent", "Telefon", "Həkim", "Şöbə", "Tarix", "Saat", "Status"],
      ...filtered.map((item) => [item.id, item.patient, item.phone, item.doctor, item.department, item.date, item.time, item.status]),
    ].map((row) => row.map(toSafeCsvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "medicare-qebul-sorgulari.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setToast({ tone: "success", message: "Qəbul siyahısı CSV formatında hazırlandı." });
  }

  return (
    <div className={styles.appointmentsPage}>
      <PageHeader
        eyebrow="Pasiyent xidmətləri"
        title="Qəbul sorğuları"
        description="Onlayn müraciətləri yoxlayın, təsdiqləyin və komandanın iş axınını izləyin."
        actions={(
          <button className={styles.secondaryButton} type="button" onClick={exportAppointments}>
            <Icon name="download" size={17} />İxrac et
          </button>
        )}
      />

      <section className={styles.appointmentStats} aria-label="Qəbul sorğusu statistikası">
        {appointmentStats.map((item) => (
          <div key={item.label}>
            <span className={styles[`stat${item.tone}`]}><Icon name={item.icon} size={19} /></span>
            <p><strong>{item.value}</strong><small>{item.label}</small></p>
            <em>{item.detail}</em>
          </div>
        ))}
      </section>

      <section className={styles.appointmentWorkspace}>
        <div className={styles.appointmentToolbar}>
          <div className={styles.statusTabs} role="tablist" aria-label="Status filteri">
            {statusTabs.map((status) => (
              <button
                key={status}
                className={activeStatus === status ? styles.statusTabActive : ""}
                type="button"
                role="tab"
                aria-selected={activeStatus === status}
                onClick={() => setActiveStatus(status)}
              >
                {status}
                <span>{status === "Hamısı" ? appointments.length : appointments.filter((item) => item.status === status).length}</span>
              </button>
            ))}
          </div>
          <div className={styles.appointmentTools}>
            <label className={styles.tableSearch}>
              <Icon name="search" size={17} />
              <span className={styles.srOnly}>Qəbul sorğularında axtarış</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pasiyent, həkim, ID..." />
            </label>
            {ADMIN_DEMO_MODE && (
              <div className={styles.viewSwitch} role="group" aria-label="Görünüş">
                <button className={view === "list" ? styles.viewActive : ""} type="button" aria-label="Siyahı görünüşü" onClick={() => setView("list")}><Icon name="content" size={17} /></button>
                <button className={view === "calendar" ? styles.viewActive : ""} type="button" aria-label="Gün görünüşü" onClick={() => setView("calendar")}><Icon name="calendar" size={17} /></button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className={styles.adminLoading} aria-label="Qəbul sorğuları yüklənir" aria-live="polite">
            <div className={styles.loadingPanel}><span /><span /><span /><span /></div>
          </div>
        ) : loadError ? (
          <EmptyState
            icon="warning"
            title="Qəbul sorğuları yüklənmədi"
            description={loadError}
            action={<button className={styles.secondaryButton} type="button" onClick={() => setReloadKey((value) => value + 1)}>Yenidən cəhd et</button>}
          />
        ) : filtered.length ? view === "list" ? (
          <div className={styles.appointmentTableWrap}>
            <table className={styles.appointmentTable}>
              <thead><tr><th>Sorğu / tarix</th><th>Pasiyent</th><th>Həkim və şöbə</th><th>Filial</th><th>Status</th><th><span className={styles.srOnly}>Əməl</span></th></tr></thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} onClick={() => openAppointment(item)}>
                    <td data-label="Sorğu / tarix"><strong>{item.id}</strong><small>{item.date} · {item.time}</small></td>
                    <td data-label="Pasiyent"><div className={styles.patientCell}><span>{item.patient.split(" ").map((part) => part[0]).join("")}</span><div><strong>{item.patient}</strong><small>{item.phone}</small></div></div></td>
                    <td data-label="Həkim və şöbə"><strong>{item.doctor}</strong><small>{item.department}</small></td>
                    <td data-label="Filial">{item.branch}</td>
                    <td data-label="Status"><StatusBadge>{item.status}</StatusBadge></td>
                    <td><button type="button" aria-label={`${item.id} sorğusuna bax`} onClick={(event) => { event.stopPropagation(); openAppointment(item); }}><Icon name="chevronRight" size={17} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.daySchedule}>
            <div className={styles.scheduleHead}>
              <button type="button" aria-label="Əvvəlki gün"><Icon name="chevronRight" size={17} /></button>
              <div><strong>23 iyul 2026</strong><small>Cümə axşamı · {filtered.length} qəbul</small></div>
              <button type="button" aria-label="Növbəti gün"><Icon name="chevronRight" size={17} /></button>
            </div>
            <div className={styles.scheduleGrid}>
              {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map((hour) => {
                const items = filtered.filter((item) => item.time.startsWith(hour.slice(0, 2)));
                return (
                  <div className={styles.scheduleRow} key={hour}>
                    <time>{hour}</time>
                    <div>
                      {items.map((item) => (
                        <button key={item.id} type="button" onClick={() => openAppointment(item)}>
                          <span>{item.time}</span><strong>{item.patient}</strong><small>{item.doctor} · {item.department}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            title={appointments.length ? "Sorğu tapılmadı" : "Qəbul sorğusu yoxdur"}
            description={appointments.length ? "Seçilmiş filterlərə uyğun qəbul sorğusu yoxdur." : "Yeni qəbul sorğuları daxil olduqda burada görünəcək."}
            action={appointments.length ? <button className={styles.secondaryButton} type="button" onClick={() => { setQuery(""); setActiveStatus("Hamısı"); }}>Filterləri sıfırla</button> : undefined}
          />
        )}

        {!loading && !loadError && (
          <div className={styles.tableFooter}>
            <p>{filtered.length} sorğu göstərilir</p>
            <span>Son yenilənmə: indi</span>
          </div>
        )}
      </section>

      {selected && (
        <div className={styles.drawerLayer} role="presentation" onMouseDown={() => setSelected(null)}>
          <aside
            className={styles.detailDrawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.drawerHeader}>
              <div><span>Qəbul sorğusu</span><h2 id="appointment-title">{selected.id}</h2></div>
              <button type="button" aria-label="Detalları bağla" onClick={() => setSelected(null)}><Icon name="close" size={20} /></button>
            </div>
            <div className={styles.drawerBody}>
              <div className={styles.requestStatusRow}>
                <StatusBadge>{selected.status}</StatusBadge>
                <small>{selected.created} göndərilib</small>
              </div>
              <section className={styles.patientSummary}>
                <span>{selected.patient.split(" ").map((part) => part[0]).join("")}</span>
                <div><h3>{selected.patient}</h3><p>Yeni pasiyent</p></div>
              </section>
              <section className={styles.detailSection}>
                <h3>Əlaqə məlumatları</h3>
                <a href={`tel:${selected.phone.replaceAll(" ", "")}`}><Icon name="phone" size={17} /><span><small>Telefon</small><strong>{selected.phone}</strong></span></a>
                <a href={`mailto:${selected.email}`}><Icon name="mail" size={17} /><span><small>E-mail</small><strong>{selected.email}</strong></span></a>
              </section>
              <section className={styles.detailSection}>
                <h3>Qəbul məlumatları</h3>
                <dl>
                  <div><dt>Şöbə</dt><dd>{selected.department}</dd></div>
                  <div><dt>Həkim</dt><dd>{selected.doctor}</dd></div>
                  <div><dt>Tarix və saat</dt><dd>{selected.date}, {selected.time}</dd></div>
                  <div><dt>Filial</dt><dd>{selected.branch}</dd></div>
                </dl>
              </section>
              <section className={styles.detailSection}>
                <h3>Pasiyentin qeydi</h3>
                <blockquote>{selected.note}</blockquote>
              </section>
              <section className={styles.internalNote}>
                <label htmlFor="internal-note">Daxili qeyd</label>
                <textarea id="internal-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Yalnız komanda üçün görünən qeyd..." />
              </section>
            </div>
            <div className={styles.drawerFooter}>
              <label>
                <span>Statusu dəyiş</span>
                <select disabled={saving} value={selected.status} onChange={(event) => updateStatus(selected.id, event.target.value)}>
                  {statusOptions.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <button className={styles.primaryButton} disabled={saving} type="button" onClick={saveNote}>
                <Icon name="check" size={17} />{saving ? "Yadda saxlanır..." : "Yadda saxla"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function toSafeCsvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

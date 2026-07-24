"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./AdminIcons";
import { ADMIN_DEMO_MODE, adminApi } from "./adminApi";
import { normalizeAdminError } from "./adminAdapters";
import { AdminAsyncState, PageHeader, Toast } from "./AdminPrimitives";
import styles from "../../app/admin/admin.module.css";

const tabs = [
  { id: "general", label: "Ümumi", icon: "settings" },
  { id: "contact", label: "Əlaqə", icon: "phone" },
  { id: "seo", label: "SEO", icon: "search" },
  { id: "integrations", label: "İnteqrasiyalar", icon: "external" },
  { id: "security", label: "Təhlükəsizlik", icon: "lock" },
];

const settingDescriptors = {
  general: {
    key: "site.identity",
    group: "general",
    label: "Saytın ümumi parametrləri",
    fields: ["siteName", "tagline", "locale", "timezone", "dateFormat", "maintenance", "indexing", "cookieBanner"],
  },
  contact: {
    key: "contact",
    group: "contact",
    label: "Əlaqə məlumatları",
    fields: ["phone", "emergency", "email", "address", "workHours"],
  },
  seo: {
    key: "seo.default",
    group: "seo",
    label: "Standart SEO parametrləri",
    fields: ["seoTitle", "seoDescription", "canonical"],
  },
  integrations: {
    key: "integrations.public",
    group: "integrations",
    label: "Public inteqrasiya identifikatorları",
    fields: ["analyticsId"],
  },
  security: {
    key: "admin.security.preferences",
    group: "security",
    label: "Admin təhlükəsizlik seçimləri",
    fields: ["auditLog", "sessionTimeout", "loginAlerts"],
  },
};

function valuesForDescriptor(settings, descriptor) {
  return Object.fromEntries(descriptor.fields.map((field) => [field, settings[field]]));
}

function ToggleRow({ title, description, checked, onChange, disabled = false }) {
  return (
    <div className={styles.settingsToggle}>
      <div><strong>{title}</strong><p>{description}</p></div>
      <label className={styles.switch}>
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
        <span />
      </label>
    </div>
  );
}

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState("general");
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({
    siteName: "Medicare Hospital",
    tagline: "Sağlamlığınız bizim dəyərimizdir",
    locale: "az",
    timezone: "Asia/Baku",
    dateFormat: "DD.MM.YYYY",
    phone: "+994 12 450 32 91",
    emergency: "103",
    email: "official@medicarehospital.az",
    address: "Sabunçu qəsəbəsi, Əslidar Məmmədəliyev küçəsi 5, Bakı",
    seoTitle: "Medicare Hospital — Müasir tibbi xidmət",
    seoDescription: "Medicare Hospital-da peşəkar həkimlər, müasir diaqnostika və pasiyent yönümlü tibbi xidmət.",
    canonical: "https://medicarehospital.az",
    analyticsId: "",
    mapsKey: "",
    smtpHost: "",
    maintenance: false,
    indexing: true,
    cookieBanner: true,
    auditLog: true,
    sessionTimeout: "30",
    loginAlerts: true,
    workHours: "Bazar ertəsi – Şənbə, 08:00–20:00",
  });
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;
    const controller = new AbortController();

    async function loadSettings() {
      setLoading(true);
      setError("");
      try {
        const items = await adminApi.settings.list({ limit: 100 }, { signal: controller.signal });
        if (controller.signal.aborted) return;
        const byKey = Object.fromEntries(items.map((item) => [item.key, item]));
        const mergedValues = {};
        Object.values(settingDescriptors).forEach((descriptor) => {
          const value = byKey[descriptor.key]?.value;
          if (value && typeof value === "object" && !Array.isArray(value)) Object.assign(mergedValues, value);
        });
        if (byKey.contact?.value?.emergencyPhone) mergedValues.emergency = byKey.contact.value.emergencyPhone;
        setRecords(byKey);
        setSettings((current) => ({ ...current, ...mergedValues }));
      } catch (requestError) {
        if (!controller.signal.aborted) setError(normalizeAdminError(requestError, "Parametrləri yükləmək mümkün olmadı."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadSettings();
    return () => controller.abort();
  }, [reloadKey]);

  function update(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save(event) {
    event.preventDefault();
    if (!ADMIN_DEMO_MODE && activeTab === "security") {
      setToast({ tone: "warning", message: "Auth təhlükəsizlik qaydaları server konfiqurasiyasından idarə olunur." });
      return;
    }
    setSaving(true);
    try {
      if (!ADMIN_DEMO_MODE) {
        const descriptor = settingDescriptors[activeTab];
        const value = valuesForDescriptor(settings, descriptor);
        if (activeTab === "contact") {
          value.emergencyPhone = value.emergency;
          delete value.emergency;
        }
        const existing = records[descriptor.key];
        const saved = existing
          ? await adminApi.settings.update(existing.id, { value })
          : await adminApi.settings.create({
            key: descriptor.key,
            group: descriptor.group,
            label: descriptor.label,
            isPublic: ["general", "contact", "seo", "integrations"].includes(activeTab),
            value,
          });
        setRecords((current) => ({ ...current, [saved.key]: saved }));
      }
      setToast({ tone: "success", message: "Parametrlər uğurla yadda saxlanıldı." });
    } catch (requestError) {
      setToast({ tone: "warning", message: normalizeAdminError(requestError, "Parametrləri yadda saxlamaq mümkün olmadı.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.settingsPage}>
      <PageHeader
        eyebrow="Sistem konfiqurasiyası"
        title="Parametrlər"
        description="Saytın ümumi məlumatlarını, inteqrasiyalarını və təhlükəsizlik qaydalarını idarə edin."
      />

      {loading ? (
        <AdminAsyncState type="loading" title="Parametrlər yüklənir" />
      ) : error ? (
        <AdminAsyncState type="error" description={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : <div className={styles.settingsLayout}>
        <aside className={styles.settingsNav}>
          <p>Parametrlər</p>
          <nav aria-label="Parametr bölmələri">
            {tabs.map((tab) => (
              <button className={activeTab === tab.id ? styles.settingsNavActive : ""} type="button" key={tab.id} onClick={() => setActiveTab(tab.id)}>
                <Icon name={tab.icon} size={18} />{tab.label}<Icon name="chevronRight" size={15} />
              </button>
            ))}
          </nav>
          <div className={styles.settingsHelp}>
            <span><Icon name="info" size={19} /></span>
            <h3>Kömək lazımdır?</h3>
            <p>Texniki dəyişikliklər üçün sistem administratoru ilə əlaqə saxlayın.</p>
            <a href="mailto:official@medicarehospital.az">Dəstəyə yaz</a>
          </div>
        </aside>

        <form className={styles.settingsForm} onSubmit={save}>
          {activeTab === "general" && (
            <>
              <section className={styles.settingsSection}>
                <div className={styles.settingsSectionHead}><div><h2>Sayt məlumatları</h2><p>Brend adı və əsas sistem parametrləri.</p></div><span><Icon name="settings" size={19} /></span></div>
                <div className={styles.settingsFields}>
                  <div className={styles.formField}><label htmlFor="site-name">Sayt adı</label><input id="site-name" value={settings.siteName} onChange={(event) => update("siteName", event.target.value)} /></div>
                  <div className={styles.formField}><label htmlFor="tagline">Sloqan</label><input id="tagline" value={settings.tagline} onChange={(event) => update("tagline", event.target.value)} /></div>
                  <div className={`${styles.formField} ${styles.fieldHalf}`}><label htmlFor="locale">Əsas dil</label><div className={styles.selectWrap}><select id="locale" value={settings.locale} onChange={(event) => update("locale", event.target.value)}><option value="az">Azərbaycan dili</option><option value="en">English</option><option value="ru">Русский</option></select><Icon name="chevronDown" size={15} /></div></div>
                  <div className={`${styles.formField} ${styles.fieldHalf}`}><label htmlFor="timezone">Saat qurşağı</label><div className={styles.selectWrap}><select id="timezone" value={settings.timezone} onChange={(event) => update("timezone", event.target.value)}><option>Asia/Baku</option><option>Europe/Istanbul</option><option>UTC</option></select><Icon name="chevronDown" size={15} /></div></div>
                  <div className={`${styles.formField} ${styles.fieldHalf}`}><label htmlFor="date-format">Tarix formatı</label><div className={styles.selectWrap}><select id="date-format" value={settings.dateFormat} onChange={(event) => update("dateFormat", event.target.value)}><option>DD.MM.YYYY</option><option>YYYY-MM-DD</option><option>DD/MM/YYYY</option></select><Icon name="chevronDown" size={15} /></div></div>
                </div>
              </section>
              <section className={styles.settingsSection}>
                <div className={styles.settingsSectionHead}><div><h2>Sayt rejimi</h2><p>Public görünmə və hüquqi bildirişlər.</p></div><span><Icon name="eye" size={19} /></span></div>
                <ToggleRow title="Axtarış motoru indeksləməsi" description="Sitemap və public səhifələr axtarış motorları üçün açıq olsun." checked={settings.indexing} onChange={(value) => update("indexing", value)} />
                <ToggleRow title="Cookie razılığı bildirişi" description="İlk ziyarətdə məxfilik seçimlərini göstər." checked={settings.cookieBanner} onChange={(value) => update("cookieBanner", value)} />
                <ToggleRow title="Texniki xidmət rejimi" description="Aktiv olduqda public sayt texniki xidmət ekranı göstərir; admin panel ayrıca açıq qalır." checked={settings.maintenance} onChange={(value) => update("maintenance", value)} />
              </section>
            </>
          )}

          {activeTab === "contact" && (
            <section className={styles.settingsSection}>
              <div className={styles.settingsSectionHead}><div><h2>Əsas əlaqə məlumatları</h2><p>Header, footer və əlaqə səhifəsində istifadə olunur.</p></div><span><Icon name="phone" size={19} /></span></div>
              <div className={styles.settingsFields}>
                <div className={`${styles.formField} ${styles.fieldHalf}`}><label htmlFor="main-phone">Əsas telefon</label><input id="main-phone" value={settings.phone} onChange={(event) => update("phone", event.target.value)} /></div>
                <div className={`${styles.formField} ${styles.fieldHalf}`}><label htmlFor="emergency">Təcili yardım</label><input id="emergency" value={settings.emergency} onChange={(event) => update("emergency", event.target.value)} /></div>
                <div className={styles.formField}><label htmlFor="main-email">Əsas e-mail</label><input id="main-email" type="email" value={settings.email} onChange={(event) => update("email", event.target.value)} /></div>
                <div className={styles.formField}><label htmlFor="main-address">Hüquqi ünvan</label><textarea id="main-address" rows={3} value={settings.address} onChange={(event) => update("address", event.target.value)} /></div>
                <div className={styles.formField}><label htmlFor="work-hours">Ümumi iş saatları</label><input id="work-hours" value={settings.workHours} onChange={(event) => update("workHours", event.target.value)} /></div>
              </div>
              <div className={styles.settingsInfo}><Icon name="info" size={17} /><p>Filiala xüsusi məlumatları <Link href="/admin/content/branches">Filiallar</Link> modulundan idarə edə bilərsiniz.</p></div>
            </section>
          )}

          {activeTab === "seo" && (
            <>
              <section className={styles.settingsSection}>
                <div className={styles.settingsSectionHead}><div><h2>Qlobal SEO</h2><p>Səhifəyə xüsusi metadata olmadıqda istifadə edilən standartlar.</p></div><span><Icon name="search" size={19} /></span></div>
                <div className={styles.settingsFields}>
                  <div className={styles.formField}><label htmlFor="seo-title">Standart meta başlıq</label><input id="seo-title" value={settings.seoTitle} maxLength={60} onChange={(event) => update("seoTitle", event.target.value)} /><div className={styles.fieldMeta}><span>Tövsiyə: 50–60 simvol</span><small>{settings.seoTitle.length}/60</small></div></div>
                  <div className={styles.formField}><label htmlFor="seo-description">Standart meta təsvir</label><textarea id="seo-description" rows={4} value={settings.seoDescription} maxLength={160} onChange={(event) => update("seoDescription", event.target.value)} /><div className={styles.fieldMeta}><span>Tövsiyə: 140–160 simvol</span><small>{settings.seoDescription.length}/160</small></div></div>
                  <div className={styles.formField}><label htmlFor="canonical">Canonical domen</label><input id="canonical" type="url" value={settings.canonical} onChange={(event) => update("canonical", event.target.value)} /></div>
                </div>
              </section>
              <section className={styles.settingsSection}>
                <div className={styles.settingsSectionHead}><div><h2>Sosial paylaşım</h2><p>Open Graph və Twitter önizləməsi.</p></div><span><Icon name="external" size={19} /></span></div>
                <div className={styles.socialPreview}>
                  <div><Icon name="image" size={26} /><span>Standart paylaşım şəkli<small>{ADMIN_DEMO_MODE ? "1200×630 px · JPG, PNG və ya WebP" : "Bu parametr üçün media seçimi backend müqaviləsində yoxdur."}</small></span><button type="button" disabled={!ADMIN_DEMO_MODE} onClick={() => setToast({ tone: "success", message: "Media seçim interfeysi hazırdır." })}>Media seç</button></div>
                  <section><span>medicarehospital.az</span><strong>{settings.seoTitle}</strong><p>{settings.seoDescription}</p></section>
                </div>
              </section>
            </>
          )}

          {activeTab === "integrations" && (
            <section className={styles.settingsSection}>
              <div className={styles.settingsSectionHead}><div><h2>Xarici inteqrasiyalar</h2><p>Analitika, xəritə və e-mail servislərinin təhlükəsiz konfiqurasiyası.</p></div><span><Icon name="external" size={19} /></span></div>
              <div className={styles.integrationList}>
                <div className={styles.integrationItem}>
                  <span className={styles.integrationIcon}>GA</span>
                  <div><strong>Google Analytics 4</strong><p>Sayt trafiki və istifadəçi davranışı analitikası.</p><input aria-label="Google Analytics Measurement ID" value={settings.analyticsId} onChange={(event) => update("analyticsId", event.target.value)} placeholder="G-XXXXXXXXXX" /></div>
                  <StatusDot connected={Boolean(settings.analyticsId)} />
                </div>
                <div className={styles.integrationItem}>
                  <span className={styles.integrationIcon}><Icon name="departments" size={20} /></span>
                  <div><strong>Xəritə servisi</strong><p>Filial xəritələri və istiqamət funksiyası üçün server environment açarı.</p><input aria-label="Xəritə servisi açarı" type="password" value={settings.mapsKey} disabled={!ADMIN_DEMO_MODE} onChange={(event) => update("mapsKey", event.target.value)} placeholder="Backend environment-dan idarə olunur" autoComplete="off" /></div>
                  <StatusDot connected={Boolean(settings.mapsKey)} />
                </div>
                <div className={styles.integrationItem}>
                  <span className={styles.integrationIcon}><Icon name="mail" size={20} /></span>
                  <div><strong>SMTP e-mail</strong><p>Forma bildirişləri və sistem məktubları server konfiqurasiyasından idarə olunur.</p><input aria-label="SMTP host" value={settings.smtpHost} disabled={!ADMIN_DEMO_MODE} onChange={(event) => update("smtpHost", event.target.value)} placeholder="Backend environment-dan idarə olunur" /></div>
                  <StatusDot connected={Boolean(settings.smtpHost)} />
                </div>
              </div>
              <div className={styles.secretNotice}><Icon name="lock" size={17} /><p>Secret və API açarları frontend kodunda saxlanmır. Xəritə və SMTP məlumatları yalnız server environment konfiqurasiyasından idarə olunur.</p></div>
            </section>
          )}

          {activeTab === "security" && (
            <>
              <section className={styles.settingsSection}>
                <div className={styles.settingsSectionHead}><div><h2>Giriş təhlükəsizliyi</h2><p>{ADMIN_DEMO_MODE ? "Admin sessiyaları və hesab qorunması." : "Bu qaydalar auth backend və server environment konfiqurasiyasından idarə olunur."}</p></div><span><Icon name="lock" size={19} /></span></div>
                <ToggleRow disabled={!ADMIN_DEMO_MODE} title="Yeni giriş bildirişləri" description={ADMIN_DEMO_MODE ? "Naməlum cihazdan giriş olduqda hesab sahibinə e-mail göndər." : "Backend-də giriş bildirişi endpoint-i olmadığı üçün bu seçim dəyişdirilmir."} checked={settings.loginAlerts} onChange={(value) => update("loginAlerts", value)} />
                <ToggleRow disabled={!ADMIN_DEMO_MODE} title="Audit jurnalını aktiv saxla" description={ADMIN_DEMO_MODE ? "Məzmun və sistem dəyişikliklərini istifadəçi üzrə qeyd et." : "Audit qeydləri backend tərəfindən avtomatik yaradılır və bu ekrandan söndürülmür."} checked={settings.auditLog} onChange={(value) => update("auditLog", value)} />
                <div className={styles.sessionRow}><div><strong>Sessiya müddəti</strong><p>{ADMIN_DEMO_MODE ? "Aktivlik olmadıqda avtomatik çıxış vaxtı." : "Access və refresh token müddətləri server konfiqurasiyasından gəlir."}</p></div><div className={styles.selectWrap}><select disabled={!ADMIN_DEMO_MODE} value={settings.sessionTimeout} onChange={(event) => update("sessionTimeout", event.target.value)}><option value="15">15 dəqiqə</option><option value="30">30 dəqiqə</option><option value="60">1 saat</option><option value="120">2 saat</option></select><Icon name="chevronDown" size={14} /></div></div>
              </section>
              <section className={`${styles.settingsSection} ${styles.securityAudit}`}>
                <div className={styles.settingsSectionHead}><div><h2>Təhlükəsizlik vəziyyəti</h2><p>Backend-də aktiv olan qoruma mexanizmləri.</p></div><span className={styles.securityScore}>{ADMIN_DEMO_MODE ? "92" : "API"}</span></div>
                <ul>
                  <li><span><Icon name="check" size={14} /></span><div><strong>HTTPS və təhlükəsiz başlıqlar</strong><small>Düzgün konfiqurasiya olunub</small></div></li>
                  <li><span><Icon name="check" size={14} /></span><div><strong>Rate limiting və brute-force qorunması</strong><small>Auth endpoint-ləri üçün aktivdir</small></div></li>
                  <li><span><Icon name="check" size={14} /></span><div><strong>Rotasiya olunan refresh sessiyaları</strong><small>HttpOnly cookie və reuse aşkarlanması aktivdir</small></div></li>
                </ul>
              </section>
            </>
          )}

          <div className={styles.settingsSaveBar}>
            <div><span className={styles.healthPulse} /><p><strong>Dəyişikliklər qorunur</strong><small>Server validasiyası yadda saxlanarkən tətbiq olunur.</small></p></div>
            <button className={styles.primaryButton} type="submit" disabled={saving || (!ADMIN_DEMO_MODE && activeTab === "security")}><Icon name="check" size={17} />{!ADMIN_DEMO_MODE && activeTab === "security" ? "Server tərəfindən idarə olunur" : saving ? "Saxlanılır..." : "Parametrləri saxla"}</button>
          </div>
        </form>
      </div>}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function StatusDot({ connected }) {
  return <span className={`${styles.integrationStatus} ${connected ? styles.integrationConnected : ""}`}>{connected ? "Qoşulub" : "Qoşulmayıb"}</span>;
}

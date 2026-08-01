"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { contentEditorMeta, contentSections } from "./adminData";
import { Icon } from "./AdminIcons";
import { ADMIN_DEMO_MODE, adminApi } from "./adminApi";
import {
  adaptActivity,
  formatRelativeAdminDate,
  normalizeAdminError,
} from "./adminAdapters";
import { AdminAsyncState, ConfirmDialog, DemoNotice, EmptyState, PageHeader, StatusBadge, Toast } from "./AdminPrimitives";
import styles from "../../app/admin/admin.module.css";

const sectionBlocks = {
  home: [
    { id: "hero", title: "Hero təqdimatı", eyebrow: "Sağlamlığınız bizim dəyərimizdir", description: "Dəqiq diaqnostika, fərdi müalicə və qayğıkeş tibbi komanda ilə sağlam gələcəyiniz üçün yanınızdayıq.", type: "Hero", visible: true },
    { id: "trust", title: "Etibar göstəriciləri", eyebrow: "Rəqəmlərdə Medicare", description: "Həkim, pasiyent, şöbə və təcrübə statistikaları.", type: "Statistika", visible: true },
    { id: "services", title: "Əsas xidmətlər", eyebrow: "Kompleks tibbi xidmət", description: "Seçilmiş xidmətlərin dinamik kataloqu.", type: "Kolleksiya", visible: true },
    { id: "doctors", title: "Seçilmiş həkimlər", eyebrow: "Peşəkar komandamız", description: "Seçilmiş statuslu həkimlər avtomatik göstərilir.", type: "Kolleksiya", visible: true },
    { id: "cta", title: "Telefon əlaqə CTA-sı", eyebrow: "Sağlamlığınızı təxirə salmayın", description: "Əlaqə mərkəzinə birbaşa zəng etdirən əsas çağırış bloku.", type: "CTA", visible: true },
  ],
  about: [
    { id: "story", title: "Medicare tarixçəsi", eyebrow: "2017-ci ildən etibarən", description: "Xəstəxananın inkişaf yolu və əsas mərhələləri.", type: "Mətn", visible: true },
    { id: "mission", title: "Missiya və vizyon", eyebrow: "Məqsədimiz", description: "Pasiyent yönümlü tibbi xidmət prinsipləri.", type: "Mətn", visible: true },
    { id: "values", title: "Dəyərlərimiz", eyebrow: "Bizi birləşdirən prinsiplər", description: "Etibar, peşəkarlıq, empatiya və innovasiya.", type: "Kartlar", visible: true },
    { id: "infrastructure", title: "İnfrastruktur", eyebrow: "Klinik mühit", description: "Hospital otaqları və pasiyent məkanları.", type: "Qalereya", visible: true },
  ],
  faq: [
    { id: "faq-1", title: "Hospital ilə necə əlaqə saxlaya bilərəm?", eyebrow: "Əlaqə", description: "+994 12 450 32 91 nömrəsinə zəng edərək hospitalın əlaqə mərkəzi ilə danışa bilərsiniz.", type: "Sual-cavab", visible: true },
    { id: "faq-2", title: "Sığorta ilə xidmət ala bilərəm?", eyebrow: "Ödəniş", description: "Tərəfdaş sığorta şirkətləri üzrə xidmətlər öncədən təsdiq əsasında göstərilir.", type: "Sual-cavab", visible: true },
    { id: "faq-3", title: "Analiz nəticələri nə zaman hazır olur?", eyebrow: "Laboratoriya", description: "Standart analizlər adətən eyni iş günü ərzində hazır olur.", type: "Sual-cavab", visible: true },
  ],
  testimonials: [
    { id: "review-1", title: "Ramin Əsgərov", eyebrow: "Kardiologiya pasiyenti", description: "Komandanın peşəkar yanaşması və diqqəti mənə böyük etibar verdi.", type: "Rəy", visible: true },
    { id: "review-2", title: "Aynur Məlikova", eyebrow: "Pediatriya pasiyenti", description: "Övladıma göstərilən həssas münasibətdən çox razı qaldım.", type: "Rəy", visible: true },
  ],
  branches: [
    { id: "sabunchu", title: "Medicare Hospital — Sabunçu", eyebrow: "Sabunçu rayonu", description: "Əslidar Məmmədəliyev küç. 5 · 24/7 açıq", type: "Filial", visible: true },
  ],
  gallery: [
    { id: "hospital", title: "Xəstəxana infrastrukturu", eyebrow: "12 media", description: "Fasad, qəbul zonası, palatalar və pasiyent məkanları.", type: "Albom", visible: true },
    { id: "team", title: "Komandamız", eyebrow: "12 media", description: "Tibbi heyət və korporativ tədbirlər.", type: "Albom", visible: true },
  ],
  certificates: [
    { id: "iso", title: "ISO 9001:2015", eyebrow: "Keyfiyyət idarəetməsi", description: "Sertifikat etibarlılığı: 2025–2028", type: "Sənəd", visible: true },
    { id: "jci", title: "JCI Accreditation", eyebrow: "Pasiyent təhlükəsizliyi", description: "Akkreditasiya sənədi və təsdiq məlumatları.", type: "Sənəd", visible: true },
  ],
  navigation: [
    { id: "header", title: "Əsas naviqasiya", eyebrow: "Header", description: "Ana səhifə · Haqqımızda · Şöbələr · Həkimlər · Xidmətlər · Xəbərlər · Əlaqə", type: "Menyu", visible: true },
    { id: "footer-medical", title: "Tibbi xidmətlər", eyebrow: "Footer sütunu", description: "Şöbə və xidmətlərə sürətli keçidlər.", type: "Menyu", visible: true },
    { id: "footer-corporate", title: "Korporativ linklər", eyebrow: "Footer sütunu", description: "Haqqımızda, sertifikatlar və əlaqə.", type: "Menyu", visible: true },
  ],
  social: [
    { id: "instagram", title: "Instagram", eyebrow: "instagram", description: "https://www.instagram.com/", type: "Sosial hesab", visible: true },
    { id: "facebook", title: "Facebook", eyebrow: "facebook", description: "https://www.facebook.com/", type: "Sosial hesab", visible: true },
    { id: "linkedin", title: "LinkedIn", eyebrow: "linkedin", description: "https://www.linkedin.com/", type: "Sosial hesab", visible: true },
  ],
  contact: [
    { id: "phones", title: "Telefon nömrələri", eyebrow: "Əsas əlaqə", description: "+994 12 450 32 91 · WhatsApp: +994 55 215 97 44 · Təcili yardım: 103", type: "Əlaqə", visible: true },
    { id: "email", title: "E-mail ünvanı", eyebrow: "Elektron əlaqə", description: "official@medicarehospital.az", type: "Əlaqə", visible: true },
    { id: "social", title: "Sosial media", eyebrow: "Rəsmi hesablar", description: "Instagram · Facebook · LinkedIn · YouTube", type: "Sosial", visible: true },
    { id: "hours", title: "İş saatları", eyebrow: "Qəbul rejimi", description: "Medicare Hospital — Sabunçu · Hər gün, 24 saat", type: "Cədvəl", visible: true },
  ],
};

const contentDefinitions = {
  home: { resource: "home-sections", type: "Ana səhifə bloku", json: true, noCreate: true, noDelete: true },
  leadership: { resource: "leadership", type: "Rəhbər" },
  about: { resource: "pages", type: "Səhifə", filter: (record) => record.slug === "about", json: true, noCreate: true, noDelete: true },
  faq: { resource: "faqs", type: "Sual-cavab" },
  testimonials: { resource: "testimonials", type: "Rəy", supportsFeatured: true },
  branches: { resource: "branches", type: "Filial" },
  gallery: { resource: "gallery", type: "Media qeydi", requiresMedia: true },
  certificates: { resource: "certificates", type: "Sənəd", supportsMedia: true },
  navigation: { resource: "navigation", type: "Menyu keçidi" },
  social: { resource: "social-links", type: "Sosial hesab" },
  contact: { resource: "settings", type: "Parametr", filter: (record) => record.key === "contact", json: true, noCreate: true, noDelete: true },
};

function jsonText(value) {
  if (!value || typeof value !== "object") return "";
  return JSON.stringify(value, null, 2);
}

function dateInput(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toISOString().slice(0, 10)
    : "";
}

function contentRecordToBlock(section, record) {
  const definition = contentDefinitions[section];
  const visible = section === "about"
    ? record.status === "PUBLISHED"
    : section === "contact"
      ? Boolean(record.isPublic)
      : Boolean(record.active);
  const common = {
    id: record.id,
    type: definition.type,
    visible,
    featured: Boolean(record.featured),
    updatedAt: record.updatedAt,
    _raw: record,
  };

  if (section === "home") return { ...common, title: record.title || record.key, eyebrow: record.subtitle || record.key, description: jsonText(record.content) };
  if (section === "leadership") return { ...common, title: `${record.firstName} ${record.lastName}`, eyebrow: record.position, description: record.bio || "" };
  if (section === "about") return { ...common, title: record.title, eyebrow: record.excerpt || record.slug, description: jsonText(record.body) };
  if (section === "faq") return { ...common, title: record.question, eyebrow: record.category || "Ümumi", description: record.answer };
  if (section === "testimonials") return { ...common, title: record.patientName, eyebrow: record.patientTitle || "Pasiyent rəyi", description: record.quote };
  if (section === "branches") return {
    ...common,
    title: record.name,
    eyebrow: record.city || "",
    description: record.address || "",
    phone: record.phone || "",
    email: record.email || "",
    emergencyPhone: record.emergencyPhone || "",
    latitude: record.latitude == null ? "" : String(record.latitude),
    longitude: record.longitude == null ? "" : String(record.longitude),
    workingHours: jsonText(record.workingHours || {}),
    mapEmbedUrl: record.mapEmbedUrl || ""
  };
  if (section === "gallery") return { ...common, title: record.title, eyebrow: record.category || "", description: record.description || "", mediaFile: "", mediaName: record.media?.originalName || record.media?.altText || "Mövcud media", mediaId: record.mediaId };
  if (section === "certificates") return {
    ...common,
    title: record.title,
    eyebrow: record.issuer || "",
    description: record.description || "",
    credentialNumber: record.credentialNumber || "",
    issuedAt: dateInput(record.issuedAt),
    expiresAt: dateInput(record.expiresAt),
    mediaFile: "",
    mediaName: record.media?.originalName || record.media?.altText || "",
    mediaId: record.mediaId
  };
  if (section === "navigation") return { ...common, title: record.label, eyebrow: record.location || "HEADER", description: record.url || "", external: Boolean(record.isExternal) };
  if (section === "social") return { ...common, title: record.label || record.platform, eyebrow: record.platform || "", description: record.url || "" };
  return { ...common, title: record.label || record.key, eyebrow: record.key, description: jsonText(record.value), eyebrowLocked: true };
}

function parseJsonDescription(block, label) {
  try {
    return JSON.parse(block.description || "{}");
  } catch {
    throw new Error(`${label} üçün məzmun düzgün JSON formatında olmalıdır.`);
  }
}

function contentBlockPayload(section, block, index) {
  const common = !["about", "contact"].includes(section)
    ? { sortOrder: index, active: Boolean(block.visible) }
    : {};
  if (section === "home") return { ...common, ...(block._isNew ? { key: `content-${Date.now()}-${index}` } : {}), title: block.title, subtitle: block.eyebrow, content: parseJsonDescription(block, block.title) };
  if (section === "about") return { title: block.title, excerpt: block.eyebrow, body: parseJsonDescription(block, block.title), status: block.visible ? "PUBLISHED" : "DRAFT" };
  if (section === "faq") return { ...common, question: block.title, category: block.eyebrow, answer: block.description };
  if (section === "testimonials") return { ...common, patientName: block.title, patientTitle: block.eyebrow, quote: block.description, featured: Boolean(block.featured) };
  if (section === "branches") return {
    ...common,
    name: block.title,
    city: block.eyebrow,
    address: block.description,
    phone: block.phone,
    email: block.email || null,
    emergencyPhone: block.emergencyPhone || null,
    latitude: block.latitude || null,
    longitude: block.longitude || null,
    workingHours: parseJsonDescription(
      { description: block.workingHours || "{}" },
      `${block.title} iş saatları`
    ),
    mapEmbedUrl: block.mapEmbedUrl || null
  };
  if (section === "gallery") return { ...common, title: block.title, category: block.eyebrow, description: block.description };
  if (section === "certificates") return {
    ...common,
    title: block.title,
    issuer: block.eyebrow,
    description: block.description,
    credentialNumber: block.credentialNumber || null,
    issuedAt: block.issuedAt || null,
    expiresAt: block.expiresAt || null
  };
  if (section === "navigation") return { ...common, label: block.title, location: block.eyebrow, url: block.description, isExternal: Boolean(block.external) };
  if (section === "social") return { ...common, label: block.title, platform: block.eyebrow, url: block.description };
  return {
    ...(block._isNew ? { key: block.eyebrow, group: "contact" } : {}),
    label: block.title,
    value: parseJsonDescription(block, block.title),
    isPublic: Boolean(block.visible),
  };
}

async function loadSectionRecords(section, signal) {
  const definition = contentDefinitions[section];
  if (!definition) return [];
  const response = definition.resource === "settings"
    ? await adminApi.settings.list({ limit: 100 }, { signal })
    : await adminApi.resources.list(definition.resource, { limit: 100 }, { signal });
  const records = Array.isArray(response) ? response : Array.isArray(response?.items) ? response.items : [];
  return definition.filter ? records.filter(definition.filter) : records;
}

export function ContentHub() {
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [modules, setModules] = useState(contentSections);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const filtered = modules.filter((section) => `${section.title} ${section.description}`.toLocaleLowerCase("az").includes(query.toLocaleLowerCase("az")));
  const totalRecords = modules.reduce((total, module) => total + Number(module.items || 0), 0);
  const activeModules = modules.filter((module) => module.status === "Aktiv").length;
  const latestUpdate = modules
    .map((module) => module._updatedAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;
    const controller = new AbortController();

    async function loadContentHub() {
      setLoading(true);
      setError("");
      try {
        const [moduleRecords, activityRecords] = await Promise.all([
          Promise.all(contentSections.map(async (module) => ({
            module,
            records: await loadSectionRecords(module.id, controller.signal),
          }))),
          adminApi.dashboard
            .getActivity({ limit: 3 }, { signal: controller.signal })
            .catch((requestError) => {
              if (requestError.name === "AbortError") throw requestError;
              return [];
            }),
        ]);
        if (controller.signal.aborted) return;
        setModules(moduleRecords.map(({ module, records }) => {
          const blocks = records.map((record) => contentRecordToBlock(module.id, record));
          const newest = records.map((record) => record.updatedAt).filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0];
          return {
            ...module,
            items: records.length,
            status: blocks.some((block) => block.visible) ? "Aktiv" : records.length ? "Deaktiv" : "Boş",
            updated: newest ? formatRelativeAdminDate(newest) : "Yenilənmə yoxdur",
            _updatedAt: newest,
          };
        }));
        const activityList = Array.isArray(activityRecords)
          ? activityRecords
          : Array.isArray(activityRecords?.items) ? activityRecords.items : [];
        setActivities(activityList.map(adaptActivity));
      } catch (requestError) {
        if (!controller.signal.aborted) setError(normalizeAdminError(requestError, "Kontent modullarını yükləmək mümkün olmadı."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadContentHub();
    return () => controller.abort();
  }, [reloadKey]);

  return (
    <div className={styles.contentPage}>
      <PageHeader
        eyebrow="Public sayt"
        title="Sayt kontenti"
        description="Public səhifələrin bölmələrini, media kolleksiyalarını və naviqasiya strukturunu bir mərkəzdən idarə edin."
        actions={(
          <Link className={styles.secondaryButton} href="/" target="_blank" rel="noopener noreferrer">
            <Icon name="external" size={17} />Saytı önizlə
          </Link>
        )}
      />

      <section className={styles.contentOverview}>
        <div><span><Icon name="content" size={20} /></span><p><strong>{modules.length}</strong><small>İdarə olunan modul</small></p></div>
        <div><span><Icon name="check" size={20} /></span><p><strong>{Math.round((activeModules / Math.max(modules.length, 1)) * 100)}%</strong><small>Aktiv modullar</small></p></div>
        <div><span><Icon name="image" size={20} /></span><p><strong>{totalRecords}</strong><small>Kontent qeydi</small></p></div>
        <div><span><Icon name="activity" size={20} /></span><p><strong>{ADMIN_DEMO_MODE ? "18 dəq" : latestUpdate ? formatRelativeAdminDate(latestUpdate) : "—"}</strong><small>Son yenilənmə</small></p></div>
      </section>

      <div className={styles.contentToolbar}>
        <div><h2>Kontent modulları</h2><p>Redaktə etmək üçün modul seçin.</p></div>
        <label className={styles.tableSearch}>
          <Icon name="search" size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Modul axtar..." aria-label="Kontent modulu axtar" />
        </label>
      </div>

      {loading ? (
        <AdminAsyncState type="loading" title="Kontent modulları yüklənir" />
      ) : error ? (
        <AdminAsyncState type="error" description={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : filtered.length ? (
        <section className={styles.contentGrid}>
          {filtered.map((section) => (
            <Link
              className={styles.contentCard}
              href={["home", "about"].includes(section.id)
                ? "/admin/pages"
                : `/admin/content/${section.id}`}
              key={section.id}
            >
              <div className={styles.contentCardTop}>
                <span><Icon name={section.icon} size={21} /></span>
                <StatusBadge>{section.status}</StatusBadge>
              </div>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
              <div>
                <span><strong>{section.items}</strong> element</span>
                <small>{section.updated} yenilənib</small>
              </div>
              <em>Redaktə et <Icon name="chevronRight" size={15} /></em>
            </Link>
          ))}
        </section>
      ) : <EmptyState title="Modul tapılmadı" description="Axtarış sorğusunu dəyişərək yenidən yoxlayın." />}

      <section className={styles.contentActivityPanel}>
        <div className={styles.panelHeader}>
          <div><h2>Son kontent dəyişiklikləri</h2><p>Public saytda edilən son yeniliklər</p></div>
          <button type="button" aria-label="Fəaliyyət jurnalını yenilə" onClick={() => {
            if (ADMIN_DEMO_MODE) setToast({ tone: "success", message: "Kontent fəaliyyəti yeniləndi." });
            else setReloadKey((value) => value + 1);
          }}><Icon name="activity" size={17} /></button>
        </div>
        {ADMIN_DEMO_MODE ? (
          <div className={styles.contentChangeList}>
            <div><span className={styles.changeAvatar}>AH</span><p><strong>Aysel Həsənli</strong> Ana səhifənin CTA mətnini yenilədi<small>18 dəq əvvəl · Ana səhifə</small></p><StatusBadge>Dərc olunub</StatusBadge></div>
            <div><span className={styles.changeAvatar}>NM</span><p><strong>Nigar Məmmədova</strong> Sabunçu filialının iş saatlarını dəyişdi<small>Dünən, 16:24 · Filiallar</small></p><StatusBadge>Dərc olunub</StatusBadge></div>
            <div><span className={styles.changeAvatar}>AH</span><p><strong>Aysel Həsənli</strong> 3 yeni qalereya şəkli əlavə etdi<small>21 iyul · Qalereya</small></p><StatusBadge>Dərc olunub</StatusBadge></div>
          </div>
        ) : activities.length ? (
          <div className={styles.contentChangeList}>
            {activities.map((activity, index) => (
              <div key={`${activity.actor}-${activity.time}-${index}`}>
                <span className={styles.changeAvatar}>{activity.actor.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span>
                <p><strong>{activity.actor}</strong> {activity.action}<small>{activity.time}</small></p>
                <StatusBadge>Audit</StatusBadge>
              </div>
            ))}
          </div>
        ) : <EmptyState icon="activity" title="Kontent fəaliyyəti yoxdur" description="Kontent üzrə yeni audit qeydi yaradılmayıb." />}
      </section>
      {ADMIN_DEMO_MODE && <DemoNotice />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export function ContentSectionEditor({ section }) {
  const meta = contentEditorMeta[section] || { title: "Kontent redaktoru", description: "Səhifə kontentini idarə edin." };
  const definition = contentDefinitions[section];
  const [blocks, setBlocks] = useState(sectionBlocks[section] || []);
  const [selectedId, setSelectedId] = useState((sectionBlocks[section] || [])[0]?.id);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const selected = blocks.find((block) => block.id === selectedId);
  const completion = useMemo(() => Math.round((blocks.filter((block) => block.title && block.description).length / Math.max(blocks.length, 1)) * 100), [blocks]);
  const canReorder = ADMIN_DEMO_MODE || !["about", "contact"].includes(section);

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;
    const controller = new AbortController();

    async function loadEditor() {
      setLoading(true);
      setLoadError("");
      try {
        const records = await loadSectionRecords(section, controller.signal);
        if (controller.signal.aborted) return;
        const nextBlocks = records.map((record) => contentRecordToBlock(section, record));
        setBlocks(nextBlocks);
        setSelectedId(nextBlocks[0]?.id || "");
      } catch (requestError) {
        if (!controller.signal.aborted) setLoadError(normalizeAdminError(requestError, "Kontent qeydlərini yükləmək mümkün olmadı."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadEditor();
    return () => controller.abort();
  }, [reloadKey, section]);

  function updateSelected(key, value) {
    setBlocks((current) => current.map((block) => block.id === selectedId ? { ...block, [key]: value } : block));
  }

  function addBlock() {
    if (!ADMIN_DEMO_MODE && definition?.noCreate) {
      setToast({ tone: "warning", message: "Haqqımızda modulu tək səhifədir; yeni qeyd əvəzinə mövcud səhifəni yeniləyin." });
      return;
    }
    const id = `block-${Date.now()}`;
    setBlocks((current) => [...current, {
      id,
      title: "",
      eyebrow: section === "navigation" ? "HEADER" : section === "contact" ? `contact.custom-${Date.now()}` : "",
      description: definition?.json ? "{}" : "",
      type: definition?.type || "Kontent",
      visible: false,
      featured: false,
      phone: "",
      email: "",
      emergencyPhone: "",
      socialLinks: "{}",
      credentialNumber: "",
      issuedAt: "",
      expiresAt: "",
      latitude: "",
      longitude: "",
      workingHours: "{}",
      mapEmbedUrl: "",
      mediaFile: "",
      external: false,
      _isNew: true,
    }]);
    setSelectedId(id);
  }

  function moveBlock(direction) {
    if (!canReorder) return;
    const index = blocks.findIndex((block) => block.id === selectedId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
  }

  async function saveContent() {
    if (!definition || !blocks.length) return;
    const incomplete = blocks.find((block) => !block.title.trim() || !block.description.trim());
    if (incomplete) {
      setSelectedId(incomplete.id);
      setToast({ tone: "warning", message: "Başlıq və məzmun sahələri boş qala bilməz." });
      return;
    }
    const incompleteBranch = section === "branches" && blocks.find((block) => !block.phone?.trim());
    if (incompleteBranch) {
      setSelectedId(incompleteBranch.id);
      setToast({ tone: "warning", message: "Filial üçün telefon nömrəsi məcburidir." });
      return;
    }
    const eyebrowRequired = ["branches", "certificates", "navigation", "social", "contact"];
    const incompleteEyebrow = eyebrowRequired.includes(section) && blocks.find((block) => !block.eyebrow?.trim());
    if (incompleteEyebrow) {
      setSelectedId(incompleteEyebrow.id);
      setToast({ tone: "warning", message: "Üst başlıq / kateqoriya sahəsi bu resurs üçün məcburidir." });
      return;
    }
    const missingGalleryMedia = section === "gallery" && blocks.find((block) => block._isNew && !(typeof File !== "undefined" && block.mediaFile instanceof File));
    if (missingGalleryMedia) {
      setSelectedId(missingGalleryMedia.id);
      setToast({ tone: "warning", message: "Yeni qalereya qeydi üçün media faylı seçilməlidir." });
      return;
    }
    setSaving(true);
    try {
      if (ADMIN_DEMO_MODE) {
        await new Promise((resolve) => window.setTimeout(resolve, 280));
      } else {
        const selectedIndex = blocks.findIndex((block) => block.id === selectedId);
        const updatedRecords = await Promise.all(blocks.map(async (block, index) => {
          const payload = contentBlockPayload(section, block, index);
          if ((definition.requiresMedia || definition.supportsMedia) && typeof File !== "undefined" && block.mediaFile instanceof File) {
            const media = await adminApi.media.upload(block.mediaFile, { altText: block.title });
            payload.mediaId = media.id;
          }
          if (definition.resource === "settings") {
            return block._isNew
              ? adminApi.settings.create(payload)
              : adminApi.settings.update(block.id, payload);
          }
          return block._isNew
            ? adminApi.resources.create(definition.resource, payload)
            : adminApi.resources.update(definition.resource, block.id, payload);
        }));
        const nextBlocks = updatedRecords.map((record) => contentRecordToBlock(section, record));
        setBlocks(nextBlocks);
        setSelectedId(nextBlocks[Math.max(0, selectedIndex)]?.id || nextBlocks[0]?.id || "");
      }
      setToast({ tone: "success", message: ADMIN_DEMO_MODE ? "Kontent cari demo baxışında yeniləndi." : "Kontent dəyişiklikləri backend-də yadda saxlanıldı." });
    } catch (requestError) {
      setToast({ tone: "warning", message: normalizeAdminError(requestError, "Kontent dəyişikliklərini yadda saxlamaq mümkün olmadı.") });
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelected() {
    if (!selected) return;
    if (ADMIN_DEMO_MODE) {
      const next = blocks.filter((block) => block.id !== selectedId);
      setBlocks(next);
      setSelectedId(next[0]?.id);
      setPendingDelete(false);
      setToast({ tone: "success", message: "Kontent bloku silindi." });
      return;
    }
    if (definition.noDelete && !selected._isNew) {
      setPendingDelete(false);
      setToast({ tone: "warning", message: "Əlaqə parametrləri silinmir; yalnız dəyəri və public görünməsi dəyişdirilə bilər." });
      return;
    }
    if (selected._isNew) {
      const next = blocks.filter((block) => block.id !== selected.id);
      setBlocks(next);
      setSelectedId(next[0]?.id || "");
      setPendingDelete(false);
      return;
    }
    setSaving(true);
    try {
      await adminApi.resources.remove(definition.resource, selected.id);
      const next = blocks.filter((block) => block.id !== selected.id);
      setBlocks(next);
      setSelectedId(next[0]?.id || "");
      setToast({ tone: "success", message: "Kontent qeydi sistemdən silindi." });
    } catch (requestError) {
      setToast({ tone: "warning", message: normalizeAdminError(requestError, "Kontent qeydini silmək mümkün olmadı.") });
    } finally {
      setSaving(false);
      setPendingDelete(false);
    }
  }

  return (
    <div className={styles.contentEditorPage}>
      <PageHeader
        eyebrow="Sayt kontenti"
        title={meta.title}
        description={meta.description}
        backHref="/admin/content"
        actions={(
          <>
            <Link className={styles.secondaryButton} href="/" target="_blank" rel="noopener noreferrer"><Icon name="eye" size={17} />Önizlə</Link>
            <button className={styles.primaryButton} type="button" disabled={saving || loading || Boolean(loadError)} onClick={saveContent}><Icon name="check" size={17} />{saving ? "Saxlanılır..." : "Yadda saxla"}</button>
          </>
        )}
      />

      {loading ? (
        <AdminAsyncState type="loading" title="Kontent redaktoru hazırlanır" />
      ) : loadError ? (
        <AdminAsyncState type="error" description={loadError} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : (
      <div className={styles.contentEditorLayout}>
        <aside className={styles.blockNavigator}>
          <div className={styles.blockNavHeader}>
            <div><h2>Bölmələr</h2><small>{blocks.length} element</small></div>
            {(ADMIN_DEMO_MODE || !definition?.noCreate) && <button type="button" aria-label="Yeni blok əlavə et" onClick={addBlock}><Icon name="plus" size={18} /></button>}
          </div>
          <div className={styles.blockList}>
            {blocks.map((block, index) => (
              <button className={selectedId === block.id ? styles.blockActive : ""} type="button" key={block.id} onClick={() => setSelectedId(block.id)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{block.title}</strong><small>{block.type}</small></div>
                <i className={block.visible ? styles.blockVisible : ""} aria-label={block.visible ? "Görünür" : "Gizlidir"} />
              </button>
            ))}
          </div>
          {(ADMIN_DEMO_MODE || !definition?.noCreate)
            ? <button className={styles.addBlockButton} type="button" onClick={addBlock}><Icon name="plus" size={16} />Yeni element əlavə et</button>
            : <p className={styles.fieldMeta}>Bu tək-səhifəli modulda yeni qeyd yaradılmır.</p>}
        </aside>

        <section className={styles.blockEditor}>
          {selected ? (
            <>
              <div className={styles.blockEditorHeader}>
                <div><span>{selected.type}</span><h2>{selected.title}</h2></div>
                <div>
                  <button type="button" disabled={!canReorder || saving} aria-label="Yuxarı daşı" onClick={() => moveBlock(-1)}><Icon name="arrowUp" size={17} /></button>
                  <button type="button" disabled={!canReorder || saving} aria-label="Aşağı daşı" onClick={() => moveBlock(1)}><Icon name="arrowDown" size={17} /></button>
                  {(!definition?.noDelete || selected._isNew) && <button className={styles.blockDelete} type="button" disabled={saving} aria-label="Bloku sil" onClick={() => setPendingDelete(true)}><Icon name="trash" size={17} /></button>}
                </div>
              </div>
              <div className={styles.blockForm}>
                <div className={styles.formField}>
                  <label htmlFor="block-title">Başlıq <span>*</span></label>
                  <input id="block-title" value={selected.title} onChange={(event) => updateSelected("title", event.target.value)} />
                  <div className={styles.fieldMeta}><span>Public səhifədə görünən əsas başlıq.</span><small>{selected.title.length}/100</small></div>
                </div>
                <div className={styles.formField}>
                  <label htmlFor="block-eyebrow">Üst başlıq / kateqoriya</label>
                  {section === "navigation" && !ADMIN_DEMO_MODE ? (
                    <select id="block-eyebrow" value={selected.eyebrow} onChange={(event) => updateSelected("eyebrow", event.target.value)}>
                      <option value="HEADER">HEADER</option>
                      <option value="FOOTER">FOOTER</option>
                      <option value="UTILITY">UTILITY</option>
                    </select>
                  ) : (
                    <input id="block-eyebrow" disabled={Boolean(selected.eyebrowLocked)} value={selected.eyebrow} onChange={(event) => updateSelected("eyebrow", event.target.value)} />
                  )}
                  <div className={styles.fieldMeta}><span>Vizual iyerarxiya üçün qısa etiket.</span></div>
                </div>
                <div className={styles.formField}>
                  <label htmlFor="block-description">Məzmun <span>*</span></label>
                  <textarea id="block-description" rows={9} value={selected.description} onChange={(event) => updateSelected("description", event.target.value)} />
                  <div className={styles.fieldMeta}><span>{definition?.json && !ADMIN_DEMO_MODE ? "Backend dəyərini etibarlı JSON formatında daxil edin." : "Məzmun backend-in uyğun sahəsinə yazılacaq."}</span><small>{selected.description.length} simvol</small></div>
                </div>
                {section === "branches" && (
                  <>
                    <div className={styles.formField}>
                      <label htmlFor="block-phone">Telefon <span>*</span></label>
                      <input id="block-phone" type="tel" value={selected.phone || ""} onChange={(event) => updateSelected("phone", event.target.value)} />
                      <div className={styles.fieldMeta}><span>Filialın public əlaqə nömrəsi.</span></div>
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="block-email">E-mail</label>
                      <input id="block-email" type="email" value={selected.email || ""} onChange={(event) => updateSelected("email", event.target.value)} />
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="block-emergency-phone">Təcili telefon</label>
                      <input id="block-emergency-phone" type="tel" value={selected.emergencyPhone || ""} onChange={(event) => updateSelected("emergencyPhone", event.target.value)} />
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="block-working-hours">İş saatları (JSON)</label>
                      <textarea id="block-working-hours" rows={5} value={selected.workingHours || "{}"} onChange={(event) => updateSelected("workingHours", event.target.value)} />
                      <div className={styles.fieldMeta}><span>Məsələn: {`{"weekdays":"08:00–20:00","sunday":"Təcili yardım"}`}</span></div>
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="block-latitude">Enlik</label>
                      <input id="block-latitude" type="number" step="any" value={selected.latitude || ""} onChange={(event) => updateSelected("latitude", event.target.value)} />
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="block-longitude">Uzunluq</label>
                      <input id="block-longitude" type="number" step="any" value={selected.longitude || ""} onChange={(event) => updateSelected("longitude", event.target.value)} />
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="block-map-url">Xəritə embed URL</label>
                      <input id="block-map-url" type="url" value={selected.mapEmbedUrl || ""} onChange={(event) => updateSelected("mapEmbedUrl", event.target.value)} />
                    </div>
                  </>
                )}
                {section === "certificates" && (
                  <>
                    <div className={styles.formField}>
                      <label htmlFor="block-credential">Sertifikat nömrəsi</label>
                      <input id="block-credential" value={selected.credentialNumber || ""} onChange={(event) => updateSelected("credentialNumber", event.target.value)} />
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="block-issued-at">Verilmə tarixi</label>
                      <input id="block-issued-at" type="date" value={selected.issuedAt || ""} onChange={(event) => updateSelected("issuedAt", event.target.value)} />
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="block-expires-at">Bitmə tarixi</label>
                      <input id="block-expires-at" type="date" value={selected.expiresAt || ""} onChange={(event) => updateSelected("expiresAt", event.target.value)} />
                    </div>
                  </>
                )}
                {(definition?.requiresMedia || definition?.supportsMedia) && (
                  <div className={styles.formField}>
                    <label htmlFor="block-media">Media {definition?.requiresMedia && selected._isNew && <span>*</span>}</label>
                    <input id="block-media" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => updateSelected("mediaFile", event.target.files?.[0] || "")} />
                    <div className={styles.fieldMeta}><span>{selected.mediaFile?.name || selected.mediaName || "Yeni şəkil seçilməyib."}</span></div>
                  </div>
                )}
                <div className={styles.blockOptions}>
                  <div><span><Icon name="eye" size={17} /></span><p><strong>Public görünmə</strong><small>Bu element public səhifədə göstərilsin.</small></p><label className={styles.switch}><input type="checkbox" checked={selected.visible} onChange={(event) => updateSelected("visible", event.target.checked)} /><span /></label></div>
                  {(ADMIN_DEMO_MODE || definition?.supportsFeatured) && <div><span><Icon name="sparkles" size={17} /></span><p><strong>Vurğulanmış blok</strong><small>Public görünüşdə önə çıxarılsın.</small></p><label className={styles.switch}><input type="checkbox" checked={Boolean(selected.featured)} onChange={(event) => updateSelected("featured", event.target.checked)} /><span /></label></div>}
                  {section === "navigation" && <div><span><Icon name="external" size={17} /></span><p><strong>Xarici keçid</strong><small>Link yeni pəncərədə təhlükəsiz şəkildə açılsın.</small></p><label className={styles.switch}><input type="checkbox" checked={Boolean(selected.external)} onChange={(event) => updateSelected("external", event.target.checked)} /><span /></label></div>}
                </div>
              </div>
            </>
          ) : <EmptyState
            icon="content"
            title="Kontent qeydi yoxdur"
            description={ADMIN_DEMO_MODE ? "Redaktəyə başlamaq üçün yeni element əlavə edin." : "Bu modul üçün backend-də mövcud qeyd tapılmadı."}
            action={(ADMIN_DEMO_MODE || !definition?.noCreate) ? <button className={styles.primaryButton} type="button" onClick={addBlock}><Icon name="plus" size={16} />Element əlavə et</button> : null}
          />}
        </section>

        <aside className={styles.contentInspector}>
          <section>
            <h2>Səhifə statusu</h2>
            <div className={styles.completionRing} style={{ "--completion": `${completion * 3.6}deg` }}><span><strong>{completion}%</strong><small>tamamlanıb</small></span></div>
            <dl><div><dt>Aktiv bölmə</dt><dd>{blocks.filter((block) => block.visible).length}</dd></div><div><dt>Gizli bölmə</dt><dd>{blocks.filter((block) => !block.visible).length}</dd></div><div><dt>Son yenilənmə</dt><dd>İndi</dd></div></dl>
          </section>
          {ADMIN_DEMO_MODE ? (
            <section className={styles.versionCard}>
              <div><Icon name="activity" size={17} /><h2>Versiya tarixçəsi</h2></div>
              <ol><li><span /><p><strong>Cari qaralama</strong><small>Nigar M. · indi</small></p></li><li><span /><p><strong>Canlı versiya</strong><small>Aysel H. · 18 dəq əvvəl</small></p></li><li><span /><p><strong>Əvvəlki versiya</strong><small>22 iyul, 16:20</small></p></li></ol>
              <button type="button" onClick={() => setToast({ tone: "success", message: "Versiya tarixçəsi cari məlumatla yeniləndi." })}>Bütün versiyalara bax</button>
            </section>
          ) : (
            <section className={styles.versionCard}>
              <div><Icon name="activity" size={17} /><h2>Backend sinxronizasiyası</h2></div>
              <p>Yadda saxlanan dəyişikliklər birbaşa bu kontent resursuna göndərilir.</p>
              <small>Seçilmiş qeyd: {selected?.updatedAt ? formatRelativeAdminDate(selected.updatedAt) : "yenilənmə yoxdur"}</small>
            </section>
          )}
        </aside>
      </div>
      )}
      {ADMIN_DEMO_MODE && <DemoNotice />}
      <ConfirmDialog
        open={pendingDelete}
        title={`“${selected?.title || "Kontent qeydi"}” silinsin?`}
        description={selected?._isNew
          ? "Yadda saxlanmamış yeni qeyd redaktordan çıxarılacaq."
          : ADMIN_DEMO_MODE
            ? "Bu əməl demo qeydini cari baxışdan siləcək."
            : "Bu kontent qeydi backend-dən silinəcək və əməl audit jurnalında qeydə alınacaq."}
        onCancel={() => setPendingDelete(false)}
        onConfirm={deleteSelected}
      />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

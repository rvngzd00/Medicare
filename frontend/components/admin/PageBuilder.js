"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "./AdminIcons";
import { ADMIN_DEMO_MODE, adminApi } from "./adminApi";
import { normalizeAdminError } from "./adminAdapters";
import {
  AdminAsyncState,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Toast,
} from "./AdminPrimitives";
import styles from "../../app/admin/admin.module.css";

const sectionTypes = [
  ["HERO", "Hero / səhifə başlığı"],
  ["RICH_TEXT", "Mətn bloku"],
  ["STATISTICS", "Statistika"],
  ["COLLECTION", "Dinamik kolleksiya"],
  ["FEATURE_GRID", "Xüsusiyyət kartları"],
  ["MEDIA", "Şəkil və mətn"],
  ["CTA", "Çağırış bloku"],
  ["FAQ", "Sual-cavab"],
  ["CONTACT", "Əlaqə məlumatları"],
  ["CUSTOM", "Xüsusi blok"],
];

const demoPage = {
  id: "demo-home",
  slug: "home",
  title: "Ana səhifə",
  excerpt: "Medicare Hospital-un əsas təqdimat səhifəsi.",
  template: "HOME",
  status: "PUBLISHED",
  seo: {
    title: "Medicare Hospital — Dəqiq tibbi qayğı",
    description:
      "Müasir diaqnostika, ixtisaslaşmış həkimlər və pasiyent yönümlü tibbi xidmət.",
    canonicalUrl: "https://medicarehospital.az",
  },
  sections: [
    {
      id: "demo-hero",
      key: "hero",
      type: "HERO",
      label: "Hero təqdimatı",
      eyebrow: "Sağlamlığınız bizim dəyərimizdir",
      title: "Sağlamlığınız üçün dəqiq qərarlar, qayğıkeş yanaşma",
      description:
        "Müasir diaqnostika və güvəndiyiniz həkim komandası bir məkanda.",
      content: {
        primaryLabel: "Qəbula yazıl",
        primaryHref: "/appointment",
        secondaryLabel: "Həkimləri tanı",
        secondaryHref: "/doctors",
      },
      active: true,
      locked: true,
      sortOrder: 0,
    },
    {
      id: "demo-services",
      key: "services",
      type: "COLLECTION",
      label: "Əsas xidmətlər",
      eyebrow: "Əsas xidmətlər",
      title: "Ehtiyacınıza uyğun tibbi həllər",
      description:
        "Profilaktik müayinədən mürəkkəb diaqnostikaya qədər tibbi xidmətlər.",
      content: {
        collection: "services",
        limit: 4,
        linkLabel: "Bütün xidmətlər",
        linkHref: "/services",
      },
      active: true,
      locked: true,
      sortOrder: 1,
    },
    {
      id: "demo-appointment",
      key: "appointment",
      type: "CTA",
      label: "Qəbula yazılma çağırışı",
      eyebrow: "Qəbul",
      title: "Sağlamlığınızı təxirə salmayın",
      description:
        "Sizə uyğun şöbə və həkimi seçmək üçün komandamızla əlaqə saxlayın.",
      content: {
        primaryLabel: "Qəbula yazıl",
        primaryHref: "/appointment",
      },
      active: true,
      locked: true,
      sortOrder: 2,
    },
  ],
};

function preparePage(raw) {
  return {
    ...raw,
    excerpt: raw.excerpt || "",
    template: raw.template || "STANDARD",
    status: raw.status || "DRAFT",
    seo: {
      title: raw.seo?.title || raw.title || "",
      description: raw.seo?.description || raw.excerpt || "",
      canonicalUrl: raw.seo?.canonicalUrl || "",
      keywords: raw.seo?.keywords || [],
      robots: raw.seo?.robots || "index,follow",
      ogTitle: raw.seo?.ogTitle || "",
      ogDescription: raw.seo?.ogDescription || "",
      twitterCard: raw.seo?.twitterCard || "summary_large_image",
    },
    sections: (raw.sections || []).map((section, index) => ({
      ...section,
      eyebrow: section.eyebrow || "",
      title: section.title || "",
      description: section.description || "",
      content: section.content || {},
      active: section.active !== false,
      locked: Boolean(section.locked),
      sortOrder: index,
      _contentText: JSON.stringify(section.content || {}, null, 2),
    })),
  };
}

function previewHref(page) {
  return page?.slug === "home" ? "/" : `/${page?.slug || ""}`;
}

function formatRevisionDate(value) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PageBuilder() {
  const [pages, setPages] = useState(
    ADMIN_DEMO_MODE
      ? [{ ...demoPage, _count: { sections: demoPage.sections.length } }]
      : [],
  );
  const [page, setPage] = useState(
    ADMIN_DEMO_MODE ? preparePage(demoPage) : null,
  );
  const [selectedPageId, setSelectedPageId] = useState(
    ADMIN_DEMO_MODE ? demoPage.id : "",
  );
  const [selectedSectionId, setSelectedSectionId] = useState(
    ADMIN_DEMO_MODE ? demoPage.sections[0].id : "",
  );
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newPage, setNewPage] = useState({
    title: "",
    slug: "",
    excerpt: "",
    template: "STANDARD",
  });
  const [pendingRestore, setPendingRestore] = useState(null);
  const selectedSection = page?.sections.find(
    (section) => section.id === selectedSectionId,
  );
  const publishedPages = pages.filter(
    (entry) => entry.status === "PUBLISHED",
  ).length;
  const activeSections = page?.sections.filter((section) => section.active)
    .length;

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;
    const controller = new AbortController();

    async function loadPages() {
      setLoading(true);
      setError("");
      try {
        const records = await adminApi.cms.listPages({
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setPages(records);
        setSelectedPageId((current) => current || records[0]?.id || "");
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            normalizeAdminError(
              requestError,
              "Səhifələri yükləmək mümkün olmadı.",
            ),
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadPages();
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    if (ADMIN_DEMO_MODE || !selectedPageId) return undefined;
    const controller = new AbortController();

    async function loadPage() {
      setLoading(true);
      setError("");
      try {
        const [record, history] = await Promise.all([
          adminApi.cms.getPage(selectedPageId, { signal: controller.signal }),
          adminApi.cms
            .listRevisions(selectedPageId, { signal: controller.signal })
            .catch((requestError) => {
              if (requestError.name === "AbortError") throw requestError;
              return [];
            }),
        ]);
        if (controller.signal.aborted) return;
        const prepared = preparePage(record);
        setPage(prepared);
        setSelectedSectionId(prepared.sections[0]?.id || "");
        setRevisions(history);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            normalizeAdminError(
              requestError,
              "Səhifə quruluşunu yükləmək mümkün olmadı.",
            ),
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadPage();
    return () => controller.abort();
  }, [selectedPageId, reloadKey]);

  function updatePage(field, value) {
    setPage((current) => ({ ...current, [field]: value }));
  }

  function updateSeo(field, value) {
    setPage((current) => ({
      ...current,
      seo: { ...current.seo, [field]: value },
    }));
  }

  function updateSection(field, value) {
    setPage((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === selectedSectionId
          ? { ...section, [field]: value }
          : section,
      ),
    }));
  }

  function updateSectionContent(field, value) {
    setPage((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== selectedSectionId) return section;
        const content = { ...section.content, [field]: value };
        return {
          ...section,
          content,
          _contentText: JSON.stringify(content, null, 2),
        };
      }),
    }));
  }

  function addSection() {
    const id = `new-${Date.now()}`;
    const section = {
      id,
      key: `yeni-bolme-${page.sections.length + 1}`,
      type: "RICH_TEXT",
      label: "Yeni bölmə",
      eyebrow: "",
      title: "",
      description: "",
      content: {},
      active: false,
      locked: false,
      sortOrder: page.sections.length,
      _contentText: "{}",
    };
    setPage((current) => ({
      ...current,
      sections: [...current.sections, section],
    }));
    setSelectedSectionId(id);
  }

  function moveSection(direction) {
    const index = page.sections.findIndex(
      (section) => section.id === selectedSectionId,
    );
    const target = index + direction;
    if (index < 0 || target < 0 || target >= page.sections.length) return;
    const sections = [...page.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    setPage((current) => ({ ...current, sections }));
  }

  function removeSection() {
    if (!selectedSection || selectedSection.locked) return;
    const sections = page.sections.filter(
      (section) => section.id !== selectedSectionId,
    );
    setPage((current) => ({ ...current, sections }));
    setSelectedSectionId(sections[0]?.id || "");
  }

  function serializePage() {
    const seenKeys = new Set();
    const sections = page.sections.map((section) => {
      const key = section.key.trim();
      if (!key || seenKeys.has(key)) {
        throw new Error(
          key
            ? `“${key}” açarı bir neçə bölmədə istifadə olunub.`
            : "Bütün bölmələr üçün unikal açar daxil edin.",
        );
      }
      seenKeys.add(key);
      let content;
      try {
        content = JSON.parse(section._contentText || "{}");
      } catch {
        throw new Error(
          `“${section.label}” bölməsinin əlavə parametrləri düzgün JSON deyil.`,
        );
      }
      if (!content || typeof content !== "object" || Array.isArray(content)) {
        throw new Error(
          `“${section.label}” bölməsinin əlavə parametrləri obyekt olmalıdır.`,
        );
      }
      return {
        ...(!section.id.startsWith("new-") &&
        !section.id.startsWith("demo-")
          ? { id: section.id }
          : {}),
        key,
        type: section.type,
        label: section.label.trim(),
        eyebrow: section.eyebrow.trim() || null,
        title: section.title.trim() || null,
        description: section.description.trim() || null,
        content,
        active: Boolean(section.active),
        locked: Boolean(section.locked),
      };
    });
    const seo =
      page.seo.title.trim() && page.seo.description.trim().length >= 10
        ? {
            title: page.seo.title.trim(),
            description: page.seo.description.trim(),
            canonicalUrl: page.seo.canonicalUrl.trim() || null,
            keywords: page.seo.keywords || [],
            robots: page.seo.robots || "index,follow",
            ogTitle: page.seo.ogTitle.trim() || null,
            ogDescription: page.seo.ogDescription.trim() || null,
            twitterCard: page.seo.twitterCard || "summary_large_image",
          }
        : null;
    return {
      title: page.title.trim(),
      slug: page.slug.trim(),
      excerpt: page.excerpt.trim() || null,
      template: page.template,
      status: page.status,
      seo,
      sections,
    };
  }

  async function savePage() {
    if (!page?.title.trim() || !page?.slug.trim()) {
      setToast({
        tone: "warning",
        message: "Səhifə adı və URL açarı boş qala bilməz.",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = serializePage();
      if (ADMIN_DEMO_MODE) {
        await new Promise((resolve) => window.setTimeout(resolve, 260));
        const prepared = preparePage({
          ...page,
          ...payload,
          sections: payload.sections.map((section, index) => ({
            ...section,
            id: page.sections[index]?.id || `demo-${Date.now()}-${index}`,
          })),
        });
        setPage(prepared);
        setPages((current) =>
          current.map((entry) =>
            entry.id === page.id
              ? {
                  ...entry,
                  ...payload,
                  _count: { sections: payload.sections.length },
                }
              : entry,
          ),
        );
      } else {
        const saved = await adminApi.cms.savePage(page.id, payload);
        const prepared = preparePage(saved);
        setPage(prepared);
        setSelectedSectionId(
          prepared.sections.find(
            (section) => section.key === selectedSection?.key,
          )?.id ||
            prepared.sections[0]?.id ||
            "",
        );
        const [records, history] = await Promise.all([
          adminApi.cms.listPages(),
          adminApi.cms.listRevisions(page.id),
        ]);
        setPages(records);
        setRevisions(history);
      }
      setToast({
        tone: "success",
        message:
          "Səhifə, bölmə sırası, görünürlük və SEO məlumatları yadda saxlanıldı.",
      });
    } catch (requestError) {
      setToast({
        tone: "warning",
        message: normalizeAdminError(
          requestError,
          requestError.message || "Səhifəni yadda saxlamaq mümkün olmadı.",
        ),
      });
    } finally {
      setSaving(false);
    }
  }

  async function createPage() {
    if (!newPage.title.trim() || !newPage.slug.trim()) {
      setToast({
        tone: "warning",
        message: "Yeni səhifə üçün ad və URL açarı daxil edin.",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...newPage,
        title: newPage.title.trim(),
        slug: newPage.slug.trim(),
        excerpt: newPage.excerpt.trim() || null,
        status: "DRAFT",
        seo: null,
        sections: [],
      };
      let created;
      if (ADMIN_DEMO_MODE) {
        created = preparePage({
          ...payload,
          id: `demo-page-${Date.now()}`,
        });
        setPages((current) => [
          ...current,
          { ...created, _count: { sections: 0 } },
        ]);
      } else {
        created = preparePage(await adminApi.cms.createPage(payload));
        setPages(await adminApi.cms.listPages());
      }
      setPage(created);
      setSelectedPageId(created.id);
      setSelectedSectionId("");
      setShowCreate(false);
      setNewPage({
        title: "",
        slug: "",
        excerpt: "",
        template: "STANDARD",
      });
      setToast({
        tone: "success",
        message: "Yeni qaralama səhifə yaradıldı. İndi bölmələr əlavə edə bilərsiniz.",
      });
    } catch (requestError) {
      setToast({
        tone: "warning",
        message: normalizeAdminError(
          requestError,
          "Yeni səhifəni yaratmaq mümkün olmadı.",
        ),
      });
    } finally {
      setSaving(false);
    }
  }

  async function restoreRevision() {
    if (!pendingRestore || !page) return;
    setSaving(true);
    try {
      if (ADMIN_DEMO_MODE) {
        await new Promise((resolve) => window.setTimeout(resolve, 220));
      } else {
        const restored = await adminApi.cms.restoreRevision(
          page.id,
          pendingRestore.id,
        );
        setPage(preparePage(restored));
        setRevisions(await adminApi.cms.listRevisions(page.id));
      }
      setPendingRestore(null);
      setToast({
        tone: "success",
        message: "Seçilmiş versiya bərpa olundu.",
      });
    } catch (requestError) {
      setToast({
        tone: "warning",
        message: normalizeAdminError(
          requestError,
          "Versiyanı bərpa etmək mümkün olmadı.",
        ),
      });
    } finally {
      setSaving(false);
    }
  }

  const contentCompletion = useMemo(() => {
    if (!page?.sections.length) return 0;
    return Math.round(
      (page.sections.filter(
        (section) => section.label && (section.title || section.description),
      ).length /
        page.sections.length) *
        100,
    );
  }, [page]);

  return (
    <div className={styles.contentEditorPage}>
      <PageHeader
        eyebrow="WordPress tipli CMS"
        title="Səhifə qurucusu"
        description="Səhifələri yaradın, bölmələrin mətnini və sırasını dəyişin, görünürlüğü, nəşri və SEO məlumatlarını bir yerdən idarə edin."
        actions={
          <>
            {page && (
              <Link
                className={styles.secondaryButton}
                href={previewHref(page)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="eye" size={17} />
                Önizlə
              </Link>
            )}
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => setShowCreate(true)}
            >
              <Icon name="plus" size={17} />
              Yeni səhifə
            </button>
            <button
              className={styles.primaryButton}
              disabled={!page || saving || loading}
              type="button"
              onClick={savePage}
            >
              <Icon name="check" size={17} />
              {saving ? "Saxlanılır..." : "Yadda saxla"}
            </button>
          </>
        }
      />

      <section className={styles.builderOverview}>
        <div>
          <span><Icon name="content" size={20} /></span>
          <p><strong>{pages.length}</strong><small>Səhifə</small></p>
        </div>
        <div>
          <span><Icon name="check" size={20} /></span>
          <p><strong>{publishedPages}</strong><small>Dərc olunub</small></p>
        </div>
        <div>
          <span><Icon name="menu" size={20} /></span>
          <p><strong>{page?.sections.length || 0}</strong><small>Cari bölmə</small></p>
        </div>
        <div>
          <span><Icon name="eye" size={20} /></span>
          <p><strong>{activeSections || 0}</strong><small>Görünən bölmə</small></p>
        </div>
      </section>

      {loading && !page ? (
        <AdminAsyncState title="Səhifə qurucusu yüklənir" />
      ) : error ? (
        <AdminAsyncState
          type="error"
          description={error}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : page ? (
        <>
          <div className={styles.pageSelector}>
            <label htmlFor="builder-page">Redaktə olunan səhifə</label>
            <select
              id="builder-page"
              value={selectedPageId}
              onChange={(event) => setSelectedPageId(event.target.value)}
            >
              {pages.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title} · /{entry.slug === "home" ? "" : entry.slug}
                </option>
              ))}
            </select>
            <span className={page.status === "PUBLISHED" ? styles.builderPublished : styles.builderDraft}>
              {page.status === "PUBLISHED" ? "Dərc olunub" : page.status === "ARCHIVED" ? "Arxiv" : "Qaralama"}
            </span>
          </div>

          <section className={styles.builderPageSettings}>
            <div className={styles.formField}>
              <label htmlFor="page-title">Səhifə adı <span>*</span></label>
              <input id="page-title" value={page.title} onChange={(event) => updatePage("title", event.target.value)} />
            </div>
            <div className={styles.formField}>
              <label htmlFor="page-slug">URL açarı <span>*</span></label>
              <input id="page-slug" value={page.slug} onChange={(event) => updatePage("slug", event.target.value)} />
            </div>
            <div className={styles.formField}>
              <label htmlFor="page-template">Şablon</label>
              <select id="page-template" value={page.template} onChange={(event) => updatePage("template", event.target.value)}>
                <option value="HOME">Ana səhifə</option>
                <option value="STANDARD">Standart</option>
                <option value="LANDING">Landing</option>
                <option value="CONTACT">Əlaqə</option>
                <option value="LEGAL">Hüquqi sənəd</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label htmlFor="page-status">Nəşr statusu</label>
              <select id="page-status" value={page.status} onChange={(event) => updatePage("status", event.target.value)}>
                <option value="DRAFT">Qaralama</option>
                <option value="PUBLISHED">Dərc olunub</option>
                <option value="ARCHIVED">Arxiv</option>
              </select>
            </div>
            <div className={`${styles.formField} ${styles.builderFullField}`}>
              <label htmlFor="page-excerpt">Səhifə açıqlaması</label>
              <textarea id="page-excerpt" rows={3} value={page.excerpt} onChange={(event) => updatePage("excerpt", event.target.value)} />
            </div>
          </section>

          <div className={styles.contentEditorLayout}>
            <aside className={styles.blockNavigator}>
              <div className={styles.blockNavHeader}>
                <div><h2>Səhifə bölmələri</h2><small>{page.sections.length} blok</small></div>
                <button type="button" aria-label="Yeni bölmə əlavə et" onClick={addSection}><Icon name="plus" size={18} /></button>
              </div>
              <div className={styles.blockList}>
                {page.sections.map((section, index) => (
                  <button
                    className={selectedSectionId === section.id ? styles.blockActive : ""}
                    type="button"
                    key={section.id}
                    onClick={() => setSelectedSectionId(section.id)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><strong>{section.label}</strong><small>{section.type}</small></div>
                    <i className={section.active ? styles.blockVisible : ""} aria-label={section.active ? "Görünür" : "Gizlidir"} />
                  </button>
                ))}
              </div>
              <button className={styles.addBlockButton} type="button" onClick={addSection}><Icon name="plus" size={16} />Yeni bölmə əlavə et</button>
            </aside>

            <section className={styles.blockEditor}>
              {selectedSection ? (
                <>
                  <div className={styles.blockEditorHeader}>
                    <div><span>{selectedSection.type}</span><h2>{selectedSection.label}</h2></div>
                    <div>
                      <button type="button" aria-label="Yuxarı daşı" disabled={saving} onClick={() => moveSection(-1)}><Icon name="arrowUp" size={17} /></button>
                      <button type="button" aria-label="Aşağı daşı" disabled={saving} onClick={() => moveSection(1)}><Icon name="arrowDown" size={17} /></button>
                      {!selectedSection.locked && <button className={styles.blockDelete} type="button" aria-label="Bölməni sil" onClick={removeSection}><Icon name="trash" size={17} /></button>}
                    </div>
                  </div>
                  <div className={styles.blockForm}>
                    <div className={styles.builderFieldPair}>
                      <div className={styles.formField}>
                        <label htmlFor="section-label">Admin etiketi <span>*</span></label>
                        <input id="section-label" value={selectedSection.label} onChange={(event) => updateSection("label", event.target.value)} />
                      </div>
                      <div className={styles.formField}>
                        <label htmlFor="section-key">Unikal açar <span>*</span></label>
                        <input id="section-key" value={selectedSection.key} onChange={(event) => updateSection("key", event.target.value)} />
                      </div>
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="section-type">Blok tipi</label>
                      <select id="section-type" value={selectedSection.type} onChange={(event) => updateSection("type", event.target.value)}>
                        {sectionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="section-eyebrow">Üst başlıq</label>
                      <input id="section-eyebrow" value={selectedSection.eyebrow} onChange={(event) => updateSection("eyebrow", event.target.value)} />
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="section-title">Əsas başlıq</label>
                      <input id="section-title" value={selectedSection.title} onChange={(event) => updateSection("title", event.target.value)} />
                    </div>
                    <div className={styles.formField}>
                      <label htmlFor="section-description">Açıqlama</label>
                      <textarea id="section-description" rows={5} value={selectedSection.description} onChange={(event) => updateSection("description", event.target.value)} />
                    </div>

                    {selectedSection.type === "RICH_TEXT" && (
                      <div className={styles.formField}>
                        <label htmlFor="section-text">Əsas mətn</label>
                        <textarea id="section-text" rows={8} value={selectedSection.content.text || ""} onChange={(event) => updateSectionContent("text", event.target.value)} />
                        <div className={styles.fieldMeta}><span>Abzasları boş sətirlə ayırın.</span></div>
                      </div>
                    )}
                    {["HERO", "CTA"].includes(selectedSection.type) && (
                      <div className={styles.builderFieldGrid}>
                        <div className={styles.formField}>
                          <label htmlFor="primary-label">Əsas düymə mətni</label>
                          <input id="primary-label" value={selectedSection.content.primaryLabel || ""} onChange={(event) => updateSectionContent("primaryLabel", event.target.value)} />
                        </div>
                        <div className={styles.formField}>
                          <label htmlFor="primary-href">Əsas düymə URL</label>
                          <input id="primary-href" value={selectedSection.content.primaryHref || ""} onChange={(event) => updateSectionContent("primaryHref", event.target.value)} />
                        </div>
                        <div className={styles.formField}>
                          <label htmlFor="secondary-label">İkinci düymə mətni</label>
                          <input id="secondary-label" value={selectedSection.content.secondaryLabel || ""} onChange={(event) => updateSectionContent("secondaryLabel", event.target.value)} />
                        </div>
                        <div className={styles.formField}>
                          <label htmlFor="secondary-href">İkinci düymə URL</label>
                          <input id="secondary-href" value={selectedSection.content.secondaryHref || ""} onChange={(event) => updateSectionContent("secondaryHref", event.target.value)} />
                        </div>
                      </div>
                    )}
                    {["COLLECTION", "FAQ"].includes(selectedSection.type) && (
                      <div className={styles.builderFieldGrid}>
                        <div className={styles.formField}>
                          <label htmlFor="collection-limit">Göstərilən element sayı</label>
                          <input id="collection-limit" type="number" min="1" max="100" value={selectedSection.content.limit || ""} onChange={(event) => updateSectionContent("limit", Number(event.target.value) || "")} />
                        </div>
                        <div className={styles.formField}>
                          <label htmlFor="collection-name">Kolleksiya</label>
                          <input id="collection-name" value={selectedSection.content.collection || ""} onChange={(event) => updateSectionContent("collection", event.target.value)} placeholder="services, doctors, articles..." />
                        </div>
                        <div className={styles.formField}>
                          <label htmlFor="link-label">Keçid mətni</label>
                          <input id="link-label" value={selectedSection.content.linkLabel || ""} onChange={(event) => updateSectionContent("linkLabel", event.target.value)} />
                        </div>
                        <div className={styles.formField}>
                          <label htmlFor="link-href">Keçid URL</label>
                          <input id="link-href" value={selectedSection.content.linkHref || ""} onChange={(event) => updateSectionContent("linkHref", event.target.value)} />
                        </div>
                      </div>
                    )}
                    {selectedSection.type === "MEDIA" && (
                      <div className={styles.builderFieldGrid}>
                        <div className={styles.formField}>
                          <label htmlFor="media-url">Şəkil URL</label>
                          <input id="media-url" value={selectedSection.content.image || ""} onChange={(event) => updateSectionContent("image", event.target.value)} />
                        </div>
                        <div className={styles.formField}>
                          <label htmlFor="media-alt">Şəkil alt mətni</label>
                          <input id="media-alt" value={selectedSection.content.imageAlt || ""} onChange={(event) => updateSectionContent("imageAlt", event.target.value)} />
                        </div>
                      </div>
                    )}

                    <details className={styles.builderAdvanced}>
                      <summary>Əlavə blok parametrləri (JSON)</summary>
                      <div className={styles.formField}>
                        <label htmlFor="section-content">Parametrlər</label>
                        <textarea id="section-content" rows={10} value={selectedSection._contentText} onChange={(event) => updateSection("_contentText", event.target.value)} spellCheck="false" />
                        <div className={styles.fieldMeta}><span>Düymə, media, limit və xüsusi blok parametrləri burada saxlanır.</span></div>
                      </div>
                    </details>

                    <div className={styles.blockOptions}>
                      <div>
                        <span><Icon name="eye" size={17} /></span>
                        <p><strong>Public görünmə</strong><small>Bölmə saytda göstərilsin.</small></p>
                        <label className={styles.switch}><input type="checkbox" checked={selectedSection.active} onChange={(event) => updateSection("active", event.target.checked)} /><span /></label>
                      </div>
                      <div>
                        <span><Icon name="lock" size={17} /></span>
                        <p><strong>Şablon bölməsi</strong><small>{selectedSection.locked ? "Silinmədən qorunur, amma tam redaktə olunur." : "İstəyə görə silinə bilən yeni bölmədir."}</small></p>
                        <label className={styles.switch}><input type="checkbox" checked={selectedSection.locked} onChange={(event) => updateSection("locked", event.target.checked)} /><span /></label>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="content"
                  title="Bu səhifədə bölmə yoxdur"
                  description="İlk bölməni əlavə edib blok tipini və məzmununu seçin."
                  action={<button className={styles.primaryButton} type="button" onClick={addSection}><Icon name="plus" size={16} />Bölmə əlavə et</button>}
                />
              )}
            </section>

            <aside className={styles.contentInspector}>
              <section>
                <h2>Məzmun tamlığı</h2>
                <div className={styles.completionRing} style={{ "--completion": `${contentCompletion}%` }}><span>{contentCompletion}%</span></div>
                <p className={styles.builderInspectorText}>Başlıq və açıqlaması tamamlanan bölmələrin nisbəti.</p>
              </section>
              <section>
                <h2>SEO məlumatları</h2>
                <div className={styles.builderInspectorFields}>
                  <label>SEO başlığı<input value={page.seo.title} onChange={(event) => updateSeo("title", event.target.value)} /></label>
                  <label>SEO açıqlaması<textarea rows={4} value={page.seo.description} onChange={(event) => updateSeo("description", event.target.value)} /></label>
                  <label>Kanonik URL<input value={page.seo.canonicalUrl} onChange={(event) => updateSeo("canonicalUrl", event.target.value)} /></label>
                </div>
              </section>
              <section>
                <h2>Versiya tarixçəsi</h2>
                {revisions.length ? (
                  <div className={styles.revisionList}>
                    {revisions.slice(0, 8).map((revision) => (
                      <button type="button" key={revision.id} onClick={() => setPendingRestore(revision)}>
                        <span><Icon name="activity" size={14} /></span>
                        <p><strong>{revision.actorLabel || "Sistem"}</strong><small>{formatRevisionDate(revision.createdAt)}</small></p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className={styles.builderInspectorText}>İlk dəyişiklik saxlanıldıqdan sonra əvvəlki versiyalar burada görünəcək.</p>
                )}
              </section>
            </aside>
          </div>
        </>
      ) : (
        <EmptyState
          icon="content"
          title="Səhifə yoxdur"
          description="CMS-də ilk səhifəni yaradaraq başlayın."
          action={<button className={styles.primaryButton} type="button" onClick={() => setShowCreate(true)}>Yeni səhifə</button>}
        />
      )}

      {showCreate && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setShowCreate(false)}>
          <div className={styles.builderModal} role="dialog" aria-modal="true" aria-labelledby="new-page-title" onMouseDown={(event) => event.stopPropagation()}>
            <div><span><Icon name="content" size={22} /></span><div><h2 id="new-page-title">Yeni səhifə yarat</h2><p>Səhifə əvvəlcə qaralama kimi yaradılacaq.</p></div></div>
            <div className={styles.blockForm}>
              <div className={styles.formField}><label htmlFor="new-title">Səhifə adı <span>*</span></label><input id="new-title" value={newPage.title} onChange={(event) => setNewPage((current) => ({ ...current, title: event.target.value }))} /></div>
              <div className={styles.formField}><label htmlFor="new-slug">URL açarı <span>*</span></label><input id="new-slug" placeholder="meselen-yeni-sehife" value={newPage.slug} onChange={(event) => setNewPage((current) => ({ ...current, slug: event.target.value }))} /></div>
              <div className={styles.formField}><label htmlFor="new-excerpt">Qısa açıqlama</label><textarea id="new-excerpt" rows={3} value={newPage.excerpt} onChange={(event) => setNewPage((current) => ({ ...current, excerpt: event.target.value }))} /></div>
              <div className={styles.formField}><label htmlFor="new-template">Şablon</label><select id="new-template" value={newPage.template} onChange={(event) => setNewPage((current) => ({ ...current, template: event.target.value }))}><option value="STANDARD">Standart</option><option value="LANDING">Landing</option><option value="CONTACT">Əlaqə</option><option value="LEGAL">Hüquqi sənəd</option></select></div>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} type="button" onClick={() => setShowCreate(false)}>Ləğv et</button>
              <button className={styles.primaryButton} type="button" disabled={saving} onClick={createPage}>{saving ? "Yaradılır..." : "Səhifə yarat"}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingRestore)}
        title="Bu versiya bərpa edilsin?"
        description="Cari vəziyyət ayrıca versiya kimi saxlanacaq və seçilmiş köhnə məzmun yenidən aktiv olacaq."
        confirmLabel="Versiyanı bərpa et"
        onCancel={() => setPendingRestore(null)}
        onConfirm={restoreRevision}
      />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

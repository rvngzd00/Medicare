"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resourceConfigs } from "./adminData";
import { Icon } from "./AdminIcons";
import { ADMIN_DEMO_MODE, adminApi } from "./adminApi";
import {
  adaptLookupOptions,
  adaptResourceRecord,
  backendRecordToEditorValues,
  editorValuesToBackend,
  entitySuccessMessage,
  mediaFieldForResource,
  normalizeAdminError,
} from "./adminAdapters";
import { AdminAsyncState, DemoNotice, PageHeader, Toast } from "./AdminPrimitives";
import ServicePriceEditor from "./ServicePriceEditor";
import styles from "../../app/admin/admin.module.css";

const unsupportedRealEditorFields = {
  doctors: new Set(["schedule", "hours"]),
  departments: new Set(["head", "doctors", "services", "faq"]),
  services: new Set(["duration", "preparation", "included"]),
  articles: new Set(["tags", "related"]),
  users: new Set(["phone", "jobTitle", "language"]),
};

function hasNewArticleCover(values) {
  return typeof File !== "undefined" && values.cover instanceof File;
}

function buildInitialValues(config, id) {
  const row = config.rows.find((item) => item.id === id);
  const initial = {};
  config.groups.flatMap((group) => group.fields).forEach((field) => {
    if (field.type === "toggle") initial[field.name] = field.defaultChecked || false;
    else if (["multiselect", "tags", "price-list"].includes(field.type)) initial[field.name] = [];
    else initial[field.name] = "";
  });
  if (!row) return initial;

  const nameWithoutPrefix = row.name.replace(/^Dr\.\s*/, "");
  const [firstName, ...surnameParts] = nameWithoutPrefix.split(" ");
  return {
    ...initial,
    ...row,
    firstName,
    lastName: surnameParts.join(" "),
    title: row.name,
    slug: row.id,
    active: ["Aktiv", "Dərc olunub"].includes(row.status),
    status: row.status,
    featured: Boolean(row.featured),
    bio: row.detail || "",
    summary: row.detail || "",
    lead: row.detail || "",
    price: String(row.price || "").match(/\d+/)?.[0] || "",
  };
}

function optionParts(option) {
  return typeof option === "object"
    ? { value: option.value, label: option.label }
    : { value: option, label: option };
}

async function loadEditorLookups(resource, signal) {
  const list = (entity, params = {}) => adminApi.resources.list(
    entity,
    { limit: 100, ...params },
    { signal },
  );

  if (resource === "doctors") {
    const [departments, branches] = await Promise.all([
      list("departments", { active: "true" }),
      list("branches", { active: "true" }),
    ]);
    return {
      department: adaptLookupOptions(departments),
      branch: adaptLookupOptions(branches),
    };
  }

  if (resource === "services") {
    const departments = await list("departments", { active: "true" });
    return { department: adaptLookupOptions(departments) };
  }

  if (resource === "articles") {
    const [categories, users] = await Promise.all([
      list("article-categories", { active: "true" }),
      adminApi.users.list({ limit: 100, status: "ACTIVE" }, { signal }),
    ]);
    return {
      category: adaptLookupOptions(categories),
      author: adaptLookupOptions(users, (user) => `${user.firstName} ${user.lastName}`),
    };
  }

  if (resource === "users") {
    const roles = await adminApi.roles.list({ signal });
    return { role: adaptLookupOptions(roles) };
  }

  return {};
}

function FieldHelp({ field, value }) {
  return (
    <div className={styles.fieldMeta}>
      <span>{field.help || (field.required ? "Məcburi sahə" : "İstəyə bağlı")}</span>
      {field.maxLength && <small>{String(value || "").length}/{field.maxLength}</small>}
    </div>
  );
}

function RichTextField({ field, value, onChange, invalid }) {
  const textareaRef = useRef(null);

  function insertMarkup(prefix, suffix = prefix) {
    const element = textareaRef.current;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selection = value.slice(start, end);
    const nextValue = `${value.slice(0, start)}${prefix}${selection || "mətn"}${suffix}${value.slice(end)}`;
    onChange(nextValue);
    window.requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + prefix.length, start + prefix.length + (selection || "mətn").length);
    });
  }

  return (
    <div className={`${styles.richEditor} ${invalid ? styles.inputInvalid : ""}`}>
      <div className={styles.editorToolbar} role="toolbar" aria-label="Mətn formatlama">
        {ADMIN_DEMO_MODE && <button type="button" aria-label="Qalın" onClick={() => insertMarkup("**")}><strong>B</strong></button>}
        {ADMIN_DEMO_MODE && <button type="button" aria-label="Maili" onClick={() => insertMarkup("_")}><em>I</em></button>}
        <button type="button" aria-label="İkinci səviyyəli başlıq" onClick={() => insertMarkup("\n\n## ", "\n\n")}>H2</button>
        <button type="button" aria-label="Üçüncü səviyyəli başlıq" onClick={() => insertMarkup("\n\n### ", "\n\n")}>H3</button>
        <span />
        {ADMIN_DEMO_MODE && <button type="button" aria-label="Siyahı" onClick={() => insertMarkup("\n- ", "\n")}>•</button>}
        {ADMIN_DEMO_MODE && <button type="button" aria-label="Keçid" onClick={() => insertMarkup("[", "](https://)")}>
          <Icon name="external" size={14} />
        </button>}
      </div>
      <textarea
        ref={textareaRef}
        id={field.name}
        value={value}
        rows={10}
        placeholder={field.placeholder}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className={styles.editorFooter}>
        <span>Strukturlaşdırılmış mətn</span>
        <span>{String(value || "").trim().split(/\s+/).filter(Boolean).length} söz</span>
      </div>
    </div>
  );
}

function TagsField({ field, value, onChange, invalid }) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const clean = draft.trim();
    if (!clean || value.includes(clean)) return;
    onChange([...value, clean]);
    setDraft("");
  }

  return (
    <div className={`${styles.tagsInput} ${invalid ? styles.inputInvalid : ""}`} onClick={(event) => event.currentTarget.querySelector("input")?.focus()}>
      {value.map((tag) => (
        <span key={tag}>
          {tag}
          <button type="button" aria-label={`${tag} teqini sil`} onClick={() => onChange(value.filter((item) => item !== tag))}>
            <Icon name="close" size={12} />
          </button>
        </span>
      ))}
      <input
        id={field.name}
        value={draft}
        placeholder={value.length ? "" : field.placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={addTag}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addTag();
          }
          if (event.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
      />
    </div>
  );
}

function FileField({ field, value, onChange, invalid }) {
  const inputRef = useRef(null);
  const displayValue = typeof File !== "undefined" && value instanceof File ? value.name : value;
  return (
    <div className={`${styles.uploadField} ${invalid ? styles.inputInvalid : ""}`}>
      <input
        ref={inputRef}
        id={field.name}
        type="file"
        accept={field.accept}
        onChange={(event) => onChange(event.target.files?.[0] || "")}
      />
      <button type="button" onClick={() => inputRef.current?.click()}>
        <span className={styles.uploadIcon}><Icon name={displayValue ? "check" : "upload"} size={22} /></span>
        <span>
          <strong>{displayValue || "Faylı seçin və ya bura sürüşdürün"}</strong>
          <small>{field.help || "PNG, JPG və ya WebP · maksimum 5 MB"}</small>
        </span>
        <em>{displayValue ? "Dəyiş" : "Fayl seç"}</em>
      </button>
    </div>
  );
}

function FormField({ field, value, error, onChange }) {
  if (field.type === "price-list") {
    return (
      <ServicePriceEditor
        value={value}
        error={error}
        help={field.help}
        onChange={onChange}
      />
    );
  }

  const fieldId = `field-${field.name}`;
  const describedBy = error ? `${fieldId}-error` : `${fieldId}-help`;

  if (field.type === "toggle") {
    return (
      <div className={styles.toggleField}>
        <div>
          <label htmlFor={fieldId}>{field.label}</label>
          {field.help && <p>{field.help}</p>}
        </div>
        <label className={styles.switch}>
          <input id={fieldId} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
          <span aria-hidden="true" />
          <em className={styles.srOnly}>{value ? "Aktiv" : "Deaktiv"}</em>
        </label>
      </div>
    );
  }

  return (
    <div className={`${styles.formField} ${field.width === "half" ? styles.fieldHalf : ""}`}>
      <label htmlFor={field.type === "file" || field.type === "tags" ? field.name : fieldId}>
        {field.label}
        {field.required && <span aria-hidden="true">*</span>}
      </label>

      {["text", "email", "password", "tel", "number", "date", "time", "datetime-local"].includes(field.type) && (
        <input
          id={fieldId}
          type={field.type}
          value={value}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={error ? styles.inputInvalid : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {field.type === "slug" && (
        <div className={`${styles.slugInput} ${error ? styles.inputInvalid : ""}`}>
          <span>medicarehospital.az/</span>
          <input
            id={fieldId}
            value={value}
            placeholder={field.placeholder}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value.toLocaleLowerCase("az").replace(/ə/g, "e").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))}
          />
        </div>
      )}

      {field.type === "textarea" && (
        <textarea
          id={fieldId}
          value={value}
          rows={5}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={error ? styles.inputInvalid : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {field.type === "richtext" && (
        <RichTextField field={{ ...field, name: fieldId }} value={value} invalid={Boolean(error)} onChange={onChange} />
      )}

      {field.type === "select" && (
        <div className={styles.selectWrap}>
          <select
            id={fieldId}
            value={value}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={error ? styles.inputInvalid : ""}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">Seçim edin</option>
            {(field.options || []).map((option) => {
              const parts = optionParts(option);
              return <option key={parts.value} value={parts.value}>{parts.label}</option>;
            })}
          </select>
          <Icon name="chevronDown" size={15} />
        </div>
      )}

      {field.type === "multiselect" && (
        <div className={styles.multiSelectWrap}>
          <select
            id={fieldId}
            multiple
            value={value}
            aria-describedby={describedBy}
            onChange={(event) => onChange([...event.target.selectedOptions].map((option) => option.value))}
          >
            {(field.options || []).map((option) => {
              const parts = optionParts(option);
              return <option key={parts.value} value={parts.value}>{parts.label}</option>;
            })}
          </select>
          <small>Birdən çox seçim üçün ⌘ / Ctrl düyməsini saxlayın.</small>
        </div>
      )}

      {field.type === "tags" && <TagsField field={field} value={value} invalid={Boolean(error)} onChange={onChange} />}
      {field.type === "file" && <FileField field={field} value={value} invalid={Boolean(error)} onChange={onChange} />}

      {error ? <p className={styles.fieldError} id={`${fieldId}-error`} role="alert"><Icon name="warning" size={14} />{error}</p> : <FieldHelp field={field} value={value} />}
    </div>
  );
}

export default function ResourceEditor({ resource, mode = "new", id }) {
  const router = useRouter();
  const config = resourceConfigs[resource];
  const [values, setValues] = useState(() => buildInitialValues(config, id));
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveState, setSaveState] = useState(mode === "edit" ? "Yadda saxlanılıb" : "Yeni qeyd");
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lookupOptions, setLookupOptions] = useState({});
  const [loadedTitle, setLoadedTitle] = useState("");
  const editRow = useMemo(() => config.rows.find((row) => row.id === id), [config, id]);
  const itemTitle = mode === "edit" ? (loadedTitle || editRow?.name || config.singular) : `Yeni ${config.singular.toLocaleLowerCase("az")}`;
  const visibleGroups = useMemo(() => {
    if (ADMIN_DEMO_MODE) return config.groups;
    const hidden = unsupportedRealEditorFields[resource] || new Set();
    return config.groups
      .map((group) => ({
        ...group,
        fields: group.fields.filter((field) => (
          !hidden.has(field.name)
          && !(resource === "articles" && field.name === "coverAlt" && !hasNewArticleCover(values))
        )),
      }))
      .filter((group) => group.fields.length);
  }, [config.groups, resource, values]);

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;
    const controller = new AbortController();

    async function loadEditor() {
      setLoading(true);
      setLoadError("");
      try {
        const lookupPromise = loadEditorLookups(resource, controller.signal);
        let record = null;
        if (mode === "edit") {
          if (resource === "users") {
            record = await adminApi.users.get(id, { signal: controller.signal });
          } else {
            record = await adminApi.resources.get(resource, id, { signal: controller.signal });
          }
        }
        const lookups = await lookupPromise;
        if (controller.signal.aborted) return;
        setLookupOptions(lookups);
        if (record) {
          setValues((current) => ({
            ...current,
            ...backendRecordToEditorValues(resource, record),
          }));
          setLoadedTitle(adaptResourceRecord(resource, record)?.name || config.singular);
        }
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setLoadError(normalizeAdminError(requestError, `${config.singular} məlumatlarını yükləmək mümkün olmadı.`));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadEditor();
    return () => controller.abort();
  }, [config.singular, id, mode, reloadKey, resource]);

  useEffect(() => {
    if (saveState === "Dəyişiklik var") {
      const timer = window.setTimeout(
        () => setSaveState(ADMIN_DEMO_MODE ? "Qaralama saxlanıldı" : "Yadda saxlanmayıb"),
        1200,
      );
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [saveState, values]);

  function updateValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSaveState("Dəyişiklik var");
    setSaved(false);
  }

  function validate() {
    const nextErrors = {};
    visibleGroups.flatMap((group) => group.fields).forEach((field) => {
      const value = values[field.name];
      const required = field.required || (field.requiredOnCreate && mode === "new");
      if (required && (!value || (Array.isArray(value) && !value.length))) nextErrors[field.name] = "Bu sahənin doldurulması vacibdir.";
      if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) nextErrors[field.name] = "Düzgün e-mail ünvanı daxil edin.";
      if (field.maxLength && String(value || "").length > field.maxLength) nextErrors[field.name] = `Maksimum ${field.maxLength} simvol daxil edilə bilər.`;
    });
    if (values.seoTitle && !values.seoDescription) nextErrors.seoDescription = "SEO başlığı üçün meta təsvir də daxil edilməlidir.";
    if (values.seoDescription && !values.seoTitle) nextErrors.seoTitle = "Meta təsvir üçün SEO başlığı da daxil edilməlidir.";
    if (resource === "articles" && values.status === "Planlaşdırılıb" && !values.publishDate) {
      nextErrors.publishDate = "Planlaşdırılmış məqalə üçün dərc tarixi seçilməlidir.";
    }
    if (resource === "services" && Array.isArray(values.priceItems)) {
      if (values.priceItems.some((item) => !String(item.name || "").trim())) {
        nextErrors.priceItems = "Bütün qiymət sətirlərində xidmət adı yazılmalıdır.";
      } else if (values.priceItems.some((item) => item.price !== "" && item.price !== null && Number(item.price) < 0)) {
        nextErrors.priceItems = "Qiymət mənfi ola bilməz.";
      }
    }
    if (
      resource === "users" &&
      values.password &&
      (
        String(values.password).length < 12 ||
        !/[a-z]/.test(values.password) ||
        !/[A-Z]/.test(values.password) ||
        !/\d/.test(values.password) ||
        !/[^A-Za-z0-9]/.test(values.password)
      )
    ) {
      nextErrors.password = "Şifrə ən azı 12 simvol, böyük/kiçik hərf, rəqəm və xüsusi simvol daxil etməlidir.";
    }
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) document.getElementById(`field-${firstInvalid}`)?.focus();
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(event, intent = "publish") {
    event?.preventDefault();
    if (!validate()) {
      setToast({ tone: "warning", message: "Formda yoxlanmalı sahələr var." });
      return;
    }
    setSubmitting(true);
    setSaveState("Yadda saxlanılır");
    try {
      if (ADMIN_DEMO_MODE) {
        await new Promise((resolve) => window.setTimeout(resolve, 320));
      } else {
        const payload = editorValuesToBackend(resource, values, { mode, intent });
        const mediaConfig = mediaFieldForResource(resource);
        const mediaValue = mediaConfig ? values[mediaConfig.formField] : null;
        if (mediaConfig && typeof File !== "undefined" && mediaValue instanceof File) {
          const altText = String(values[mediaConfig.altField] || values.name || values.title || "Medicare media");
          const media = await adminApi.media.upload(mediaValue, { altText });
          payload[mediaConfig.payloadField] = media.id;
        }

        const record = resource === "users"
          ? mode === "edit"
            ? await adminApi.users.update(id, payload)
            : await adminApi.users.create(payload)
          : mode === "edit"
            ? await adminApi.resources.update(resource, id, payload)
            : await adminApi.resources.create(resource, payload);

        if (record) {
          setValues((current) => ({
            ...current,
            ...backendRecordToEditorValues(resource, record),
          }));
          setLoadedTitle(adaptResourceRecord(resource, record)?.name || config.singular);
          if (mode === "new" && record.id) {
            router.replace(`/admin/${resource}/${record.id}/edit`);
          }
        }
      }
      setSaved(true);
      setSaveState("Yadda saxlanılıb");
      setToast({
        tone: "success",
        message: ADMIN_DEMO_MODE
          ? intent === "draft"
            ? `${config.singular} qaralama kimi saxlanıldı.`
            : `${config.singular} məlumatları cari baxışda yeniləndi.`
          : entitySuccessMessage(resource, mode === "new" ? "create" : "update"),
      });
    } catch (requestError) {
      setSaveState("Yadda saxlanmadı");
      setToast({ tone: "warning", message: normalizeAdminError(requestError, "Dəyişiklikləri yadda saxlamaq mümkün olmadı.") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.editorPage}>
      <PageHeader
        eyebrow={mode === "edit" ? `${config.singular} redaktəsi` : "Yeni qeyd"}
        title={itemTitle}
        description={mode === "edit" ? "Məlumatları yeniləyin və dəyişiklikləri yayımlayın." : `${config.singular} üçün bütün vacib məlumatları daxil edin.`}
        backHref={`/admin/${resource}`}
        actions={(
          <div className={styles.saveStatus}>
            <span className={saveState === "Dəyişiklik var" ? styles.savePending : ""} />
            {saveState}
          </div>
        )}
      />

      {loading ? (
        <AdminAsyncState type="loading" title={`${config.singular} redaktoru hazırlanır`} />
      ) : loadError ? (
        <AdminAsyncState type="error" description={loadError} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : (
      <form onSubmit={submit} noValidate>
        <div className={styles.editorLayout}>
          <div className={styles.editorMain}>
            {saved && (
              <div className={styles.successBanner} role="status">
                <span><Icon name="check" size={18} /></span>
                <div>
                  <strong>Dəyişikliklər yadda saxlanıldı</strong>
                  <p>{ADMIN_DEMO_MODE ? "Demo rejimində dəyişiklik cari baxışda tətbiq edildi." : "Məlumat backend-də yeniləndi və növbəti public sorğuda görünəcək."}</p>
                </div>
                <button type="button" aria-label="Məlumatı bağla" onClick={() => setSaved(false)}><Icon name="close" size={16} /></button>
              </div>
            )}

            {visibleGroups.map((group, groupIndex) => (
              <section className={styles.formSection} key={group.title}>
                <div className={styles.formSectionHeader}>
                  <span>{String(groupIndex + 1).padStart(2, "0")}</span>
                  <div><h2>{group.title}</h2><p>{group.description}</p></div>
                </div>
                <div className={styles.formGrid}>
                  {group.fields.map((field) => {
                    const runtimeField = {
                      ...field,
                      ...(lookupOptions[field.name] ? { options: lookupOptions[field.name] } : {}),
                      ...(resource === "articles" && field.name === "status" && !ADMIN_DEMO_MODE
                        ? { options: ["Qaralama", "Dərc olunub", "Planlaşdırılıb", "Arxivdə"] }
                        : {}),
                      required: field.required || (field.requiredOnCreate && mode === "new"),
                    };
                    return (
                      <FormField
                        field={runtimeField}
                        value={values[field.name]}
                        error={errors[field.name]}
                        key={field.name}
                        onChange={(value) => updateValue(field.name, value)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <aside className={styles.editorSidebar}>
            <section className={styles.publishCard}>
              <div className={styles.publishHeader}>
                <h2>Nəşr parametrləri</h2>
                <span className={styles.draftLabel}>{values.status || (values.active ? "Aktiv" : "Qaralama")}</span>
              </div>
              <dl className={styles.publishDetails}>
                <div><dt><Icon name="eye" size={16} />Görünmə</dt><dd>{values.active === false ? "Gizli" : "Public"}</dd></div>
                <div><dt><Icon name="clock" size={16} />Son redaktə</dt><dd>İndi</dd></div>
                <div><dt><Icon name="users" size={16} />Müəllif</dt><dd>Nigar M.</dd></div>
              </dl>
              <div className={styles.publishActions}>
                <button className={styles.primaryButton} type="submit" disabled={submitting}>
                  {submitting ? <span className={styles.buttonSpinner} /> : <Icon name="check" size={17} />}
                  {submitting ? "Yadda saxlanılır..." : "Yadda saxla"}
                </button>
                <button className={styles.secondaryButton} type="button" disabled={submitting} onClick={(event) => submit(event, "draft")}>
                  {resource === "users" ? "Deaktiv saxla" : "Qaralama saxla"}
                </button>
              </div>
              <Link className={styles.cancelLink} href={`/admin/${resource}`}>Dəyişiklikləri ləğv et</Link>
            </section>

            {resource !== "users" && <section className={styles.seoPreviewCard}>
              <div className={styles.sideCardHeader}>
                <h2>Axtarış önizləməsi</h2>
                <span><Icon name="search" size={15} /> SEO</span>
              </div>
              <div className={styles.googlePreview}>
                <span>https://medicarehospital.az/{resource}/{values.slug || "sehife-slug"}</span>
                <strong>{values.seoTitle || values.title || values.name || itemTitle} | Medicare</strong>
                <p>{values.seoDescription || values.summary || values.lead || "Bu səhifə üçün meta təsvir daxil etdikdə axtarış önizləməsi burada görünəcək."}</p>
              </div>
              <div className={styles.seoScore}>
                <span><i style={{ "--score": "78%" }} /></span>
                <div><strong>SEO tamamlanması: 78%</strong><small>Başlıq və təsvir optimallaşdırıla bilər.</small></div>
              </div>
            </section>}

            <section className={styles.auditCard}>
              <Icon name="activity" size={18} />
              <div><strong>Audit jurnalı aktivdir</strong><p>Bütün dəyişikliklər istifadəçi və vaxt möhürü ilə qeydə alınacaq.</p></div>
            </section>
          </aside>
        </div>
      </form>
      )}

      {ADMIN_DEMO_MODE && <DemoNotice />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

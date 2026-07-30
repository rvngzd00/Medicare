"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SmartImage from "@/components/common/SmartImage";
import { executiveDirector as demoDirector } from "@/data/site";
import { Icon } from "./AdminIcons";
import {
  ADMIN_DEMO_MODE,
  adminApi,
  getAdminApiBase,
} from "./adminApi";
import { normalizeAdminError } from "./adminAdapters";
import {
  AdminAsyncState,
  DemoNotice,
  PageHeader,
  Toast,
} from "./AdminPrimitives";
import styles from "../../app/admin/admin.module.css";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const WHY_PREVIEW_FALLBACK = {
  eyebrow: "Niyə Medicare?",
  title: "Tibbi dəqiqlik, insani diqqətlə birlikdə",
  description:
    "Sistemimizi pasiyentin özünü məlumatlı, təhlükəsiz və rahat hiss etməsi üçün qurmuşuq.",
};
const VALIDATION_FIELD_IDS = {
  fullName: "director-name",
  role: "director-role",
  message: "director-message",
  signature: "director-signature",
};

const demoRecord = {
  ...demoDirector,
  key: "primary",
  photoId: null,
  photo: null,
};

function formFromRecord(record) {
  return {
    fullName: record?.fullName || "",
    role: record?.role || "",
    message: record?.message || "",
    signature: record?.signature || "",
    active: record?.active !== false,
  };
}

function initials(value) {
  return String(value || "M")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("az");
}

function resolveMediaUrl(media) {
  const source = media?.url || media?.thumbnailUrl || "";
  if (!source || /^(?:https?:\/\/|blob:)/i.test(source)) return source;
  if (!/^\/uploads\//i.test(source) || typeof window === "undefined") {
    return source;
  }

  try {
    const apiUrl = new URL(getAdminApiBase(), window.location.origin);
    return new URL(source, apiUrl.origin).toString();
  } catch {
    return source;
  }
}

export default function DirectorEditor() {
  const [record, setRecord] = useState(ADMIN_DEMO_MODE ? demoRecord : null);
  const [form, setForm] = useState(() => formFromRecord(demoRecord));
  const [photoFile, setPhotoFile] = useState(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [localPreview, setLocalPreview] = useState("");
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState(null);
  const [homePreview, setHomePreview] = useState({
    section: WHY_PREVIEW_FALLBACK,
    visible: true,
    unavailable: false,
  });
  const committedUploadRef = useRef(false);

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;
    const controller = new AbortController();

    async function loadDirector() {
      setLoading(true);
      setLoadError("");
      try {
        const [profile, publicHomePage] = await Promise.all([
          adminApi.executiveDirector.get({ signal: controller.signal }),
          adminApi.publicContent
            .getPage("home", { signal: controller.signal })
            .catch((error) => {
              if (controller.signal.aborted || error.name === "AbortError") {
                throw error;
              }
              return null;
            }),
        ]);
        if (controller.signal.aborted) return;
        setRecord(profile);
        setForm(formFromRecord(profile));
        if (!publicHomePage) {
          setHomePreview({
            section: WHY_PREVIEW_FALLBACK,
            visible: null,
            unavailable: true,
          });
        } else {
          const sections = Array.isArray(publicHomePage.sections)
            ? publicHomePage.sections
            : [];
          const whySection = sections.find(
            (section) => section.key === "why-medicare",
          );
          const hasConfiguredLayout = publicHomePage.sectionLayoutConfigured ??
            sections.length > 0;
          setHomePreview({
            section: whySection || WHY_PREVIEW_FALLBACK,
            visible: Boolean(whySection) || !hasConfiguredLayout,
            unavailable: false,
          });
        }
      } catch (error) {
        if (controller.signal.aborted || error.name === "AbortError") return;
        setLoadError(
          normalizeAdminError(
            error,
            "Baş direktor məlumatlarını yükləmək mümkün olmadı.",
          ),
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadDirector();
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    if (!photoFile) {
      setLocalPreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(photoFile);
    setLocalPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  const existingPhoto = photoRemoved ? "" : resolveMediaUrl(record?.photo);
  const previewPhoto = localPreview || existingPhoto;
  const previewCardVisible = form.active && homePreview.visible !== false;
  const previewStatus = !form.active
    ? "Direktor gizlidir"
    : homePreview.unavailable
      ? "Ana bölmə yoxlanmadı"
      : homePreview.visible === false
        ? "Ana bölmə gizlidir"
        : "Görünür";
  const previewStatusLive = form.active &&
    homePreview.visible === true &&
    !homePreview.unavailable;
  const previewOverlay = !form.active
    ? "Direktor kartı public görünüşdə gizlidir"
    : "“Niyə Medicare?” bölməsi public görünüşdə gizlidir";

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function choosePhoto(event) {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setPhotoFile(null);
      setErrors((current) => ({
        ...current,
        photo: "Yalnız JPG, PNG, WebP və AVIF şəkilləri qəbul edilir.",
      }));
      setPhotoInputKey((value) => value + 1);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setPhotoFile(null);
      setErrors((current) => ({
        ...current,
        photo: "Şəkil ölçüsü 8 MB-dan böyük ola bilməz.",
      }));
      setPhotoInputKey((value) => value + 1);
      return;
    }
    setPhotoFile(file);
    setPhotoRemoved(false);
    setErrors((current) => ({ ...current, photo: undefined }));
  }

  function removePhoto() {
    setPhotoFile(null);
    setPhotoRemoved(true);
    setPhotoInputKey((value) => value + 1);
    setErrors((current) => ({ ...current, photo: undefined }));
  }

  async function saveDirector() {
    const nextErrors = {};
    const fullName = form.fullName.trim();
    const role = form.role.trim();
    if (fullName.length < 2) nextErrors.fullName = "Ad və soyad daxil edin.";
    if (role.length < 2) nextErrors.role = "Vəzifəni daxil edin.";
    if (form.message.length > 2000) nextErrors.message = "Mətn 2000 simvoldan uzun ola bilməz.";
    if (form.signature.length > 300) nextErrors.signature = "İmza 300 simvoldan uzun ola bilməz.";
    setErrors(nextErrors);
    const firstInvalidField = Object.keys(nextErrors)[0];
    if (firstInvalidField) {
      window.requestAnimationFrame(() => {
        document.getElementById(VALIDATION_FIELD_IDS[firstInvalidField])?.focus();
      });
      return;
    }

    setSaving(true);
    let uploadedMedia = null;
    committedUploadRef.current = false;
    try {
      if (ADMIN_DEMO_MODE) {
        await new Promise((resolve) => window.setTimeout(resolve, 320));
        setRecord((current) => ({
          ...current,
          ...form,
          fullName,
          role,
          photo: previewPhoto ? { url: previewPhoto } : null,
          photoId: previewPhoto ? current?.photoId || "demo-photo" : null,
        }));
        setToast({
          tone: "success",
          message: "Baş direktor məlumatları demo baxışında yeniləndi.",
        });
        return;
      }

      if (photoFile) {
        uploadedMedia = await adminApi.media.upload(photoFile, {
          altText: `${fullName} — ${role}`,
        });
      }

      const nextPhotoId = uploadedMedia?.id ||
        (photoRemoved ? null : record?.photoId || null);
      const updated = await adminApi.executiveDirector.update({
        fullName,
        role,
        message: form.message.trim() || null,
        signature: form.signature.trim() || null,
        photoId: nextPhotoId,
        active: Boolean(form.active),
      });
      committedUploadRef.current = true;

      const oldPhotoId = record?.photoId;
      setRecord(updated);
      setForm(formFromRecord(updated));
      setPhotoFile(null);
      setPhotoRemoved(false);
      setPhotoInputKey((value) => value + 1);
      setToast({
        tone: "success",
        message: "Baş direktor məlumatları və ana səhifə görünüşü yeniləndi.",
      });

      if (oldPhotoId && oldPhotoId !== updated.photoId) {
        adminApi.media.remove(oldPhotoId).catch(() => {});
      }
    } catch (error) {
      if (uploadedMedia && !committedUploadRef.current) {
        adminApi.media.remove(uploadedMedia.id).catch(() => {});
      }
      setToast({
        tone: "warning",
        message: normalizeAdminError(
          error,
          "Baş direktor məlumatlarını yadda saxlamaq mümkün olmadı.",
        ),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.directorEditorPage}>
      <PageHeader
        eyebrow="Ana səhifə"
        title="Baş direktor"
        description="Baş direktorun adını, vəzifəsini, fotosunu, müraciətini, imzasını və public görünməsini idarə edin."
        backHref="/admin/content"
        actions={(
          <>
            <Link
              className={styles.secondaryButton}
              href="/#why-medicare"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="eye" size={17} />Ana səhifədə aç
            </Link>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={saving || loading || Boolean(loadError)}
              onClick={saveDirector}
            >
              <Icon name="check" size={17} />
              {saving ? "Saxlanılır..." : "Yadda saxla"}
            </button>
          </>
        )}
      />

      {loading ? (
        <AdminAsyncState title="Baş direktor məlumatları yüklənir" />
      ) : loadError ? (
        <AdminAsyncState
          type="error"
          description={loadError}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : (
        <div className={styles.directorEditorLayout}>
          <section className={styles.directorFormPanel}>
            <div className={styles.directorPanelHeader}>
              <span><Icon name="users" size={20} /></span>
              <div>
                <h2>Profil məlumatları</h2>
                <p>Dəyişikliklər public ana səhifədəki direktor kartına tətbiq olunur.</p>
              </div>
            </div>

            <div className={styles.directorFormGrid}>
              <div className={`${styles.formField} ${styles.fieldHalf}`}>
                <label htmlFor="director-name">Ad və soyad <span>*</span></label>
                <input
                  id="director-name"
                  className={errors.fullName ? styles.inputInvalid : ""}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? "director-name-error" : undefined}
                  maxLength={160}
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Məsələn, Dr. Kamran Rzayev"
                />
                <div className={styles.fieldMeta}><span>Public kartda görünən tam ad.</span><small>{form.fullName.length}/160</small></div>
                {errors.fullName && <p className={styles.fieldError} id="director-name-error" role="alert"><Icon name="warning" size={13} />{errors.fullName}</p>}
              </div>

              <div className={`${styles.formField} ${styles.fieldHalf}`}>
                <label htmlFor="director-role">Vəzifə <span>*</span></label>
                <input
                  id="director-role"
                  className={errors.role ? styles.inputInvalid : ""}
                  aria-invalid={Boolean(errors.role)}
                  aria-describedby={errors.role ? "director-role-error" : undefined}
                  maxLength={160}
                  value={form.role}
                  onChange={(event) => updateField("role", event.target.value)}
                  placeholder="Baş direktor"
                />
                <div className={styles.fieldMeta}><span>Adın altında göstərilən vəzifə.</span><small>{form.role.length}/160</small></div>
                {errors.role && <p className={styles.fieldError} id="director-role-error" role="alert"><Icon name="warning" size={13} />{errors.role}</p>}
              </div>

              <div className={styles.formField}>
                <label htmlFor="director-message">Qısa müraciət / mətn</label>
                <textarea
                  id="director-message"
                  className={errors.message ? styles.inputInvalid : ""}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "director-message-error" : undefined}
                  rows={6}
                  maxLength={2000}
                  value={form.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  placeholder="Pasiyentlərə və ziyarətçilərə qısa müraciət..."
                />
                <div className={styles.fieldMeta}><span>Sadə mətn kimi təhlükəsiz göstərilir.</span><small>{form.message.length}/2000</small></div>
                {errors.message && <p className={styles.fieldError} id="director-message-error" role="alert"><Icon name="warning" size={13} />{errors.message}</p>}
              </div>

              <div className={styles.formField}>
                <label htmlFor="director-signature">İmza</label>
                <input
                  id="director-signature"
                  className={errors.signature ? styles.inputInvalid : ""}
                  aria-invalid={Boolean(errors.signature)}
                  aria-describedby={errors.signature ? "director-signature-error" : undefined}
                  maxLength={300}
                  value={form.signature}
                  onChange={(event) => updateField("signature", event.target.value)}
                  placeholder="Dr. Kamran Rzayev"
                />
                <div className={styles.fieldMeta}><span>Kartda imza üslubunda göstərilən qısa sətir.</span><small>{form.signature.length}/300</small></div>
                {errors.signature && <p className={styles.fieldError} id="director-signature-error" role="alert"><Icon name="warning" size={13} />{errors.signature}</p>}
              </div>

              <div className={styles.directorPhotoControl}>
                <div className={styles.directorPhotoThumb}>
                  {previewPhoto ? (
                    <SmartImage
                      src={previewPhoto}
                      alt={`${form.fullName || "Baş direktor"} fotosu`}
                      sizes="96px"
                      fallbackLabel={initials(form.fullName)}
                    />
                  ) : (
                    <span>{initials(form.fullName)}</span>
                  )}
                </div>
                <div className={styles.directorPhotoActions}>
                  <div><strong>Direktor fotosu</strong><small>JPG, PNG, WebP və ya AVIF · maksimum 8 MB</small></div>
                  <label htmlFor="director-photo"><Icon name="image" size={15} />Şəkil seç</label>
                  <input
                    key={photoInputKey}
                    id="director-photo"
                    type="file"
                    aria-invalid={Boolean(errors.photo)}
                    aria-describedby={errors.photo ? "director-photo-error" : undefined}
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={choosePhoto}
                  />
                  {previewPhoto && <button type="button" onClick={removePhoto}><Icon name="trash" size={14} />Şəkli çıxar</button>}
                  {photoFile && <small className={styles.directorSelectedFile}>{photoFile.name}</small>}
                  {errors.photo && <p className={styles.fieldError} id="director-photo-error" role="alert"><Icon name="warning" size={13} />{errors.photo}</p>}
                </div>
              </div>

              <div className={styles.directorVisibilityCard}>
                <span><Icon name="eye" size={18} /></span>
                <p><strong>Ana səhifədə göstər</strong><small>Söndürüləndə yalnız direktor kartı gizlənir; “Niyə Medicare?” dəyərləri qalır.</small></p>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => updateField("active", event.target.checked)}
                    aria-label="Baş direktor kartını ana səhifədə göstər"
                  />
                  <span />
                </label>
              </div>
            </div>
          </section>

          <aside className={styles.directorPreviewPanel}>
            <div className={styles.directorPreviewHeading}>
              <div><span>Canlı önizləmə</span><h2>Ana səhifə kartı</h2></div>
              <small className={previewStatusLive ? styles.directorStatusLive : styles.directorStatusHidden}>
                {previewStatus}
              </small>
            </div>
            <div className={styles.directorPreviewBrowser}>
              <div className={styles.directorPreviewBar}><i /><i /><i /><span>medicarehospital.az/#why-medicare</span></div>
              <div className={styles.directorPreviewStage}>
                <span className={styles.directorPreviewEyebrow}>{homePreview.section.eyebrow || homePreview.section.label || WHY_PREVIEW_FALLBACK.eyebrow}</span>
                <h3>{homePreview.section.title || WHY_PREVIEW_FALLBACK.title}</h3>
                <p>{homePreview.section.description || WHY_PREVIEW_FALLBACK.description}</p>
                <article className={`${styles.directorPreviewCard} ${!previewCardVisible ? styles.directorPreviewCardHidden : ""}`}>
                  <div className={styles.directorPreviewPortrait}>
                    {previewPhoto ? (
                      <SmartImage
                        src={previewPhoto}
                        alt={`${form.fullName || "Baş direktor"} önizləməsi`}
                        sizes="82px"
                        fallbackLabel={initials(form.fullName)}
                      />
                    ) : <span>{initials(form.fullName)}</span>}
                  </div>
                  <div className={styles.directorPreviewBody}>
                    {form.message && <blockquote>{form.message}</blockquote>}
                    {form.signature && <em>{form.signature}</em>}
                    <div><strong>{form.fullName || "Ad və soyad"}</strong><small>{form.role || "Vəzifə"}</small></div>
                  </div>
                  {!previewCardVisible && <b>{previewOverlay}</b>}
                </article>
                <div className={styles.directorPreviewValues}><span /><span /><span /><span /></div>
              </div>
            </div>
            <p className={styles.directorPreviewNote}><Icon name="info" size={15} />{
              homePreview.unavailable
                ? "Ana səhifə bölməsinin canlı vəziyyəti yoxlanmadı. Direktor sahələrinin önizləməsi yenə də real vaxtda işləyir."
                : homePreview.visible === false
                  ? "Direktor aktiv olsa da, public kart üçün “Niyə Medicare?” bölməsini Səhifə qurucusunda görünən edin."
                  : "Sahələri dəyişdikcə önizləmə dərhal yenilənir. Public sayt yalnız “Yadda saxla” əməliyyatından sonra dəyişir."
            }</p>
          </aside>
        </div>
      )}

      {ADMIN_DEMO_MODE && <DemoNotice />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

"use client";

import { Children, cloneElement, isValidElement, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SmartImage from "@/components/common/SmartImage";
import { leadership as demoLeadership } from "@/data/site";
import { Icon } from "./AdminIcons";
import { ADMIN_DEMO_MODE, adminApi, getAdminApiBase } from "./adminApi";
import { normalizeAdminError } from "./adminAdapters";
import { AdminAsyncState, ConfirmDialog, DemoNotice, EmptyState, PageHeader, StatusBadge, Toast } from "./AdminPrimitives";
import styles from "../../app/admin/admin.module.css";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const EMPTY_FORM = { firstName: "", lastName: "", position: "", bio: "", education: "", experience: "", active: true };
const DEMO_ITEMS = demoLeadership.map((item, index) => ({
  ...item,
  imageId: `demo-image-${index + 1}`,
  image: { url: item.image, altText: `${item.firstName} ${item.lastName}` },
  active: true,
  sortOrder: index + 1,
}));

function textLines(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function lineItems(value) {
  return String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
}

function recordForm(record) {
  if (!record) return { ...EMPTY_FORM };
  return {
    firstName: record.firstName || "",
    lastName: record.lastName || "",
    position: record.position || "",
    bio: record.bio || "",
    education: textLines(record.education),
    experience: textLines(record.experience),
    active: record.active !== false,
  };
}

function mediaUrl(media) {
  const source = media?.url || media?.thumbnailUrl || "";
  if (!source || /^(?:https?:\/\/|blob:)/i.test(source)) return source;
  if (!/^\/uploads\//i.test(source) || typeof window === "undefined") return source;
  try {
    const apiUrl = new URL(getAdminApiBase(), window.location.origin);
    return new URL(source, apiUrl.origin).toString();
  } catch {
    return source;
  }
}

function leaderName(record) {
  return [record?.firstName, record?.lastName].filter(Boolean).join(" ");
}

export default function LeadershipManager() {
  const [items, setItems] = useState(ADMIN_DEMO_MODE ? DEMO_ITEMS : []);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setLoadError("");
    adminApi.resources.list("leadership", { limit: 100 }, { signal: controller.signal })
      .then((records) => {
        if (!controller.signal.aborted) setItems(Array.isArray(records) ? records : []);
      })
      .catch((error) => {
        if (controller.signal.aborted || error.name === "AbortError") return;
        setLoadError(normalizeAdminError(error, "Rəhbərlik məlumatlarını yükləmək mümkün olmadı."));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  const currentPhoto = photoPreview || mediaUrl(editing?.image);
  const preview = useMemo(() => ({
    name: `${form.firstName} ${form.lastName}`.trim() || "Ad və soyad",
    position: form.position.trim() || "Vəzifə",
    bio: form.bio.trim() || "Rəhbər haqqında qısa məlumat burada görünəcək.",
    education: lineItems(form.education),
    experience: lineItems(form.experience),
  }), [form]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function openEditor(record = null) {
    setEditing(record);
    setForm(recordForm(record));
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoInputKey((value) => value + 1);
    setErrors({});
    setEditorOpen(true);
    window.requestAnimationFrame(() =>
      document.getElementById("leadership-editor")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setPhotoFile(null);
    setPhotoPreview("");
    setErrors({});
  }

  function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.has(file.type)) {
      setErrors((current) => ({
        ...current,
        photo: "Yalnız JPG, PNG, WebP və AVIF şəkilləri qəbul edilir.",
      }));
      setPhotoInputKey((value) => value + 1);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((current) => ({
        ...current,
        photo: "Şəkil ölçüsü 8 MB-dan böyük ola bilməz.",
      }));
      setPhotoInputKey((value) => value + 1);
      return;
    }
    setPhotoFile(file);
    setErrors((current) => ({ ...current, photo: undefined }));
  }

  async function save(event) {
    event.preventDefault();
    const nextErrors = {};
    if (form.firstName.trim().length < 2) nextErrors.firstName = "Adı daxil edin.";
    if (form.lastName.trim().length < 2) nextErrors.lastName = "Soyadı daxil edin.";
    if (form.position.trim().length < 2) nextErrors.position = "Vəzifəni daxil edin.";
    if (form.bio.trim().length < 10) nextErrors.bio = "Haqqında mətni ən azı 10 simvol olmalıdır.";
    if (!editing?.imageId && !photoFile) nextErrors.photo = "Rəhbər fotosunu seçin.";
    if (lineItems(form.education).length > 12) nextErrors.education = "Maksimum 12 təhsil qeydi əlavə etmək olar.";
    if (lineItems(form.experience).length > 12) nextErrors.experience = "Maksimum 12 təcrübə qeydi əlavə etmək olar.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    let uploadedMedia = null;
    try {
      if (ADMIN_DEMO_MODE) {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        const saved = {
          ...(editing || {}),
          id: editing?.id || `demo-leader-${Date.now()}`,
          ...form,
          education: lineItems(form.education),
          experience: lineItems(form.experience),
          imageId: editing?.imageId || `demo-image-${Date.now()}`,
          image: { url: currentPhoto },
          sortOrder: editing?.sortOrder || items.length + 1,
        };
        setItems((current) =>
          editing
            ? current.map((item) => item.id === saved.id ? saved : item)
            : [...current, saved],
        );
      } else {
        if (photoFile) {
          uploadedMedia = await adminApi.media.upload(photoFile, {
            altText: `${form.firstName.trim()} ${form.lastName.trim()} — ${form.position.trim()}`,
          });
        }
        const payload = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          position: form.position.trim(),
          bio: form.bio.trim(),
          education: lineItems(form.education),
          experience: lineItems(form.experience),
          imageId: uploadedMedia?.id || editing?.imageId,
          active: Boolean(form.active),
          sortOrder: editing?.sortOrder || items.length + 1,
        };
        const saved = editing
          ? await adminApi.resources.update("leadership", editing.id, payload)
          : await adminApi.resources.create("leadership", payload);
        const oldImageId = editing?.imageId;
        setItems((current) =>
          editing
            ? current.map((item) => item.id === saved.id ? saved : item)
            : [...current, saved],
        );
        if (oldImageId && uploadedMedia && oldImageId !== uploadedMedia.id) {
          adminApi.media.remove(oldImageId).catch(() => {});
        }
      }
      setToast({
        tone: "success",
        message: editing ? "Rəhbər profili yeniləndi." : "Yeni rəhbər əlavə edildi.",
      });
      closeEditor();
    } catch (error) {
      if (uploadedMedia) adminApi.media.remove(uploadedMedia.id).catch(() => {});
      setToast({
        tone: "warning",
        message: normalizeAdminError(error, "Rəhbər profilini yadda saxlamaq mümkün olmadı."),
      });
    } finally {
      setSaving(false);
    }
  }

  async function move(index, offset) {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= items.length || reordering) return;
    const next = [...items];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setReordering(true);
    try {
      if (ADMIN_DEMO_MODE) {
        await new Promise((resolve) => window.setTimeout(resolve, 160));
        setItems(next.map((item, order) => ({ ...item, sortOrder: order + 1 })));
      } else {
        setItems(await adminApi.resources.reorder(
          "leadership",
          next.map((item) => item.id),
        ));
      }
    } catch (error) {
      setToast({
        tone: "warning",
        message: normalizeAdminError(error, "Kartların sırasını dəyişmək mümkün olmadı."),
      });
    } finally {
      setReordering(false);
    }
  }

  async function remove() {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    try {
      if (!ADMIN_DEMO_MODE) await adminApi.resources.remove("leadership", target.id);
      const remaining = items.filter((item) => item.id !== target.id);
      setItems(remaining);
      if (!ADMIN_DEMO_MODE && remaining.length > 0) {
        adminApi.resources
          .reorder("leadership", remaining.map((item) => item.id))
          .catch(() => {});
      }
      if (editing?.id === target.id) closeEditor();
      setToast({
        tone: "success",
        message: `${leaderName(target)} rəhbərlik siyahısından silindi.`,
      });
    } catch (error) {
      setToast({
        tone: "warning",
        message: normalizeAdminError(error, "Rəhbər profilini silmək mümkün olmadı."),
      });
    }
  }

  return (
    <div className={styles.leadershipManagerPage}>
      <PageHeader
        eyebrow="Sayt kontenti"
        title="Rəhbərlik"
        description="Rəhbər profillərini, fotolarını, optional təhsil və iş təcrübəsini, görünürlüyü və ana səhifədəki sıralamanı idarə edin."
        backHref="/admin/content"
        actions={(
          <>
            <Link
              className={styles.secondaryButton}
              href="/#leadership"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="eye" size={17} />Ana səhifədə aç
            </Link>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => openEditor()}
            >
              <Icon name="plus" size={17} />Yeni rəhbər
            </button>
          </>
        )}
      />

      {editorOpen && (
        <section className={styles.leadershipEditor} id="leadership-editor">
          <form className={styles.leadershipEditorForm} onSubmit={save}>
            <div className={styles.leadershipPanelHeader}>
              <div>
                <span><Icon name="users" size={19} /></span>
                <p>
                  <strong>{editing ? "Rəhbər profilini redaktə et" : "Yeni rəhbər profili"}</strong>
                  <small>Məcburi sahələri doldurun; təhsil və təcrübə optionaldır.</small>
                </p>
              </div>
              <button type="button" onClick={closeEditor} aria-label="Redaktoru bağla">
                <Icon name="close" size={17} />
              </button>
            </div>
            <div className={styles.formGrid}>
              <FormField id="leader-first-name" label="Ad" required error={errors.firstName} half>
                <input
                  maxLength={80}
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                />
              </FormField>
              <FormField id="leader-last-name" label="Soyad" required error={errors.lastName} half>
                <input
                  maxLength={80}
                  value={form.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                />
              </FormField>
              <FormField id="leader-position" label="Tutduğu vəzifə" required error={errors.position}>
                <input
                  maxLength={160}
                  value={form.position}
                  onChange={(event) => updateField("position", event.target.value)}
                  placeholder="Məsələn, Tibbi direktor"
                />
              </FormField>
              <FormField id="leader-bio" label="Haqqında" required error={errors.bio}>
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={form.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  placeholder="Rəhbərin rolu və peşəkar fəaliyyəti haqqında qısa mətn"
                />
                <div className={styles.fieldMeta}>
                  <span>Public kartda təhlükəsiz sadə mətn kimi göstərilir.</span>
                  <small>{form.bio.length}/2000</small>
                </div>
              </FormField>
              <FormField id="leader-education" label="Təhsil" optional error={errors.education} half>
                <textarea
                  rows={5}
                  value={form.education}
                  onChange={(event) => updateField("education", event.target.value)}
                  placeholder={"Hər sətirdə bir qeyd\nAzərbaycan Tibb Universiteti — Müalicə işi"}
                />
                <div className={styles.fieldMeta}>
                  <span>Boş saxlanarsa kartda görünməyəcək.</span>
                  <small>{lineItems(form.education).length}/12</small>
                </div>
              </FormField>
              <FormField id="leader-experience" label="İş təcrübəsi" optional error={errors.experience} half>
                <textarea
                  rows={5}
                  value={form.experience}
                  onChange={(event) => updateField("experience", event.target.value)}
                  placeholder={"Hər sətirdə bir qeyd\nKlinik idarəetmə üzrə 12 il təcrübə"}
                />
                <div className={styles.fieldMeta}>
                  <span>Boş saxlanarsa kartda görünməyəcək.</span>
                  <small>{lineItems(form.experience).length}/12</small>
                </div>
              </FormField>
              <div className={styles.leadershipPhotoField}>
                <div className={styles.leadershipPhotoThumb}>
                  {currentPhoto ? (
                    <SmartImage
                      src={currentPhoto}
                      alt={`${preview.name} fotosu`}
                      sizes="96px"
                      fallbackLabel={preview.name}
                    />
                  ) : (
                    <span><Icon name="image" size={24} /></span>
                  )}
                </div>
                <div>
                  <strong>Profil fotosu <b>*</b></strong>
                  <small>JPG, PNG, WebP və ya AVIF · maksimum 8 MB</small>
                  <label htmlFor="leader-photo">
                    <Icon name="image" size={15} />{currentPhoto ? "Fotonu dəyiş" : "Foto seç"}
                  </label>
                  <input
                    key={photoInputKey}
                    id="leader-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={choosePhoto}
                  />
                  {photoFile && <em>{photoFile.name}</em>}
                  {errors.photo && (
                    <p className={styles.fieldError}>
                      <Icon name="warning" size={13} />{errors.photo}
                    </p>
                  )}
                </div>
              </div>
              <div className={styles.leadershipVisibility}>
                <div>
                  <Icon name="eye" size={18} />
                  <p>
                    <strong>Ana səhifədə göstər</strong>
                    <small>Söndürüləndə profil yalnız admin paneldə qalır.</small>
                  </p>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => updateField("active", event.target.checked)}
                  />
                  <span />
                </label>
              </div>
            </div>
            <div className={styles.leadershipEditorActions}>
              <button className={styles.secondaryButton} type="button" onClick={closeEditor}>
                Ləğv et
              </button>
              <button className={styles.primaryButton} type="submit" disabled={saving}>
                <Icon name="check" size={16} />{saving ? "Saxlanılır..." : "Yadda saxla"}
              </button>
            </div>
          </form>
          <LeadershipPreview preview={preview} photo={currentPhoto} />
        </section>
      )}

      {loading ? (
        <AdminAsyncState title="Rəhbərlik profilləri yüklənir" />
      ) : loadError ? (
        <AdminAsyncState
          type="error"
          description={loadError}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="users"
          title="Rəhbərlik profili yoxdur"
          description="Ana səhifədə göstərmək üçün ilk rəhbər profilini əlavə edin."
          action={(
            <button className={styles.primaryButton} type="button" onClick={() => openEditor()}>
              <Icon name="plus" size={16} />İlk rəhbəri əlavə et
            </button>
          )}
        />
      ) : (
        <LeadershipList
          items={items}
          reordering={reordering}
          onMove={move}
          onEdit={openEditor}
          onDelete={setDeleteTarget}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Rəhbər profilini silmək istəyirsiniz?"
        description={deleteTarget ? `${leaderName(deleteTarget)} siyahıdan və public görünüşdən çıxarılacaq.` : ""}
        confirmLabel="Profili sil"
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
      {ADMIN_DEMO_MODE && <DemoNotice />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function FormField({ id, label, required, optional, error, half, children }) {
  const enhancedChildren = Children.map(children, (child, index) => {
    if (index !== 0 || !isValidElement(child)) return child;
    return cloneElement(child, {
      id,
      className: error ? styles.inputInvalid : child.props.className,
      "aria-invalid": Boolean(error),
    });
  });
  return (
    <div className={`${styles.formField} ${half ? styles.fieldHalf : ""}`}>
      <label htmlFor={id}>
        {label} {required && <span>*</span>}{optional && <small>(optional)</small>}
      </label>
      {enhancedChildren}
      {error && <p className={styles.fieldError}><Icon name="warning" size={13} />{error}</p>}
    </div>
  );
}

function LeadershipPreview({ preview, photo }) {
  return (
    <aside className={styles.leadershipPreview}>
      <span>Canlı kart önizləməsi</span>
      <article>
        <div className={styles.leadershipPreviewImage}>
          {photo ? (
            <SmartImage
              src={photo}
              alt={`${preview.name} önizləməsi`}
              sizes="320px"
              fallbackLabel={preview.name}
            />
          ) : (
            <span><Icon name="image" size={30} /></span>
          )}
        </div>
        <div className={styles.leadershipPreviewBody}>
          <small>{preview.position}</small>
          <h3>{preview.name}</h3>
          <p>{preview.bio}</p>
          {preview.education.length > 0 && (
            <PreviewList title="Təhsil" items={preview.education} />
          )}
          {preview.experience.length > 0 && (
            <PreviewList title="İş təcrübəsi" items={preview.experience} />
          )}
        </div>
      </article>
      <p><Icon name="info" size={15} />Optional sahələr yalnız mətn daxil ediləndə kartda görünür.</p>
    </aside>
  );
}

function PreviewList({ title, items }) {
  return (
    <div>
      <strong>{title}</strong>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

function LeadershipList({ items, reordering, onMove, onEdit, onDelete }) {
  return (
    <section className={styles.leadershipListSection}>
      <div className={styles.leadershipListHeader}>
        <div>
          <span>Görünmə sırası</span>
          <h2>Rəhbərlik kartları</h2>
          <p>Ox düymələri ilə kartların ana səhifədəki sırasını dəyişin.</p>
        </div>
        <strong>{items.length} profil</strong>
      </div>
      <div className={styles.leadershipAdminGrid}>
        {items.map((item, index) => (
          <article className={styles.leadershipAdminCard} key={item.id}>
            <div className={styles.leadershipAdminImage}>
              <SmartImage
                src={mediaUrl(item.image)}
                alt={`${leaderName(item)} fotosu`}
                sizes="(max-width: 760px) 100vw, 280px"
                fallbackLabel={leaderName(item)}
              />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className={styles.leadershipAdminBody}>
              <StatusBadge>{item.active ? "Aktiv" : "Deaktiv"}</StatusBadge>
              <h3>{leaderName(item)}</h3>
              <p>{item.position}</p>
              <small>{item.bio}</small>
              <div className={styles.leadershipAdminMeta}>
                {item.education?.length > 0 && <span>{item.education.length} təhsil qeydi</span>}
                {item.experience?.length > 0 && <span>{item.experience.length} təcrübə qeydi</span>}
              </div>
              <div className={styles.leadershipAdminActions}>
                <div>
                  <button
                    type="button"
                    disabled={index === 0 || reordering}
                    onClick={() => onMove(index, -1)}
                    aria-label={`${leaderName(item)} kartını yuxarı daşı`}
                  >
                    <Icon name="arrowUp" size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={index === items.length - 1 || reordering}
                    onClick={() => onMove(index, 1)}
                    aria-label={`${leaderName(item)} kartını aşağı daşı`}
                  >
                    <Icon name="arrowDown" size={15} />
                  </button>
                </div>
                <div>
                  <button type="button" onClick={() => onEdit(item)}>
                    <Icon name="edit" size={15} />Redaktə et
                  </button>
                  <button
                    type="button"
                    className={styles.leadershipDeleteButton}
                    onClick={() => onDelete(item)}
                    aria-label={`${leaderName(item)} profilini sil`}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

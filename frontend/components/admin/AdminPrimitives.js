"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "./AdminIcons";
import styles from "../../app/admin/admin.module.css";

const statusTone = {
  Aktiv: "success",
  "Dərc olunub": "success",
  Təsdiqlənib: "success",
  Tamamlanıb: "success",
  Yeni: "info",
  "Dəvət göndərilib": "info",
  Planlaşdırılıb: "violet",
  Gözləyir: "warning",
  Yoxlamada: "warning",
  Qaralama: "neutral",
  Məzuniyyətdə: "neutral",
  Deaktiv: "neutral",
  "Ləğv edilib": "danger",
  Bloklanıb: "danger",
};

export function StatusBadge({ children, dot = true }) {
  const tone = statusTone[children] || "neutral";
  return (
    <span className={`${styles.statusBadge} ${styles[`status${tone}`]}`}>
      {dot && <span className={styles.statusDot} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function PageHeader({ eyebrow, title, description, actions, backHref }) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderCopy}>
        {backHref && (
          <Link className={styles.backLink} href={backHref}>
            <Icon name="chevronRight" size={16} />
            Geri qayıt
          </Link>
        )}
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </div>
  );
}

export function EmptyState({
  icon = "search",
  title = "Nəticə tapılmadı",
  description = "Axtarış və filter parametrlərini dəyişərək yenidən yoxlayın.",
  action,
}) {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon}>
        <Icon name={icon} size={25} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function AdminAsyncState({
  type = "loading",
  title,
  description,
  onRetry,
  compact = false,
}) {
  const isLoading = type === "loading";
  return (
    <div className={`${styles.asyncState} ${compact ? styles.asyncStateCompact : ""}`} role={isLoading ? "status" : "alert"}>
      <span className={isLoading ? styles.asyncSpinner : styles.asyncErrorIcon}>
        {!isLoading && <Icon name="warning" size={22} />}
      </span>
      <h3>{title || (isLoading ? "Məlumatlar yüklənir" : "Məlumatı göstərmək mümkün olmadı")}</h3>
      <p>{description || (isLoading ? "Server cavabı gözlənilir..." : "Bağlantını yoxlayıb yenidən cəhd edin.")}</p>
      {!isLoading && onRetry && (
        <button className={styles.secondaryButton} type="button" onClick={onRetry}>
          <Icon name="activity" size={15} />
          Yenidən cəhd et
        </button>
      )}
    </div>
  );
}

export function Toast({ message, tone = "success", onClose }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${styles[`toast${tone}`]}`} role="status" aria-live="polite">
      <span className={styles.toastIcon}>
        <Icon name={tone === "success" ? "check" : tone === "warning" ? "warning" : "info"} size={18} />
      </span>
      <span>{message}</span>
      <button type="button" aria-label="Bildirişi bağla" onClick={onClose}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Sil", onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={onCancel}>
      <div
        aria-describedby="confirm-description"
        aria-labelledby="confirm-title"
        aria-modal="true"
        className={styles.confirmDialog}
        role="alertdialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className={styles.confirmIcon}>
          <Icon name="warning" size={23} />
        </span>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-description">{description}</p>
        <div className={styles.modalActions}>
          <button className={styles.secondaryButton} type="button" onClick={onCancel}>
            Ləğv et
          </button>
          <button className={styles.dangerButton} type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SkeletonBlock({ className = "" }) {
  return <span className={`${styles.skeleton} ${className}`} aria-hidden="true" />;
}

export function DemoNotice() {
  return (
    <div className={styles.demoNotice}>
      <Icon name="info" size={17} />
      <p>
        İnterfeys API müqaviləsinə hazırdır. Dəyişikliklər backend qoşulanadək yalnız cari baxışda simulyasiya edilir.
      </p>
    </div>
  );
}

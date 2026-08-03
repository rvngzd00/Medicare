"use client";

import { useEffect, useState } from "react";
import { ADMIN_DEMO_MODE, adminApi } from "./adminApi";
import { normalizeAdminError } from "./adminAdapters";
import { Icon } from "./AdminIcons";
import { ConfirmDialog } from "./AdminPrimitives";
import styles from "../../app/admin/admin.module.css";

export default function ServicePricingVisibility({ onNotify }) {
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [pendingHide, setPendingHide] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;
    const controller = new AbortController();

    async function loadVisibility() {
      setLoading(true);
      setError("");
      try {
        const result = await adminApi.servicePricing.getVisibility({
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setVisible(result.visible !== false);
        setUpdatedAt(result.updatedAt || null);
      } catch (requestError) {
        if (controller.signal.aborted || requestError.name === "SessionExpiredError") return;
        setError(normalizeAdminError(requestError, "Qiymət görünürlüğünü yükləmək mümkün olmadı."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadVisibility();
    return () => controller.abort();
  }, [reloadKey]);

  async function saveVisibility(nextVisible) {
    if (saving || nextVisible === visible) {
      setPendingHide(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = ADMIN_DEMO_MODE
        ? { visible: nextVisible, updatedAt: new Date().toISOString() }
        : await adminApi.servicePricing.updateVisibility(nextVisible);
      setVisible(result.visible !== false);
      setUpdatedAt(result.updatedAt || new Date().toISOString());
      setPendingHide(false);
      onNotify?.({
        tone: "success",
        message: nextVisible
          ? "Bütün xidmət qiymətləri əsas saytda göstərilir."
          : "Bütün xidmət qiymətləri əsas saytdan gizlədildi.",
      });
    } catch (requestError) {
      if (requestError.name === "SessionExpiredError") return;
      const message = normalizeAdminError(
        requestError,
        "Qiymət görünürlüğünü dəyişmək mümkün olmadı.",
      );
      setError(message);
      setPendingHide(false);
      onNotify?.({ tone: "warning", message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className={styles.servicePricingControl} aria-labelledby="service-pricing-control-title">
        <div className={styles.servicePricingControlIcon}>
          <Icon name={visible ? "eye" : "lock"} size={23} />
        </div>
        <div className={styles.servicePricingControlCopy}>
          <div className={styles.servicePricingControlHeading}>
            <div>
              <span>Qlobal qiymət görünürlüğü</span>
              <h2 id="service-pricing-control-title">Bütün xidmət qiymətləri</h2>
            </div>
            <strong className={visible ? styles.pricingStatusVisible : styles.pricingStatusHidden}>
              {loading ? "Yoxlanılır" : visible ? "Saytda görünür" : "Saytda gizlidir"}
            </strong>
          </div>
          <p>
            Bu seçim bütün xidmətlərə eyni anda tətbiq olunur. Gizlədildikdə qiymətlər public API cavabından da çıxarılır.
          </p>
          {error && (
            <button className={styles.servicePricingRetry} type="button" onClick={() => setReloadKey((value) => value + 1)}>
              <Icon name="warning" size={15} /> {error} Yenidən yoxla
            </button>
          )}
          <small aria-live="polite">
            {updatedAt ? `Son dəyişiklik: ${formatUpdatedAt(updatedAt)}` : "Standart seçim: göstər"}
          </small>
        </div>
        <div className={styles.servicePricingChoices} role="group" aria-label="Xidmət qiymətlərinin public görünürlüğü">
          <button
            className={visible ? styles.servicePricingChoiceActive : ""}
            type="button"
            aria-pressed={visible}
            disabled={loading || saving || Boolean(error)}
            onClick={() => saveVisibility(true)}
          >
            <Icon name="eye" size={17} />
            <span><strong>Göstər</strong><small>Bütün qiymətləri yayımla</small></span>
          </button>
          <button
            className={!visible ? styles.servicePricingChoiceHidden : ""}
            type="button"
            aria-pressed={!visible}
            disabled={loading || saving || Boolean(error)}
            onClick={() => setPendingHide(true)}
          >
            <Icon name="lock" size={17} />
            <span><strong>Gizlət</strong><small>Saytdan tam çıxar</small></span>
          </button>
        </div>
      </section>
      <ConfirmDialog
        open={pendingHide}
        title="Bütün xidmət qiymətləri gizlədilsin?"
        description="Təsdiqdən sonra qiymətlər əsas saytda, xidmət detallarında və public API cavablarında görünməyəcək. İstədiyiniz vaxt yenidən göstərə bilərsiniz."
        onCancel={() => setPendingHide(false)}
        onConfirm={() => saveVisibility(false)}
      />
    </>
  );
}

function formatUpdatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "indi";
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

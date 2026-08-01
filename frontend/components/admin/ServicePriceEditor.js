"use client";

import { Icon } from "./AdminIcons";
import styles from "../../app/admin/admin.module.css";

function newPriceItem() {
  return {
    id: globalThis.crypto?.randomUUID?.() || "price-" + Date.now() + "-" + Math.random(),
    code: "",
    name: "",
    price: "",
    currency: "AZN",
    note: "",
    active: true,
  };
}

export default function ServicePriceEditor({ value, onChange, error, help }) {
  const items = Array.isArray(value) ? value : [];

  function updateItem(index, field, nextValue) {
    onChange(items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: nextValue } : item
    )));
  }

  function moveItem(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const nextItems = [...items];
    [nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]];
    onChange(nextItems);
  }

  function addItem() {
    if (items.length >= 200) return;
    onChange([...items, newPriceItem()]);
  }

  return (
    <div className={styles.priceEditorField}>
      <div className={styles.priceEditorHeader}>
        <div>
          <strong>Xidmət və qiymətlər</strong>
          <span>{items.length} sətir</span>
        </div>
        <button type="button" onClick={addItem} disabled={items.length >= 200}>
          <Icon name="plus" size={15} /> Yeni qiymət əlavə et
        </button>
      </div>

      {items.length === 0 ? (
        <div className={styles.priceEditorEmpty}>
          <span><Icon name="services" size={24} /></span>
          <div>
            <strong>Qiymət siyahısı boşdur</strong>
            <p>İlk xidmət sətrini əlavə edib adını və qiymətini yazın.</p>
          </div>
          <button type="button" onClick={addItem}>İlk sətri əlavə et</button>
        </div>
      ) : (
        <div className={styles.priceEditorList}>
          {items.map((item, index) => (
            <article
              className={item.active === false ? styles.priceEditorItemHidden : ""}
              key={item.id || index}
            >
              <div className={styles.priceEditorItemTop}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <button type="button" aria-label="Yuxarı daşı" disabled={index === 0} onClick={() => moveItem(index, -1)}>
                    <Icon name="arrowUp" size={14} />
                  </button>
                  <button type="button" aria-label="Aşağı daşı" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)}>
                    <Icon name="arrowDown" size={14} />
                  </button>
                  <button type="button" aria-label="Qiymət sətrini sil" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
              <div className={styles.priceEditorGrid}>
                <label className={styles.priceEditorName}>
                  <span>Xidmət adı *</span>
                  <input
                    value={item.name || ""}
                    maxLength={500}
                    placeholder="Məsələn, EKQ müayinəsi"
                    onChange={(event) => updateItem(index, "name", event.target.value)}
                  />
                </label>
                <label>
                  <span>Kod</span>
                  <input
                    value={item.code || ""}
                    maxLength={80}
                    placeholder="FUN"
                    onChange={(event) => updateItem(index, "code", event.target.value)}
                  />
                </label>
                <label>
                  <span>Qiymət</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price ?? ""}
                    placeholder="Sorğu ilə"
                    onChange={(event) => updateItem(index, "price", event.target.value)}
                  />
                </label>
                <label>
                  <span>Valyuta</span>
                  <select value={item.currency || "AZN"} onChange={(event) => updateItem(index, "currency", event.target.value)}>
                    <option value="AZN">AZN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
                <label className={styles.priceEditorNote}>
                  <span>Qeyd</span>
                  <input
                    value={item.note || ""}
                    maxLength={1000}
                    placeholder="İstəyə bağlı əlavə məlumat"
                    onChange={(event) => updateItem(index, "note", event.target.value)}
                  />
                </label>
                <label className={styles.priceEditorVisibility}>
                  <input
                    type="checkbox"
                    checked={item.active !== false}
                    onChange={(event) => updateItem(index, "active", event.target.checked)}
                  />
                  <span>Public saytda göstər</span>
                </label>
              </div>
            </article>
          ))}
        </div>
      )}

      {error
        ? <p className={styles.fieldError}><Icon name="warning" size={14} />{error}</p>
        : <p className={styles.priceEditorHelp}>{help}</p>}
    </div>
  );
}

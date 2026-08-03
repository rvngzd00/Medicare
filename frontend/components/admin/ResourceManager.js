"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { resourceConfigs } from "./adminData";
import { Icon } from "./AdminIcons";
import { ADMIN_DEMO_MODE, adminApi, getAdminResponseContext } from "./adminApi";
import {
  adaptResourceList,
  adaptResourceRecord,
  entitySuccessMessage,
  getResourceStatusOptions,
  normalizeAdminError,
  resourceListQuery,
  resourceStatusMutation,
} from "./adminAdapters";
import { AdminAsyncState, ConfirmDialog, DemoNotice, EmptyState, PageHeader, StatusBadge, Toast } from "./AdminPrimitives";
import ServicePricingVisibility from "./ServicePricingVisibility";
import styles from "../../app/admin/admin.module.css";

function normalize(value) {
  return String(value || "").toLocaleLowerCase("az");
}

function RowIdentity({ row, type }) {
  return (
    <div className={styles.resourceIdentity}>
      <span className={`${styles.resourceAvatar} ${type === "article" ? styles.articleAvatar : ""}`}>{row.initials}</span>
      <div>
        <strong>{row.name}</strong>
        <small>{row.detail}</small>
      </div>
      {row.featured && <span className={styles.featuredMark} title="Seçilmiş kontent"><Icon name="sparkles" size={13} /></span>}
    </div>
  );
}

export default function ResourceManager({ resource }) {
  const config = resourceConfigs[resource];
  const [rows, setRows] = useState(config.rows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Hamısı");
  const [selected, setSelected] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [busyIds, setBusyIds] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState(null);
  const [page, setPage] = useState(1);

  const statuses = useMemo(
    () => ADMIN_DEMO_MODE
      ? ["Hamısı", ...new Set(rows.map((row) => row.status))]
      : ["Hamısı", ...getResourceStatusOptions(resource)],
    [resource, rows],
  );
  const filteredRows = useMemo(() => {
    const result = rows.filter((row) => {
      const matchesQuery = Object.values(row).some((value) => normalize(value).includes(normalize(query)));
      const matchesStatus = status === "Hamısı" || row.status === status;
      return matchesQuery && matchesStatus;
    });
    if (sort === "name") return [...result].sort((a, b) => a.name.localeCompare(b.name, "az"));
    if (sort === "status") return [...result].sort((a, b) => a.status.localeCompare(b.status, "az"));
    return [...result].sort(
      (a, b) =>
        new Date(b._raw?.updatedAt || 0) - new Date(a._raw?.updatedAt || 0)
    );
  }, [query, rows, sort, status]);

  const allVisibleSelected = filteredRows.length > 0 && filteredRows.every((row) => selected.includes(row.id));

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;
    const controller = new AbortController();
    const delay = query ? 260 : 0;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = resourceListQuery(resource, { query, status, page });
        const records = resource === "users"
          ? await adminApi.users.list(params, { signal: controller.signal })
          : await adminApi.resources.list(resource, params, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setRows(adaptResourceList(resource, records));
        setPaginationMeta(getAdminResponseContext(records).meta);
        setSelected([]);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setError(normalizeAdminError(requestError, `${config.title} siyahısını yükləmək mümkün olmadı.`));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, delay);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [config.title, page, query, reloadKey, resource, status]);

  function toggleAll() {
    if (allVisibleSelected) {
      setSelected((current) => current.filter((id) => !filteredRows.some((row) => row.id === id)));
    } else {
      setSelected((current) => [...new Set([...current, ...filteredRows.map((row) => row.id)])]);
    }
  }

  function toggleOne(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function confirmDelete() {
    const ids = pendingDelete === "bulk" ? selected : [pendingDelete];
    setBusyIds((current) => [...new Set([...current, ...ids])]);
    try {
      if (!ADMIN_DEMO_MODE) {
        await Promise.all(ids.map((recordId) => resource === "users"
          ? adminApi.users.remove(recordId)
          : adminApi.resources.remove(resource, recordId)));
      }
      setRows((current) => current.filter((row) => !ids.includes(row.id)));
      setSelected((current) => current.filter((recordId) => !ids.includes(recordId)));
      setPendingDelete(null);
      setToast({ tone: "success", message: ids.length === 1 ? entitySuccessMessage(resource, "delete") : `${ids.length} qeyd uğurla silindi.` });
    } catch (requestError) {
      setPendingDelete(null);
      setToast({ tone: "warning", message: normalizeAdminError(requestError, "Silmə əməliyyatı tamamlanmadı.") });
    } finally {
      setBusyIds((current) => current.filter((recordId) => !ids.includes(recordId)));
    }
  }

  async function updateOneStatus(row, forceActive) {
    const mutation = resourceStatusMutation(resource, row, forceActive);
    if (!Object.keys(mutation.payload).length) return;
    setBusyIds((current) => [...new Set([...current, row.id])]);
    try {
      if (ADMIN_DEMO_MODE) {
        setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: mutation.label, _raw: { ...item._raw, ...mutation.payload } } : item));
      } else {
        const updated = resource === "users"
          ? await adminApi.users.update(row.id, mutation.payload)
          : await adminApi.resources.update(resource, row.id, mutation.payload);
        setRows((current) => current.map((item) => item.id === row.id ? adaptResourceRecord(resource, updated) : item));
      }
      setToast({ tone: "success", message: `${row.name} statusu “${mutation.label}” olaraq yeniləndi.` });
    } catch (requestError) {
      setToast({ tone: "warning", message: normalizeAdminError(requestError, "Statusu yeniləmək mümkün olmadı.") });
    } finally {
      setBusyIds((current) => current.filter((recordId) => recordId !== row.id));
    }
  }

  async function updateSelectedStatus() {
    const selectedRows = rows.filter((row) => selected.includes(row.id));
    setBusyIds((current) => [...new Set([...current, ...selected])]);
    try {
      if (ADMIN_DEMO_MODE) {
        const selectedSet = new Set(selected);
        setRows((current) => current.map((row) => {
          if (!selectedSet.has(row.id)) return row;
          const mutation = resourceStatusMutation(resource, row, true);
          return { ...row, status: mutation.label, _raw: { ...row._raw, ...mutation.payload } };
        }));
      } else {
        const updates = await Promise.all(selectedRows.map((row) => {
          const mutation = resourceStatusMutation(resource, row, true);
          return resource === "users"
            ? adminApi.users.update(row.id, mutation.payload)
            : adminApi.resources.update(resource, row.id, mutation.payload);
        }));
        const updatedById = new Map(updates.map((record) => [record.id, adaptResourceRecord(resource, record)]));
        setRows((current) => current.map((row) => updatedById.get(row.id) || row));
      }
      setSelected([]);
      setToast({ tone: "success", message: `${selectedRows.length} qeyd aktiv statusa keçirildi.` });
    } catch (requestError) {
      setToast({ tone: "warning", message: normalizeAdminError(requestError, "Toplu status yenilənməsi tamamlanmadı.") });
    } finally {
      setBusyIds((current) => current.filter((recordId) => !selected.includes(recordId)));
    }
  }

  function exportCsv() {
    const header = config.columns.map((column) => column.label);
    const body = filteredRows.map((row) => config.columns.map((column) => row[column.key]));
    const csv = "\uFEFF" + [header, ...body]
      .map((line) => line.map(toSafeCsvCell).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `medicare-${resource}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast({ tone: "success", message: "CSV faylı ixrac üçün hazırlandı." });
  }

  return (
    <div className={styles.resourcePage}>
      <PageHeader
        eyebrow="Kontent idarəetməsi"
        title={config.title}
        description={config.description}
        actions={(
          <>
            <button className={styles.secondaryButton} type="button" onClick={exportCsv}>
              <Icon name="download" size={17} />
              <span>İxrac et</span>
            </button>
            <Link className={styles.primaryButton} href={config.createHref}>
              <Icon name="plus" size={18} />
              {config.createLabel}
            </Link>
          </>
        )}
      />

      {resource === "services" && (
        <ServicePricingVisibility onNotify={setToast} />
      )}

      <div className={styles.resourceSummary}>
        <div><strong>{paginationMeta?.total ?? rows.length}</strong><span>Ümumi</span></div>
        <div><strong>{rows.filter((row) => ["Aktiv", "Dərc olunub"].includes(row.status)).length}</strong><span>Aktiv / dərcdə</span></div>
        <div><strong>{rows.filter((row) => ["Qaralama", "Yoxlamada"].includes(row.status)).length}</strong><span>Hazırlanır</span></div>
        <div><strong>{rows.filter((row) => row.featured).length}</strong><span>Seçilmiş</span></div>
      </div>

      <section className={styles.tablePanel} aria-label={`${config.title} siyahısı`}>
        <div className={styles.tableToolbar}>
          <label className={styles.tableSearch}>
            <span className={styles.srOnly}>Axtarış</span>
            <Icon name="search" size={18} />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={config.searchPlaceholder} />
            {query && (
              <button type="button" aria-label="Axtarışı təmizlə" onClick={() => { setQuery(""); setPage(1); }}>
                <Icon name="close" size={15} />
              </button>
            )}
          </label>
          <div className={styles.tableFilters}>
            <label className={styles.filterSelect}>
              <Icon name="filter" size={16} />
              <span className={styles.srOnly}>Status filteri</span>
              <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                {statuses.map((item) => <option key={item} value={item}>Status: {item}</option>)}
              </select>
              <Icon name="chevronDown" size={13} />
            </label>
            <label className={styles.filterSelect}>
              <span className={styles.srOnly}>Sıralama</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="newest">Ən son yenilənən</option>
                <option value="name">Ada görə A–Z</option>
                <option value="status">Statusa görə</option>
              </select>
              <Icon name="chevronDown" size={13} />
            </label>
          </div>
        </div>

        {selected.length > 0 && (
          <div className={styles.bulkBar}>
            <span><strong>{selected.length}</strong> element seçilib</span>
            <div>
              <button type="button" disabled={busyIds.length > 0} onClick={updateSelectedStatus}>
                <Icon name="check" size={15} /> Aktiv et
              </button>
              <button className={styles.bulkDanger} type="button" onClick={() => setPendingDelete("bulk")}>
                <Icon name="trash" size={15} /> Sil
              </button>
              <button type="button" aria-label="Seçimi təmizlə" onClick={() => setSelected([])}>
                <Icon name="close" size={15} />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <AdminAsyncState compact type="loading" title={`${config.title} yüklənir`} />
        ) : error ? (
          <AdminAsyncState compact type="error" description={error} onRetry={() => setReloadKey((value) => value + 1)} />
        ) : filteredRows.length ? (
          <>
            <div className={styles.dataTableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th className={styles.checkboxCell}>
                      <label className={styles.checkbox}>
                        <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Görünən bütün elementləri seç" />
                        <span><Icon name="check" size={12} /></span>
                      </label>
                    </th>
                    {config.columns.map((column) => <th key={column.key}>{column.label}</th>)}
                    <th className={styles.actionsCell}><span className={styles.srOnly}>Əməllər</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className={selected.includes(row.id) ? styles.selectedRow : ""}>
                      <td className={styles.checkboxCell}>
                        <label className={styles.checkbox}>
                          <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleOne(row.id)} aria-label={`${row.name} seç`} />
                          <span><Icon name="check" size={12} /></span>
                        </label>
                      </td>
                      {config.columns.map((column) => (
                        <td key={column.key} data-label={column.label}>
                          {["person", "entity", "article"].includes(column.type) ? (
                            <RowIdentity row={row} type={column.type} />
                          ) : column.type === "status" ? (
                            <StatusBadge>{row[column.key]}</StatusBadge>
                          ) : (
                            <span className={column.key === "updatedAt" || column.key === "publishDate" ? styles.mutedCell : ""}>{row[column.key]}</span>
                          )}
                        </td>
                      ))}
                      <td className={styles.actionsCell}>
                        <div className={styles.rowActions}>
                          {resource !== "users" && (
                            <Link
                              href={resource === "doctors"
                                ? `/doctors/${row._raw?.slug || row.id}`
                                : resource === "articles"
                                  ? `/news/${row._raw?.slug || row.id}`
                                  : `/${resource}/${row._raw?.slug || row.id}`}
                              aria-label={`${row.name} public görünüşünə bax`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Icon name="eye" size={17} />
                            </Link>
                          )}
                          <button
                            type="button"
                            disabled={busyIds.includes(row.id)}
                            aria-label={`${row.name} statusunu dəyiş`}
                            title="Statusu dəyiş"
                            onClick={() => updateOneStatus(row)}
                          >
                            <Icon name="check" size={17} />
                          </button>
                          <Link href={`${config.editBase}/${row.id}/edit`} aria-label={`${row.name} redaktə et`}>
                            <Icon name="edit" size={17} />
                          </Link>
                          <button type="button" aria-label={`${row.name} sil`} onClick={() => setPendingDelete(row.id)}>
                            <Icon name="trash" size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.tableFooter}>
              <p>
                <strong>{paginationMeta?.total ?? filteredRows.length}</strong> nəticədən{" "}
                {paginationMeta?.total
                  ? (page - 1) * (paginationMeta.limit || 20) + 1
                  : 0}
                –
                {paginationMeta?.total
                  ? (page - 1) * (paginationMeta.limit || 20) + filteredRows.length
                  : filteredRows.length} göstərilir
              </p>
              <nav className={styles.pagination} aria-label="Səhifələmə">
                <button
                  type="button"
                  disabled={ADMIN_DEMO_MODE || !paginationMeta?.hasPreviousPage}
                  aria-label="Əvvəlki səhifə"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <Icon name="chevronRight" size={15} />
                </button>
                <button className={styles.pageCurrent} type="button" aria-current="page">{paginationMeta?.page || page}</button>
                <button
                  type="button"
                  disabled={ADMIN_DEMO_MODE || !paginationMeta?.hasNextPage}
                  aria-label="Növbəti səhifə"
                  onClick={() => setPage((current) => current + 1)}
                >
                  <Icon name="chevronRight" size={15} />
                </button>
              </nav>
            </div>
          </>
        ) : (
          <EmptyState
            title="Uyğun nəticə tapılmadı"
            description={`“${query || status}” filterinə uyğun ${config.singular.toLocaleLowerCase("az")} yoxdur.`}
            action={<button className={styles.secondaryButton} type="button" onClick={() => { setQuery(""); setStatus("Hamısı"); setPage(1); }}>Filterləri sıfırla</button>}
          />
        )}
      </section>

      {ADMIN_DEMO_MODE && <DemoNotice />}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete === "bulk" ? `${selected.length} elementi silmək istəyirsiniz?` : `${config.singular} silinsin?`}
        description={ADMIN_DEMO_MODE
          ? "Bu əməl demo məlumatını cari siyahıdan siləcək."
          : "Bu qeyd sistemdən silinəcək və əməl audit jurnalında qeydə alınacaq."}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function toSafeCsvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

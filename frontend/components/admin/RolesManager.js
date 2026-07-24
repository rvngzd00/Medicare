"use client";

import { useEffect, useMemo, useState } from "react";
import { permissionGroups, roles as mockRoles } from "./adminData";
import { ADMIN_DEMO_MODE, adminApi } from "./adminApi";
import { normalizeAdminError } from "./adminAdapters";
import { Icon } from "./AdminIcons";
import { AdminAsyncState, EmptyState, PageHeader, Toast } from "./AdminPrimitives";
import styles from "../../app/admin/admin.module.css";

const contentEntities = [
  "pages",
  "home_sections",
  "faqs",
  "testimonials",
  "branches",
  "gallery",
  "certificates",
  "leadership",
  "navigation",
  "social_links",
  "media",
];

const groupEntities = {
  dashboard: ["dashboard"],
  doctors: ["doctors"],
  departments: ["departments", "services"],
  articles: ["articles"],
  appointments: ["appointments"],
  messages: ["contacts"],
  content: contentEntities,
  settings: ["settings"],
  users: ["users", "roles"],
};

const actionSuffix = {
  Baxış: "read",
  Dəyişiklik: "write",
  Silmə: "delete",
  Nəşr: "publish",
};

const roleTones = ["red", "blue", "navy", "amber"];

function codesFor(groupKey, action) {
  const suffix = actionSuffix[action];
  return (groupEntities[groupKey] || [])
    .map((entity) => `${entity}.${suffix}`)
    .filter((code) => !(entityDoesNotSupport(code)));
}

function entityDoesNotSupport(code) {
  return [
    "dashboard.write",
    "dashboard.delete",
    "dashboard.publish",
    "roles.delete",
    "roles.publish",
    "settings.delete",
    "settings.publish",
  ].includes(code);
}

function mockPermissionMatrix(roles) {
  const matrix = {};
  roles.forEach((role) => {
    matrix[role.id] = {};
    permissionGroups.forEach((group) => {
      matrix[role.id][group.key] = {};
      group.permissions.forEach((permission) => {
        const allowedGroups = role.id === "super-admin"
          ? permissionGroups.map((item) => item.key)
          : role.id === "content-manager"
            ? ["dashboard", "articles", "content", "settings"]
            : role.id === "doctor-manager"
              ? ["dashboard", "doctors", "departments", "appointments"]
              : ["dashboard", "appointments", "messages"];
        matrix[role.id][group.key][permission] = role.id === "super-admin"
          || (allowedGroups.includes(group.key) && permission !== "Silmə");
      });
    });
  });
  return matrix;
}

function adaptRole(role, index, knownCodes) {
  const permissionCodes = new Set(
    (role.permissions || []).map((entry) => entry.permission?.code || entry.code).filter(Boolean),
  );
  const matrix = {};
  permissionGroups.forEach((group) => {
    matrix[group.key] = {};
    group.permissions.forEach((permission) => {
      const codes = codesFor(group.key, permission).filter((code) => knownCodes.has(code));
      matrix[group.key][permission] = codes.length > 0 && codes.every((code) => permissionCodes.has(code));
    });
  });
  return {
    role: {
      ...role,
      users: role._count?.users ?? role.users ?? 0,
      tone: roleTones[index % roleTones.length],
      permissionCodes,
    },
    matrix,
  };
}

function safeSlug(value) {
  return value
    .toLocaleLowerCase("az")
    .replace(/ə/g, "e")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function RolesManager() {
  const [roles, setRoles] = useState(mockRoles);
  const [selectedRole, setSelectedRole] = useState("content-manager");
  const [permissions, setPermissions] = useState(() => mockPermissionMatrix(mockRoles));
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const selected = useMemo(() => roles.find((role) => role.id === selectedRole), [roles, selectedRole]);
  const isLockedSystemRole = selected?.slug === "super-admin";

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;
    const controller = new AbortController();

    async function loadRoles() {
      setLoading(true);
      setError("");
      try {
        const [roleRecords, permissionRecords] = await Promise.all([
          adminApi.roles.list({ signal: controller.signal }),
          adminApi.roles.listPermissions({ signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        const knownCodes = new Set(permissionRecords.map((permission) => permission.code));
        const nextRoles = [];
        const nextMatrix = {};
        roleRecords.forEach((role, index) => {
          const adapted = adaptRole(role, index, knownCodes);
          nextRoles.push(adapted.role);
          nextMatrix[role.id] = adapted.matrix;
        });
        setAvailablePermissions(permissionRecords);
        setRoles(nextRoles);
        setPermissions(nextMatrix);
        setSelectedRole((current) => nextRoles.some((role) => role.id === current)
          ? current
          : nextRoles.find((role) => role.slug === "content-manager")?.id || nextRoles[0]?.id || "");
      } catch (requestError) {
        if (!controller.signal.aborted) setError(normalizeAdminError(requestError, "Rolları yükləmək mümkün olmadı."));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadRoles();
    return () => controller.abort();
  }, [reloadKey]);

  function togglePermission(group, permission) {
    if (isLockedSystemRole) return;
    const checked = !permissions[selectedRole][group][permission];
    setPermissions((current) => ({
      ...current,
      [selectedRole]: {
        ...current[selectedRole],
        [group]: {
          ...current[selectedRole][group],
          [permission]: checked,
        },
      },
    }));
    if (!ADMIN_DEMO_MODE) {
      const availableCodes = new Set(availablePermissions.map((item) => item.code));
      const affectedCodes = codesFor(group, permission).filter((code) => availableCodes.has(code));
      setRoles((current) => current.map((role) => {
        if (role.id !== selectedRole) return role;
        const permissionCodes = new Set(role.permissionCodes);
        affectedCodes.forEach((code) => checked ? permissionCodes.add(code) : permissionCodes.delete(code));
        return { ...role, permissionCodes };
      }));
    }
  }

  function selectedPermissionIds() {
    const codeToId = new Map(availablePermissions.map((permission) => [permission.code, permission.id]));
    return [...(selected?.permissionCodes || [])].map((code) => codeToId.get(code)).filter(Boolean);
  }

  async function saveRolePermissions() {
    if (!selected || isLockedSystemRole) return;
    setSaving(true);
    try {
      if (!ADMIN_DEMO_MODE) {
        const updated = await adminApi.roles.update(selected.id, {
          permissionIds: selectedPermissionIds(),
        });
        const knownCodes = new Set(availablePermissions.map((permission) => permission.code));
        const adapted = adaptRole(updated, Math.max(0, roles.findIndex((role) => role.id === updated.id)), knownCodes);
        setRoles((current) => current.map((role) => role.id === updated.id ? adapted.role : role));
        setPermissions((current) => ({ ...current, [updated.id]: adapted.matrix }));
      }
      setToast({ tone: "success", message: `${selected.name} icazələri yadda saxlanıldı.` });
    } catch (requestError) {
      setToast({ tone: "warning", message: normalizeAdminError(requestError, "İcazələri yadda saxlamaq mümkün olmadı.") });
    } finally {
      setSaving(false);
    }
  }

  async function createRole(event) {
    event.preventDefault();
    if (!newRole.name.trim()) return;
    setSaving(true);
    try {
      if (ADMIN_DEMO_MODE) {
        const id = safeSlug(newRole.name);
        const role = { id, slug: id, name: newRole.name, description: newRole.description || "Xüsusi giriş səlahiyyətləri.", users: 0, tone: "blue", permissionCodes: new Set() };
        const blank = mockPermissionMatrix([role])[id];
        setRoles((current) => [...current, role]);
        setPermissions((current) => ({ ...current, [id]: blank }));
        setSelectedRole(id);
      } else {
        const dashboardPermission = availablePermissions.find((permission) => permission.code === "dashboard.read");
        const created = await adminApi.roles.create({
          name: newRole.name.trim(),
          slug: safeSlug(newRole.name),
          description: newRole.description.trim() || null,
          permissionIds: dashboardPermission ? [dashboardPermission.id] : [],
        });
        const knownCodes = new Set(availablePermissions.map((permission) => permission.code));
        const adapted = adaptRole(created, roles.length, knownCodes);
        setRoles((current) => [...current, adapted.role]);
        setPermissions((current) => ({ ...current, [created.id]: adapted.matrix }));
        setSelectedRole(created.id);
      }
      setModalOpen(false);
      setNewRole({ name: "", description: "" });
      setToast({ tone: "success", message: "Yeni rol yaradıldı. İndi icazələri dəqiqləşdirə bilərsiniz." });
    } catch (requestError) {
      setToast({ tone: "warning", message: normalizeAdminError(requestError, "Rolu yaratmaq mümkün olmadı.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.rolesPage}>
      <PageHeader
        eyebrow="Giriş nəzarəti"
        title="Rollar və icazələr"
        description="Komanda üzvlərinin modullar üzrə baxış və dəyişiklik səlahiyyətlərini idarə edin."
        actions={<button className={styles.primaryButton} type="button" onClick={() => setModalOpen(true)}><Icon name="plus" size={17} />Yeni rol</button>}
      />

      {loading ? (
        <AdminAsyncState type="loading" title="Rollar və icazələr yüklənir" />
      ) : error ? (
        <AdminAsyncState type="error" description={error} onRetry={() => setReloadKey((value) => value + 1)} />
      ) : !roles.length ? (
        <EmptyState icon="roles" title="Rol tapılmadı" description="Sistemdə idarə oluna bilən rol yoxdur." />
      ) : (
        <>
          <section className={styles.roleCards}>
            {roles.map((role) => (
              <button className={`${styles.roleCard} ${selectedRole === role.id ? styles.roleCardActive : ""}`} type="button" key={role.id} onClick={() => setSelectedRole(role.id)}>
                <span className={`${styles.roleIcon} ${styles[`role${role.tone}`]}`}><Icon name={role.slug === "super-admin" ? "lock" : "roles"} size={19} /></span>
                <div><strong>{role.name}</strong><p>{role.description}</p><small><Icon name="users" size={14} />{role.users} istifadəçi</small></div>
                {selectedRole === role.id && <i><Icon name="check" size={13} /></i>}
              </button>
            ))}
          </section>

          <section className={styles.permissionPanel}>
            <div className={styles.permissionHeader}>
              <div><span className={`${styles.roleIcon} ${styles[`role${selected?.tone}`]}`}><Icon name="roles" size={19} /></span><div><h2>{selected?.name}</h2><p>{selected?.description}</p></div></div>
              <div>
                {isLockedSystemRole && <span className={styles.lockedRole}><Icon name="lock" size={14} />Sistem rolu</span>}
                <button className={styles.secondaryButton} type="button" disabled={saving || isLockedSystemRole} onClick={saveRolePermissions}>
                  <Icon name="check" size={16} />{saving ? "Saxlanılır..." : "Dəyişiklikləri saxla"}
                </button>
              </div>
            </div>

            <div className={styles.permissionNotice}>
              <Icon name={isLockedSystemRole ? "lock" : "info"} size={17} />
              <p>{isLockedSystemRole ? "Super Admin sistem roludur və bütün icazələr daimi aktivdir." : "İcazə dəyişikliyi bu rola sahib bütün istifadəçilərə növbəti server sorğusundan etibarən tətbiq olunacaq."}</p>
            </div>

            <div className={styles.permissionTableWrap}>
              <table className={styles.permissionTable}>
                <thead><tr><th>Modul</th><th>İcazələr</th><th>Hamısı</th></tr></thead>
                <tbody>
                  {permissionGroups.map((group) => {
                    const groupValues = group.permissions.map((permission) => permissions[selectedRole]?.[group.key]?.[permission]);
                    const allChecked = groupValues.length > 0 && groupValues.every(Boolean);
                    return (
                      <tr key={group.key}>
                        <td><strong>{group.label}</strong><small>{group.permissions.length} əməl</small></td>
                        <td>
                          <div className={styles.permissionChecks}>
                            {group.permissions.map((permission) => (
                              <label key={permission}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(permissions[selectedRole]?.[group.key]?.[permission])}
                                  disabled={isLockedSystemRole}
                                  onChange={() => togglePermission(group.key, permission)}
                                />
                                <span><Icon name="check" size={11} /></span>{permission}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={allChecked}
                              disabled={isLockedSystemRole}
                              aria-label={`${group.label} üçün bütün icazələr`}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                setPermissions((current) => ({
                                  ...current,
                                  [selectedRole]: {
                                    ...current[selectedRole],
                                    [group.key]: Object.fromEntries(group.permissions.map((permission) => [permission, checked])),
                                  },
                                }));
                                if (!ADMIN_DEMO_MODE) {
                                  const availableCodes = new Set(availablePermissions.map((item) => item.code));
                                  const affectedCodes = group.permissions
                                    .flatMap((permission) => codesFor(group.key, permission))
                                    .filter((code) => availableCodes.has(code));
                                  setRoles((current) => current.map((role) => {
                                    if (role.id !== selectedRole) return role;
                                    const permissionCodes = new Set(role.permissionCodes);
                                    affectedCodes.forEach((code) => checked ? permissionCodes.add(code) : permissionCodes.delete(code));
                                    return { ...role, permissionCodes };
                                  }));
                                }
                              }}
                            />
                            <span />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.accessPrinciples}>
            <div><span><Icon name="lock" size={18} /></span><p><strong>Minimum səlahiyyət prinsipi</strong><small>İstifadəçiyə yalnız işi üçün vacib icazələri verin.</small></p></div>
            <div><span><Icon name="activity" size={18} /></span><p><strong>Dəyişiklik auditi</strong><small>Rol və icazə dəyişiklikləri audit jurnalında saxlanılır.</small></p></div>
            <div><span><Icon name="warning" size={18} /></span><p><strong>Periodik yoxlama</strong><small>Komanda rollarını hər 90 gündə nəzərdən keçirin.</small></p></div>
          </section>
        </>
      )}

      {modalOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setModalOpen(false)}>
          <form className={styles.roleModal} onSubmit={createRole} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalTitle}><span><Icon name="roles" size={21} /></span><div><h2>Yeni rol yaradın</h2><p>Rola aydın ad və qısa məqsəd təsviri verin.</p></div><button type="button" aria-label="Pəncərəni bağla" onClick={() => setModalOpen(false)}><Icon name="close" size={18} /></button></div>
            <div className={styles.formField}><label htmlFor="role-name">Rol adı <span>*</span></label><input id="role-name" value={newRole.name} required placeholder="Məsələn, SEO Specialist" onChange={(event) => setNewRole((current) => ({ ...current, name: event.target.value }))} /></div>
            <div className={styles.formField}><label htmlFor="role-description">Təsvir</label><textarea id="role-description" rows={4} value={newRole.description} placeholder="Rolun məsuliyyət və istifadə sahəsi..." onChange={(event) => setNewRole((current) => ({ ...current, description: event.target.value }))} /></div>
            <div className={styles.modalActions}><button className={styles.secondaryButton} type="button" onClick={() => setModalOpen(false)}>Ləğv et</button><button className={styles.primaryButton} type="submit" disabled={saving}><Icon name="plus" size={16} />{saving ? "Yaradılır..." : "Rol yarat"}</button></div>
          </form>
        </div>
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

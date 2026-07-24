"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminNavigation, pageMeta } from "./adminData";
import { Icon, MedicareAdminLogo } from "./AdminIcons";
import { ADMIN_DEMO_MODE, authService } from "./adminApi";
import styles from "../../app/admin/admin.module.css";

const navigationPermissions = {
  "/admin": ["dashboard.read"],
  "/admin/doctors": ["doctors.read"],
  "/admin/departments": ["departments.read"],
  "/admin/services": ["services.read"],
  "/admin/articles": ["articles.read"],
  "/admin/appointments": ["appointments.read"],
  "/admin/messages": ["contacts.read"],
  "/admin/content": ["home_sections.read", "pages.read"],
  "/admin/pages": ["pages.read"],
  "/admin/settings": ["settings.read"],
  "/admin/users": ["users.read"],
  "/admin/roles": ["roles.read"]
};

function canAccessNavigation(href, permissionSet) {
  if (ADMIN_DEMO_MODE) return true;
  const required = navigationPermissions[href] || [];
  return required.length === 0 || required.some((code) => permissionSet.has(code));
}

function resolvePage(pathname) {
  if (pageMeta[pathname]) return pageMeta[pathname];
  const parent = Object.keys(pageMeta)
    .filter((path) => path !== "/admin" && pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];
  if (parent) {
    const [title] = pageMeta[parent];
    return [pathname.endsWith("/new") ? `Yeni ${title.toLocaleLowerCase("az")}` : `${title} · Redaktə`, "Kontent idarəetməsi"];
  }
  return ["Medicare Admin", "İdarəetmə paneli"];
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [authStatus, setAuthStatus] = useState(ADMIN_DEMO_MODE ? "ready" : "checking");
  const [authUser, setAuthUser] = useState(ADMIN_DEMO_MODE ? {
    firstName: "Nigar",
    lastName: "Məmmədova",
    email: "nigar.m@medicarehospital.az",
    role: { name: "Super Admin" },
  } : null);
  const [loggingOut, setLoggingOut] = useState(false);
  const commandInputRef = useRef(null);
  const commandDialogRef = useRef(null);
  const [title, subtitle] = resolvePage(pathname);
  const isLogin = pathname === "/admin/login";
  const userName = [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ") || authUser?.displayName || "Admin istifadəçi";
  const userInitials = [authUser?.firstName, authUser?.lastName]
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("az") || "AD";
  const userRole = authUser?.role?.name || authUser?.role || "Admin";
  const permissionSet = useMemo(
    () => new Set(Array.isArray(authUser?.permissions) ? authUser.permissions : []),
    [authUser]
  );
  const visibleNavigation = useMemo(
    () =>
      adminNavigation
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            canAccessNavigation(item.href, permissionSet)
          )
        }))
        .filter((group) => group.items.length > 0),
    [permissionSet]
  );
  const currentNavigationHref = Object.keys(navigationPermissions)
    .filter((href) =>
      href === "/admin" ? pathname === href : pathname.startsWith(href)
    )
    .sort((first, second) => second.length - first.length)[0];
  const canAccessCurrent = currentNavigationHref
    ? canAccessNavigation(currentNavigationHref, permissionSet)
    : true;
  const firstAccessibleHref =
    visibleNavigation.flatMap((group) => group.items)[0]?.href || "/admin/login";

  useEffect(() => {
    if (isLogin || ADMIN_DEMO_MODE) {
      setAuthStatus("ready");
      return undefined;
    }

    const controller = new AbortController();
    setAuthStatus("checking");
    authService.getSession({ signal: controller.signal })
      .then((user) => {
        if (controller.signal.aborted) return;
        setAuthUser(user);
        setAuthStatus("ready");
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === "AbortError") return;
        setAuthStatus("redirecting");
        router.replace("/admin/login?reason=session-expired");
      });

    return () => controller.abort();
  }, [isLogin, pathname, router]);

  useEffect(() => {
    setDrawerOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setDrawerOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      window.location.assign("/admin/login?reason=session-expired");
    };
    window.addEventListener("medicare:session-expired", handleSessionExpired);
    return () => window.removeEventListener("medicare:session-expired", handleSessionExpired);
  }, []);

  useEffect(() => {
    if (!commandOpen) return undefined;
    const previousFocus = document.activeElement;
    const timer = window.setTimeout(() => commandInputRef.current?.focus(), 30);
    const trapFocus = (event) => {
      if (event.key !== "Tab" || !commandDialogRef.current) return;
      const focusable = Array.from(
        commandDialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled])'
        )
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", trapFocus);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", trapFocus);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [commandOpen]);

  const commandItems = useMemo(
    () =>
      visibleNavigation
        .flatMap((group) => group.items)
        .filter((item) => item.label.toLocaleLowerCase("az").includes(commandQuery.toLocaleLowerCase("az"))),
    [commandQuery, visibleNavigation],
  );

  if (isLogin) return <>{children}</>;

  if (authStatus !== "ready") {
    return (
      <div className={styles.authGuard} role="status" aria-live="polite">
        <MedicareAdminLogo />
        <span className={styles.asyncSpinner} />
        <h1>Təhlükəsiz sessiya yoxlanılır</h1>
        <p>{authStatus === "redirecting" ? "Giriş səhifəsinə yönləndirilirsiniz..." : "Admin məlumatları göstərilməzdən əvvəl giriş təsdiqlənir."}</p>
      </div>
    );
  }

  if (!canAccessCurrent) {
    return (
      <div className={styles.authGuard} role="alert">
        <MedicareAdminLogo />
        <Icon name="lock" size={30} />
        <h1>Bu modul üçün giriş icazəniz yoxdur</h1>
        <p>Rolunuza aid modula qayıda və ya administratorla əlaqə saxlaya bilərsiniz.</p>
        <Link className={styles.primaryButton} href={firstAccessibleHref}>
          İcazəli modula keç
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.adminRoot}>
      <a className={styles.skipLink} href="#admin-main">
        Əsas məzmuna keç
      </a>

      <aside id="admin-sidebar" className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ""}`} aria-label="Admin naviqasiyası">
        <div className={styles.sidebarTop}>
          <Link className={styles.logoLink} href="/admin" aria-label="Medicare idarə paneli">
            <MedicareAdminLogo />
          </Link>
          <button className={styles.mobileClose} type="button" aria-label="Menyunu bağla" onClick={() => setDrawerOpen(false)}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {visibleNavigation.map((group) => (
            <div className={styles.navGroup} key={group.label}>
              <p>{group.label}</p>
              <ul>
                {group.items.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`} href={item.href} aria-current={active ? "page" : undefined}>
                        <Icon name={item.icon} size={19} />
                        <span>{item.label}</span>
                        {ADMIN_DEMO_MODE && item.badge && (
                          <small className={item.accent ? styles.navBadgeAccent : styles.navBadge}>
                            {item.badge}
                          </small>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.systemHealth}>
            <span className={styles.healthPulse} aria-hidden="true" />
            <div>
              <strong>{ADMIN_DEMO_MODE ? "Sistem işləkdir" : "Sessiya aktivdir"}</strong>
              <small>{ADMIN_DEMO_MODE ? "Son yoxlama: indi" : "Auth API tərəfindən təsdiqlənib"}</small>
            </div>
          </div>
          <Link className={styles.viewSiteLink} href="/" target="_blank" rel="noopener noreferrer">
            <Icon name="external" size={17} />
            Sayta bax
          </Link>
        </div>
      </aside>

      {drawerOpen && <button className={styles.drawerBackdrop} type="button" aria-label="Menyunu bağla" onClick={() => setDrawerOpen(false)} />}

      <div className={styles.adminWorkspace}>
        <header className={styles.adminHeader}>
          <div className={styles.headerStart}>
            <button
              className={styles.menuButton}
              type="button"
              aria-expanded={drawerOpen}
              aria-controls="admin-sidebar"
              aria-label="Naviqasiya menyusunu aç"
              onClick={() => setDrawerOpen(true)}
            >
              <Icon name="menu" size={21} />
            </button>
            <div className={styles.headerTitle}>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.commandButton} type="button" onClick={() => setCommandOpen(true)}>
              <Icon name="search" size={18} />
              <span>Sürətli axtarış</span>
              <kbd>⌘ K</kbd>
            </button>

            {ADMIN_DEMO_MODE && <div className={styles.popoverWrap}>
              <button
                className={styles.iconButton}
                type="button"
                aria-expanded={notificationsOpen}
                aria-label="Bildirişlər, 3 yeni"
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  setProfileOpen(false);
                }}
              >
                <Icon name="bell" size={20} />
                <span className={styles.notificationDot} />
              </button>
              {notificationsOpen && (
                <div className={`${styles.popover} ${styles.notificationPopover}`}>
                  <div className={styles.popoverHeader}>
                    <div>
                      <strong>Bildirişlər</strong>
                      <small>3 yeni bildiriş</small>
                    </div>
                    <button type="button">Hamısını oxu</button>
                  </div>
                  <div className={styles.notificationList}>
                    <Link href="/admin/appointments">
                      <span className={`${styles.notificationIcon} ${styles.notificationRed}`}>
                        <Icon name="calendar" size={17} />
                      </span>
                      <span>
                        <strong>Yeni qəbul sorğusu</strong>
                        <small>Tural Səfərov · Dermatologiya</small>
                        <em>12 dəq əvvəl</em>
                      </span>
                    </Link>
                    <Link href="/admin/messages">
                      <span className={`${styles.notificationIcon} ${styles.notificationBlue}`}>
                        <Icon name="messages" size={17} />
                      </span>
                      <span>
                        <strong>Prioritet mesaj</strong>
                        <small>Korporativ check-up təklifi</small>
                        <em>1 saat əvvəl</em>
                      </span>
                    </Link>
                    <Link href="/admin/articles">
                      <span className={`${styles.notificationIcon} ${styles.notificationAmber}`}>
                        <Icon name="clock" size={17} />
                      </span>
                      <span>
                        <strong>Nəşr planı yaxınlaşır</strong>
                        <small>“Günəşdən doğru qorunma...”</small>
                        <em>Sabah, 10:00</em>
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>}

            <div className={styles.popoverWrap}>
              <button
                className={styles.profileButton}
                type="button"
                aria-expanded={profileOpen}
                onClick={() => {
                  setProfileOpen((value) => !value);
                  setNotificationsOpen(false);
                }}
              >
                <span className={styles.avatar}>{userInitials}</span>
                <span className={styles.profileCopy}>
                  <strong>{userName}</strong>
                  <small>{userRole}</small>
                </span>
                <Icon name="chevronDown" size={15} />
              </button>
              {profileOpen && (
                <div className={`${styles.popover} ${styles.profilePopover}`}>
                  <div className={styles.profileSummary}>
                    <span className={styles.avatarLarge}>{userInitials}</span>
                    <span>
                      <strong>{userName}</strong>
                      <small>{authUser?.email || "E-mail mövcud deyil"}</small>
                    </span>
                  </div>
                  {canAccessNavigation("/admin/settings", permissionSet) && (
                    <Link href="/admin/settings">
                      <Icon name="settings" size={17} />
                      Sayt parametrləri
                    </Link>
                  )}
                  <Link href="/">
                    <Icon name="external" size={17} />
                    Public sayta keç
                  </Link>
                  <button
                    className={styles.logoutLink}
                    type="button"
                    disabled={loggingOut}
                    onClick={async () => {
                      setLoggingOut(true);
                      try {
                        await authService.logout();
                      } finally {
                        router.replace("/admin/login");
                      }
                    }}
                  >
                    <Icon name="logout" size={17} />
                    {loggingOut ? "Sessiya bitirilir..." : "Sessiyanı bitir"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={styles.adminMain} id="admin-main">
          {children}
        </main>
      </div>

      {commandOpen && (
        <div className={styles.commandBackdrop} role="presentation" onMouseDown={() => setCommandOpen(false)}>
          <div
            ref={commandDialogRef}
            aria-label="Admin paneldə sürətli keçid"
            aria-modal="true"
            className={styles.commandPalette}
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.commandSearch}>
              <Icon name="search" size={20} />
              <input
                ref={commandInputRef}
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                placeholder="Modul və ya funksiya axtarın..."
                aria-label="Sürətli axtarış"
              />
              <kbd>ESC</kbd>
            </div>
            <div className={styles.commandResults}>
              <p>Sürətli keçid</p>
              {commandItems.length ? (
                commandItems.map((item) => (
                  <Link href={item.href} key={item.href} onClick={() => setCommandOpen(false)}>
                    <span>
                      <Icon name={item.icon} size={18} />
                      {item.label}
                    </span>
                    <Icon name="chevronRight" size={16} />
                  </Link>
                ))
              ) : (
                <div className={styles.commandEmpty}>“{commandQuery}” üçün nəticə tapılmadı.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

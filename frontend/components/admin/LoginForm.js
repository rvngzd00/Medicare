"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, MedicareAdminLogo } from "./AdminIcons";
import { ADMIN_DEMO_MODE, authService } from "./adminApi";
import styles from "../../app/admin/admin.module.css";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setSessionExpired(new URLSearchParams(window.location.search).get("reason") === "session-expired");
  }, []);

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Düzgün iş e-maili daxil edin.";
    if (password.length < 8) nextErrors.password = "Şifrə ən azı 8 simvol olmalıdır.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setAuthError("");
    try {
      await authService.login({ email, password, remember });
      router.push("/admin");
    } catch (error) {
      setAuthError(error.message || "Giriş zamanı xəta baş verdi.");
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginBrand} aria-label="Medicare idarəetmə platforması">
        <div className={styles.loginBrandGlow} aria-hidden="true" />
        <Link href="/" className={styles.loginLogoLink}>
          <MedicareAdminLogo />
        </Link>
        <div className={styles.loginBrandContent}>
          <span className={styles.loginEyebrow}><Icon name="lock" size={15} />Təhlükəsiz idarəetmə</span>
          <h1>Daha yaxşı tibbi xidmət üçün vahid idarəetmə məkanı.</h1>
          <p>Kontenti, pasiyent müraciətlərini və komanda əməliyyatlarını etibarlı platformadan idarə edin.</p>
          <ul>
            <li><span><Icon name="check" size={16} /></span>Rol əsaslı giriş və audit jurnalı</li>
            <li><span><Icon name="check" size={16} /></span>Real-vaxt müraciət və kontent nəzarəti</li>
            <li><span><Icon name="check" size={16} /></span>Mobil cihazlar üçün optimallaşdırılıb</li>
          </ul>
        </div>
        <div className={styles.loginTrust}>
          <span className={styles.healthPulse} />
          <div><strong>Medicare Secure Access</strong><small>Şifrələnmiş və rotasiya olunan sessiya</small></div>
        </div>
      </section>

      <section className={styles.loginFormSide}>
        <div className={styles.mobileLoginLogo}><MedicareAdminLogo /></div>
        <div className={styles.loginFormWrap}>
          <div className={styles.loginHeading}>
            <span className={styles.eyebrow}>Xoş gəlmisiniz</span>
            <h2>Hesabınıza daxil olun</h2>
            <p>Medicare admin panelinə keçmək üçün iş hesabınızdan istifadə edin.</p>
          </div>

          <form onSubmit={submit} noValidate>
            {sessionExpired && (
              <div className={styles.sessionExpiredNotice} role="alert">
                <Icon name="clock" size={17} />
                <p>Sessiyanın müddəti bitib. Təhlükəsizliyiniz üçün yenidən daxil olun.</p>
              </div>
            )}

            <div className={styles.loginField}>
              <label htmlFor="admin-email">E-mail ünvanı</label>
              <div className={errors.email ? styles.loginInputInvalid : ""}>
                <Icon name="mail" size={18} />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  placeholder="ad.soyad@medicarehospital.az"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrors((current) => ({ ...current, email: undefined }));
                  }}
                />
              </div>
              {errors.email && <p id="email-error" role="alert"><Icon name="warning" size={13} />{errors.email}</p>}
            </div>

            <div className={styles.loginField}>
              <div className={styles.loginLabelRow}>
                <label htmlFor="admin-password">Şifrə</label>
                {ADMIN_DEMO_MODE && <button type="button" onClick={() => setRecoveryOpen((value) => !value)}>Şifrəni unutmusunuz?</button>}
              </div>
              <div className={errors.password ? styles.loginInputInvalid : ""}>
                <Icon name="lock" size={18} />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  placeholder="Şifrənizi daxil edin"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((current) => ({ ...current, password: undefined }));
                  }}
                />
                <button type="button" aria-label={showPassword ? "Şifrəni gizlət" : "Şifrəni göstər"} onClick={() => setShowPassword((value) => !value)}>
                  <Icon name="eye" size={18} />
                </button>
              </div>
              {errors.password && <p id="password-error" role="alert"><Icon name="warning" size={13} />{errors.password}</p>}
            </div>

            {recoveryOpen && (
              <div className={styles.recoveryNotice} role="status">
                <Icon name="info" size={17} />
                <p>Demo rejimində şifrə bərpası endpoint-i icra edilmir.</p>
              </div>
            )}

            {authError && (
              <div className={styles.authError} role="alert">
                <Icon name="warning" size={17} />
                <p>{authError}</p>
              </div>
            )}

            {ADMIN_DEMO_MODE && <label className={styles.rememberCheck}>
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              <span><Icon name="check" size={12} /></span>
              Bu cihazda məni xatırla
            </label>}

            <button className={styles.loginSubmit} type="submit" disabled={submitting}>
              {submitting ? <span className={styles.buttonSpinner} /> : <Icon name="lock" size={17} />}
              {submitting ? "Sessiya yoxlanılır..." : "Təhlükəsiz giriş"}
            </button>
          </form>

          <div className={styles.authContract}>
            <Icon name="info" size={16} />
            <p>{ADMIN_DEMO_MODE
              ? "Demo rejimində hardcoded hesab yoxdur; form giriş formatını yoxlayıb idarə paneli baxışını açır."
              : "Identifikasiya backend auth endpoint-i, yaddaşdakı access token və HttpOnly refresh sessiyası ilə aparılır."}</p>
          </div>

          <div className={styles.loginSupport}>
            <span>Girişlə bağlı kömək lazımdır?</span>
            <a href="mailto:official@medicarehospital.az">IT dəstək ilə əlaqə</a>
          </div>
        </div>
        <footer className={styles.loginFooter}>
          <span>© 2026 Medicare</span>
          <Link href="/privacy-policy">Məxfilik</Link>
          <Link href="/terms">İstifadə şərtləri</Link>
        </footer>
      </section>
    </main>
  );
}

import styles from "./admin.module.css";

export default function AdminLoading() {
  return (
    <div className={styles.adminLoading} role="status" aria-label="Səhifə yüklənir">
      <div className={styles.loadingHeader}>
        <span /><span />
      </div>
      <div className={styles.loadingStats}>
        <span /><span /><span /><span />
      </div>
      <div className={styles.loadingPanel}>
        <span /><span /><span /><span /><span />
      </div>
    </div>
  );
}

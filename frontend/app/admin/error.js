"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "../../components/admin/AdminIcons";
import styles from "./admin.module.css";

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className={styles.adminError} role="alert">
      <span><Icon name="warning" size={26} /></span>
      <h1>Məlumatı göstərmək mümkün olmadı</h1>
      <p>Server cavabı alınmadı və ya sessiya müvəqqəti kəsildi. Yenidən cəhd edə bilərsiniz.</p>
      <div>
        <button className={styles.primaryButton} type="button" onClick={reset}>Yenidən cəhd et</button>
        <Link className={styles.secondaryButton} href="/admin">İdarə panelinə qayıt</Link>
      </div>
    </div>
  );
}

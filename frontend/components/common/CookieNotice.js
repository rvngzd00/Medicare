"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "medicare-cookie-choice";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!window.localStorage.getItem(STORAGE_KEY));
    } catch {
      setVisible(true);
    }
  }, []);

  function choose(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Consent choice simply remains session-only when storage is unavailable.
    }
    window.dispatchEvent(
      new CustomEvent("medicare:cookie-choice", { detail: value })
    );
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="cookieNotice" aria-label="Kuki seçimləri">
      <div>
        <strong>Rahat və təhlükəsiz təcrübə</strong>
        <p>
          Saytın əsas funksiyaları üçün zəruri kukilərdən istifadə edirik. Ətraflı məlumat{" "}
          <Link href="/cookie-policy">kuki siyasətindədir</Link>.
        </p>
      </div>
      <div className="cookieNotice__actions">
        <button className="button button--ghost button--small" type="button" onClick={() => choose("essential")}>
          Yalnız zəruri
        </button>
        <button className="button button--primary button--small" type="button" onClick={() => choose("all")}>
          Qəbul edirəm
        </button>
      </div>
    </aside>
  );
}

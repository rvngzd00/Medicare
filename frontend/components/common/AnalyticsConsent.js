"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const STORAGE_KEY = "medicare-cookie-choice";

export default function AnalyticsConsent({ measurementId }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    function syncConsent(event) {
      if (event?.detail) {
        setEnabled(event.detail === "all");
        return;
      }
      try {
        setEnabled(window.localStorage.getItem(STORAGE_KEY) === "all");
      } catch {
        setEnabled(false);
      }
    }

    syncConsent();
    window.addEventListener("medicare:cookie-choice", syncConsent);
    window.addEventListener("storage", syncConsent);
    return () => {
      window.removeEventListener("medicare:cookie-choice", syncConsent);
      window.removeEventListener("storage", syncConsent);
    };
  }, []);

  if (!enabled || !/^G-[A-Z0-9]+$/i.test(measurementId || "")) return null;

  const safeMeasurementId = measurementId.toUpperCase();
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${safeMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="medicare-google-analytics" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${safeMeasurementId}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}

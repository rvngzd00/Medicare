"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 520);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="preloader" aria-hidden="true">
      <div className="preloader__brand">
        <span className="preloader__pulse" />
        <strong>Medicare</strong>
      </div>
    </div>
  );
}

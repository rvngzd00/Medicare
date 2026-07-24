"use client";

import { useState } from "react";
import Icon from "@/components/common/Icon";

export default function ShareButtons({ title }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="shareButtons">
      <span>Paylaş</span>
      <button type="button" onClick={share} aria-label="Məqaləni paylaş">
        <Icon name={copied ? "check" : "share"} size={18} /> {copied ? "Link kopyalandı" : "Paylaş"}
      </button>
    </div>
  );
}

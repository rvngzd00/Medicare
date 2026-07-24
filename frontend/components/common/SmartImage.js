"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Icon from "@/components/common/Icon";

export default function SmartImage({
  src,
  alt,
  fill = true,
  width,
  height,
  sizes,
  priority = false,
  className = "",
  fallbackLabel = "Medicare"
}) {
  const safeSrc = safeImageSource(src);
  const [failed, setFailed] = useState(!safeSrc);

  useEffect(() => {
    setFailed(!safeSrc);
  }, [safeSrc]);

  if (failed) {
    return (
      <div className={`imageFallback ${className}`} role="img" aria-label={alt}>
        <Icon name="cross" size={34} />
        <span>{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <Image
      src={safeSrc}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      priority={priority}
      unoptimized={/^https?:\/\//i.test(safeSrc)}
      referrerPolicy={/^https?:\/\//i.test(safeSrc) ? "no-referrer" : undefined}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function safeImageSource(value) {
  const source = typeof value === "string" ? value.trim() : "";
  if (/^\/(?!\/)/.test(source) || /^https?:\/\//i.test(source)) return source;
  return "";
}

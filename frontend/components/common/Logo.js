import Image from "next/image";
import Link from "next/link";

export default function Logo({
  light = false,
  siteName = "Medicare Hospital"
}) {
  const [primaryName, ...secondaryParts] = String(siteName).trim().split(/\s+/);
  const secondaryName = secondaryParts.join(" ");

  return (
    <Link
      className={`logo ${light ? "logo--light" : ""}`}
      href="/"
      aria-label={`${siteName} ana səhifə`}
    >
      <span className="logo__mark" aria-hidden="true">
        <Image
          src="/images/medicare-logo.png"
          alt=""
          width={64}
          height={64}
          sizes="64px"
          priority
        />
      </span>
      <span className="logo__text">
        <strong>{primaryName || "Medicare"}</strong>
        {secondaryName && <small>{secondaryName}</small>}
      </span>
    </Link>
  );
}

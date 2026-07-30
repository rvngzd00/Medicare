import SmartImage from "@/components/common/SmartImage";

function initials(value) {
  return String(value || "M")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("az");
}

export default function ExecutiveDirectorCard({ director }) {
  if (!director || director.active === false) return null;

  return (
    <article className="whySection__director">
      <div className="whySection__directorPortrait">
        {director.image ? (
          <SmartImage
            src={director.image}
            alt={director.imageAlt || `${director.fullName} — ${director.role}`}
            sizes="92px"
            fallbackLabel={initials(director.fullName)}
          />
        ) : (
          <span aria-hidden="true">{initials(director.fullName)}</span>
        )}
      </div>
      <div className="whySection__directorCopy">
        {director.message && <blockquote>{director.message}</blockquote>}
        {director.signature && (
          <span className="whySection__directorSignature">
            {director.signature}
          </span>
        )}
        <div className="whySection__signature">
          <span className="signatureMark" aria-hidden="true">
            {initials(director.fullName).slice(0, 1)}
          </span>
          <p>
            <strong>{director.fullName}</strong>
            <small>{director.role}</small>
          </p>
        </div>
      </div>
    </article>
  );
}

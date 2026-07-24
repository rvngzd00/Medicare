import Icon from "@/components/common/Icon";
import { branches } from "@/data/site";

export default function MapBlock({
  compact = false,
  branchItems = branches
}) {
  const mapLabels = branchItems.slice(0, 3);
  return (
    <div className={`mapBlock ${compact ? "mapBlock--compact" : ""}`}>
      <div className="mapBlock__visual">
        <div className="mapBlock__roads" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        {mapLabels[0] && <div className="mapPin mapPin--one"><Icon name="location" size={21} /><span>{mapLabels[0].name}</span></div>}
        {mapLabels[1] && <div className="mapPin mapPin--two"><Icon name="location" size={21} /><span>{mapLabels[1].name}</span></div>}
        {mapLabels[2] && <div className="mapPin mapPin--three"><Icon name="location" size={21} /><span>{mapLabels[2].name}</span></div>}
        <div className="mapBlock__label"><span>Bakı</span><small>{branchItems.length === 1 ? "Medicare Hospital" : `${branchItems.length} Medicare filialı`}</small></div>
      </div>
      <div className="mapBlock__locations">
        {branchItems.map((branch, index) => (
          <article key={branch.id || branch.slug}>
            <span className="mapBlock__number">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{branch.name}</h3>
              <p>{branch.address}</p>
              <small>
                {branch.hours}
                {branch.mapUrl && (
                  <> · <a href={branch.mapUrl} target="_blank" rel="noopener noreferrer">Xəritədə aç</a></>
                )}
              </small>
            </div>
            <a href={`tel:${String(branch.phone || "").replace(/\s/g, "")}`} aria-label={`${branch.name} filialına zəng et`}>
              <Icon name="phone" size={18} />
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}

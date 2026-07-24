import Icon from "@/components/common/Icon";

export default function EmptyState({ title = "Nəticə tapılmadı", text, action }) {
  return (
    <div className="emptyState" role="status">
      <span className="emptyState__icon"><Icon name="search" size={30} /></span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

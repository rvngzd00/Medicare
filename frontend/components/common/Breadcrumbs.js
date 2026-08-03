import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import Icon from "@/components/common/Icon";
import { absoluteUrl } from "@/utils/seo";

export default function Breadcrumbs({ items }) {
  const allItems = [{ label: "Ana səhifə", href: "/" }, ...items];
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {})
    }))
  };

  return (
    <>
      <nav className="breadcrumbs" aria-label="Səhifə yolu">
        <ol>
          {allItems.map((item, index) => (
            <li key={`${item.label}-${index}`}>
              {index > 0 && <Icon name="chevron" size={14} />}
              {item.href && index < allItems.length - 1 ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={schema} />
    </>
  );
}

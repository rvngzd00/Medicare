import CmsPageSections from "@/components/common/CmsPageSections";
import { getPageContent } from "@/services/content";
import { resolvePageSections } from "@/utils/cmsSections";

function toFallbackSections({ eyebrow, title, description, sections }) {
  return [
    {
      key: "intro",
      type: "HERO",
      label: title,
      eyebrow,
      title,
      description,
      content: {},
      active: true,
    },
    ...sections.map((section, index) => ({
      key: section.key || `section-${index + 1}`,
      type: "RICH_TEXT",
      label: section.title,
      eyebrow: String(index + 1).padStart(2, "0"),
      title: section.title,
      description: section.paragraphs?.[0] || "",
      content: {
        text: [
          ...(section.paragraphs || []).slice(1),
          ...(section.items || []),
        ].join("\n\n"),
      },
      active: true,
    })),
  ];
}

export default async function CmsLegalDocument({
  slug,
  eyebrow,
  title,
  description,
  sections,
}) {
  const fallbackSections = toFallbackSections({
    eyebrow,
    title,
    description,
    sections,
  });
  const fallbackPage = {
    slug,
    title,
    excerpt: description,
    template: "LEGAL",
    body: { version: 2, blocks: [] },
    sections: fallbackSections,
  };
  const result = await getPageContent(slug, fallbackPage);
  const page = result.item || fallbackPage;
  const resolvedSections = resolvePageSections(page, fallbackSections);

  return (
    <CmsPageSections
      sections={resolvedSections}
      breadcrumbs={[{ label: title }]}
    />
  );
}

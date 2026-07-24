import { notFound } from "next/navigation";
import CmsPageSections from "@/components/common/CmsPageSections";
import { getPageContent } from "@/services/content";
import { createMetadata } from "@/utils/seo";
import { resolvePageSections } from "@/utils/cmsSections";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await getPageContent(slug);
  const page = result.item;
  if (!page) return {};
  return createMetadata({
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.excerpt,
    path: `/${slug}`,
    image: page.seo?.ogImage?.url,
    canonical: page.seo?.canonicalUrl,
    keywords: page.seo?.keywords,
    robots: page.seo?.robots,
    ogTitle: page.seo?.ogTitle,
    ogDescription: page.seo?.ogDescription,
    twitterCard: page.seo?.twitterCard,
  });
}

export default async function CmsPublicPage({ params }) {
  const { slug } = await params;
  const result = await getPageContent(slug);
  const page = result.item;
  if (!page) notFound();

  const fallbackSections = page.paragraphs?.length
    ? [
        {
          key: "content",
          type: "RICH_TEXT",
          label: page.title,
          eyebrow: "Medicare",
          title: page.title,
          description: page.excerpt,
          content: { text: page.paragraphs.join("\n\n") },
          active: true,
        },
      ]
    : [];
  const sections = resolvePageSections(page, fallbackSections);

  return (
    <CmsPageSections
      sections={sections}
      breadcrumbs={[{ label: page.title }]}
    />
  );
}

import PageHero from "@/components/common/PageHero";
import NewsDirectory from "@/components/news/NewsDirectory";
import { ContentStatusNotice } from "@/components/common/ContentStatus";
import { CmsPageSection } from "@/components/common/CmsPageSections";
import { getArticlesContent, getPageContent } from "@/services/content";
import { createCmsMetadata } from "@/utils/seo";
import { resolvePageSections } from "@/utils/cmsSections";

const PAGE_FALLBACK = {
  slug: "news",
  title: "Sağlamlıq jurnalı",
  body: { version: 2, blocks: [] },
  sections: [
    { key: "hero", type: "HERO", label: "Səhifə təqdimatı", eyebrow: "Medicare jurnalı", title: "Sağlam seçim üçün aydın tibbi bilik", description: "Həkimlərimizin gündəlik sağlamlıq, profilaktika və yeni tibbi yanaşmalar haqqında praktik izahları.", active: true },
    { key: "collection", type: "COLLECTION", label: "Məqalə siyahısı", active: true },
  ],
};

export async function generateMetadata() {
  const result = await getPageContent("news", PAGE_FALLBACK);
  return createCmsMetadata(result.item, {
    title: "Xəbərlər və tibbi məqalələr",
    description: "Medicare həkimlərindən sağlamlıq, profilaktika və müasir tibbi texnologiyalar haqqında etibarlı məqalələr.",
    path: "/news"
  });
}

export default async function NewsPage() {
  const [content, pageContent] = await Promise.all([
    getArticlesContent(),
    getPageContent("news", PAGE_FALLBACK),
  ]);
  const sections = resolvePageSections(pageContent.item, PAGE_FALLBACK.sections);
  return (
    <div className="cmsPageFlow">
      {sections.map((section) => {
        if (section.key === "hero") return <PageHero key={section.id || section.key} eyebrow={section.eyebrow} title={section.title} description={section.description} breadcrumbs={[{ label: "Xəbərlər" }]} />;
        if (section.key === "collection") return <section className="section" key={section.id || section.key}><div className="container"><ContentStatusNotice result={content} /><NewsDirectory articles={content.items} /></div></section>;
        return <CmsPageSection key={section.id || section.key} section={section} />;
      })}
    </div>
  );
}

import { Suspense } from "react";
import PageHero from "@/components/common/PageHero";
import SearchExperience from "@/components/search/SearchExperience";
import { ContentStatusNotice } from "@/components/common/ContentStatus";
import { getSearchContent } from "@/services/content";
import { createMetadata } from "@/utils/seo";

export const metadata = createMetadata({
  title: "Saytda axtarış",
  description: "Medicare saytında həkim, şöbə, tibbi xidmət və sağlamlıq məqalələrini axtarın.",
  path: "/search"
});

export default async function SearchPage({ searchParams }) {
  const [params, content] = await Promise.all([
    searchParams,
    getSearchContent()
  ]);
  return (
    <>
      <PageHero compact eyebrow="Sayt üzrə axtarış" title="Nə axtarırsınız?" breadcrumbs={[{ label: "Axtarış" }]} />
      <section className="section searchPage">
        <div className="container container--narrow">
          <ContentStatusNotice result={content} />
          <Suspense fallback={<div className="loadingLine" />}>
            <SearchExperience
              initialQuery={params?.q || ""}
              collections={content.collections}
            />
          </Suspense>
        </div>
      </section>
    </>
  );
}

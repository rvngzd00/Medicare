import PageHero from "@/components/common/PageHero";
import DepartmentCard from "@/components/departments/DepartmentCard";
import AppointmentCta from "@/components/common/AppointmentCta";
import { ContentStatusNotice } from "@/components/common/ContentStatus";
import EmptyState from "@/components/common/EmptyState";
import Reveal from "@/components/animations/Reveal";
import { CmsPageSection } from "@/components/common/CmsPageSections";
import { getDepartmentsContent, getPageContent } from "@/services/content";
import { createCmsMetadata } from "@/utils/seo";
import { resolvePageSections } from "@/utils/cmsSections";

const PAGE_FALLBACK = {
  slug: "departments",
  title: "Tibbi şöbələr",
  body: { version: 2, blocks: [] },
  sections: [
    { key: "hero", type: "HERO", label: "Səhifə təqdimatı", eyebrow: "10 tibbi istiqamət", title: "Eyni məqsəd üçün birləşən şöbələr", description: "Hər şöbə öz sahəsində dərin təcrübəyə malikdir, mürəkkəb hallarda isə komandalar vahid qərar üçün birlikdə çalışır.", active: true },
    { key: "collection", type: "COLLECTION", label: "Şöbə siyahısı", active: true },
    { key: "appointment", type: "CTA", label: "Qəbul çağırışı", title: "Doğru şöbədən başlamağa kömək edək", description: "Əlaqə komandamız sizi uyğun klinik istiqamətə yönləndirsin.", active: true },
  ],
};

export async function generateMetadata() {
  const result = await getPageContent("departments", PAGE_FALLBACK);
  return createCmsMetadata(result.item, {
    title: "Tibbi şöbələr",
    description: "Medicare Hospital-ın kardiologiya, nevrologiya, pediatriya, cərrahiyyə və digər ixtisaslaşmış tibbi şöbələri.",
    path: "/departments"
  });
}

export default async function DepartmentsPage() {
  const [content, pageContent] = await Promise.all([
    getDepartmentsContent(),
    getPageContent("departments", PAGE_FALLBACK),
  ]);
  const sections = resolvePageSections(pageContent.item, PAGE_FALLBACK.sections);
  return (
    <div className="cmsPageFlow">
      {sections.map((section) => {
        if (section.key === "hero") return <PageHero key={section.id || section.key} eyebrow={section.eyebrow} title={section.title} description={section.description} breadcrumbs={[{ label: "Şöbələr" }]} />;
        if (section.key === "collection") return (
          <section className="section section--soft" key={section.id || section.key}>
            <div className="container">
              <ContentStatusNotice result={content} />
              {content.items.length > 0 ? (
                <div className="cardGrid cardGrid--three">
                  {content.items.map((department, index) => <Reveal key={department.slug} delay={(index % 3) * 60}><DepartmentCard department={department} index={index} /></Reveal>)}
                </div>
              ) : <EmptyState title="Aktiv şöbə tapılmadı" text="Şöbə məlumatları yeniləndikdən sonra bu bölmədə görünəcək." />}
            </div>
          </section>
        );
        if (section.key === "appointment") return <AppointmentCta key={section.id || section.key} eyebrow={section.eyebrow} title={section.title} text={section.description} primaryLabel={section.content.primaryLabel} primaryHref={section.content.primaryHref} secondaryLabel={section.content.secondaryLabel} secondaryHref={section.content.secondaryHref} />;
        return <CmsPageSection key={section.id || section.key} section={section} />;
      })}
    </div>
  );
}

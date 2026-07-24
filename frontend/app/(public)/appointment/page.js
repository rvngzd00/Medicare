import { Suspense } from "react";
import PageHero from "@/components/common/PageHero";
import AppointmentForm from "@/components/forms/AppointmentForm";
import { ContentStatusNotice } from "@/components/common/ContentStatus";
import EmptyState from "@/components/common/EmptyState";
import { CmsPageSection } from "@/components/common/CmsPageSections";
import Icon from "@/components/common/Icon";
import {
  getBranchesContent,
  getDepartmentsContent,
  getDoctorsContent,
  getPageContent,
  getPublicConfigurationContent,
} from "@/services/content";
import { createCmsMetadata } from "@/utils/seo";
import { resolvePageSections } from "@/utils/cmsSections";

const PAGE_FALLBACK = {
  slug: "appointment",
  title: "Qəbula yazıl",
  body: { version: 2, blocks: [] },
  sections: [
    { key: "hero", type: "HERO", label: "Səhifə təqdimatı", eyebrow: "Onlayn qəbul sorğusu", title: "Qəbulunuzu bir neçə addımda planlayın", description: "Məlumatları qeyd edin, uyğun vaxtı seçin. Operatorumuz sorğunu dəqiqləşdirmək üçün sizinlə əlaqə saxlayacaq.", active: true },
    { key: "form", type: "CUSTOM", label: "Qəbul forması", eyebrow: "Qəbul məlumatları", title: "Sizə necə kömək edə bilərik?", description: "Dəqiq məlumatlar sizinlə daha sürətli əlaqə saxlamağımıza kömək edir.", active: true },
  ],
};

const defaultSteps = [
  { title: "Məlumatları daxil edin", text: "Şöbə, həkim və sizə uyğun vaxtı seçin." },
  { title: "Operator təsdiqi", text: "Komandamız telefonla məlumatı və vaxtı dəqiqləşdirir." },
  { title: "Qəbul xatırlatması", text: "Hazırlıq qaydası və ünvan SMS vasitəsilə göndərilir." },
];

export async function generateMetadata() {
  const result = await getPageContent("appointment", PAGE_FALLBACK);
  return createCmsMetadata(result.item, {
    title: "Qəbula yazıl",
    description: "Medicare Hospital-da həkim qəbulu üçün onlayn sorğu göndərin. Şöbə, həkim və uyğun vaxtı seçin.",
    path: "/appointment"
  });
}

export default async function AppointmentPage() {
  const [
    departmentContent,
    doctorContent,
    branchContent,
    pageContent,
    configurationContent
  ] = await Promise.all([
    getDepartmentsContent(),
    getDoctorsContent(),
    getBranchesContent(),
    getPageContent("appointment", PAGE_FALLBACK),
    getPublicConfigurationContent(),
  ]);
  const CONTACT = configurationContent.configuration.contact;
  const departments = departmentContent.items.map((department) => ({
    value: department.id || department.slug,
    id: department.id,
    slug: department.slug,
    name: department.name
  }));
  const doctors = doctorContent.items.map((doctor) => ({
    value: doctor.id || doctor.slug,
    id: doctor.id,
    slug: doctor.slug,
    name: doctor.name,
    departmentValue:
      departments.find((department) => department.slug === doctor.department)
        ?.value ||
      doctor.departmentId ||
      doctor.department
  }));
  const branches = branchContent.items.map((branch) => ({
    value: branch.id || branch.slug,
    id: branch.id,
    slug: branch.slug,
    name: branch.name
  }));
  const optionResults = [departmentContent, doctorContent, branchContent];
  const optionStatus = {
    unavailable: optionResults.some((result) => result.unavailable),
    source: optionResults.some((result) => result.unavailable)
      ? "fallback"
      : optionResults.every((result) => result.source === "live")
        ? "live"
        : "mock"
  };
  const formReady = departments.length > 0 && branches.length > 0;
  const sections = resolvePageSections(pageContent.item, PAGE_FALLBACK.sections);

  return (
    <div className="cmsPageFlow">
      {sections.map((section) => {
        if (section.key === "hero") return <PageHero key={section.id || section.key} eyebrow={section.eyebrow} title={section.title} description={section.description} breadcrumbs={[{ label: "Qəbula yazıl" }]} />;
        if (section.key === "form") {
          const steps = Array.isArray(section.content.items) ? section.content.items : defaultSteps;
          return (
            <section className="section appointmentPage" key={section.id || section.key}>
              <div className="container appointmentPage__grid">
                <aside className="appointmentPage__aside">
                  <span className="eyebrow">{section.content.stepsEyebrow || "Necə işləyir?"}</span>
                  <h2>{section.content.stepsTitle || "Sadə və aydın qəbul prosesi"}</h2>
                  <ol className="appointmentSteps">
                    {steps.slice(0, 5).map((step, index) => <li key={step.title || index}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.text || step.description}</p></div></li>)}
                  </ol>
                  <div className="appointmentHelp">
                    <span><Icon name="phone" size={22} /></span>
                    <div><small>Təcili və ya yaxın vaxt üçün</small><a href={CONTACT.phoneHref}>{CONTACT.phone}</a></div>
                  </div>
                  <p className="appointmentPrivacy"><Icon name="shield" size={17} />Məlumatlarınız təhlükəsiz şəkildə işlənir və yalnız qəbulun təşkili üçün istifadə olunur.</p>
                </aside>
                <div className="formCard">
                  <div className="formCard__header"><div><span className="eyebrow">{section.eyebrow}</span><h2>{section.title}</h2><p>{section.description}</p></div><Icon name="calendar" size={28} /></div>
                  <ContentStatusNotice result={optionStatus} />
                  {formReady ? (
                    <Suspense fallback={<FormSkeleton />}>
                      <AppointmentForm departments={departments} doctors={doctors} branches={branches} />
                    </Suspense>
                  ) : <EmptyState title="Qəbul seçimləri hazırda mövcud deyil" text="Şöbə məlumatları yenilənir. Yaxın qəbul üçün əlaqə mərkəzinə zəng edin." action={<a className="button button--soft" href={CONTACT.phoneHref}>{CONTACT.phone}</a>} />}
                </div>
              </div>
            </section>
          );
        }
        return <CmsPageSection key={section.id || section.key} section={section} />;
      })}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="formSkeleton" aria-label="Forma yüklənir" role="status">
      {Array.from({ length: 8 }).map((_, index) => <span key={index} />)}
    </div>
  );
}

import PageHero from "@/components/common/PageHero";

export default function LegalDocument({ eyebrow, title, description, updated, sections, pathLabel }) {
  return (
    <>
      <PageHero
        compact
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={[{ label: pathLabel || title }]}
      />
      <section className="section legalPage">
        <div className="container legalPage__grid">
          <aside>
            <p><small>Son yenilənmə</small><strong>{updated}</strong></p>
            <nav aria-label="Sənəd bölmələri">
              {sections.map((section, index) => <a key={section.title} href={`#legal-${index + 1}`}>{section.title}</a>)}
            </nav>
          </aside>
          <article className="legalContent">
            <p className="legalContent__intro">{description}</p>
            {sections.map((section, index) => (
              <section id={`legal-${index + 1}`} key={section.title}>
                <h2>{index + 1}. {section.title}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
              </section>
            ))}
            <div className="legalContact">
              <h2>Sualınız var?</h2>
              <p>Bu sənəd və şəxsi məlumatlarınızın işlənməsi barədə <a href="mailto:official@medicarehospital.az">official@medicarehospital.az</a> ünvanına yaza bilərsiniz.</p>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

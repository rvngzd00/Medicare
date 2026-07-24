import { notFound } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/common/PageHero";
import SmartImage from "@/components/common/SmartImage";
import ArticleCard from "@/components/news/ArticleCard";
import ShareButtons from "@/components/news/ShareButtons";
import ContactCta from "@/components/common/ContactCta";
import Icon from "@/components/common/Icon";
import JsonLd from "@/components/seo/JsonLd";
import {
  ContentStatusNotice,
  ContentUnavailable
} from "@/components/common/ContentStatus";
import {
  getArticleContent,
  getArticlesContent
} from "@/services/content";
import { createMetadata, absoluteUrl } from "@/utils/seo";

export const dynamicParams = true;

export async function generateStaticParams() {
  const result = await getArticlesContent();
  return result.items.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { item: article } = await getArticleContent(slug);
  if (!article) return {};
  const seo = article.seo || {};
  return createMetadata({
    title: seo.title || article.title,
    description: seo.description || article.excerpt,
    path: `/news/${article.slug}`,
    image: seo.ogImage?.url || article.image,
    type: "article",
    canonical: seo.canonicalUrl,
    keywords: seo.keywords,
    robots: seo.robots,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    twitterCard: seo.twitterCard
  });
}

export default async function ArticleDetailPage({ params }) {
  const { slug } = await params;
  const [content, directory] = await Promise.all([
    getArticleContent(slug),
    getArticlesContent()
  ]);
  const article = content.item;
  if (!article && content.unavailable) {
    return <ContentUnavailable title="Məqaləni yükləyə bilmədik" />;
  }
  if (!article) notFound();
  const related = article.relatedArticles?.length
    ? article.relatedArticles
    : directory.items.filter(
        (item) =>
          item.slug !== article.slug &&
          item.category === article.category
      );
  const fallbackRelated = related.length
    ? related.slice(0, 3)
    : directory.items
        .filter((item) => item.slug !== article.slug)
        .slice(0, 3);
  const degradedResult = content.unavailable ? content : directory;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: [absoluteUrl(article.image)],
    datePublished: article.date,
    dateModified: article.date,
    author: { "@type": "Person", name: article.author },
    publisher: {
      "@type": "Organization",
      name: "Medicare Hospital",
      logo: { "@type": "ImageObject", url: absoluteUrl("/images/medicare-logo.png") }
    },
    mainEntityOfPage: absoluteUrl(`/news/${article.slug}`)
  };

  return (
    <>
      <PageHero
        compact
        eyebrow={article.category}
        title={article.title}
        description={article.excerpt}
        breadcrumbs={[
          { label: "Xəbərlər", href: "/news" },
          { label: article.title }
        ]}
      />
      <article className="section articleDetail">
        <div className="container articleDetail__shell">
          <ContentStatusNotice result={degradedResult} />
          <header className="articleDetail__meta">
            <div className="authorBadge"><span>{article.author.charAt(0)}</span><p><small>Müəllif</small><strong>{article.author}</strong></p></div>
            <div><span><Icon name="calendar" size={16} />{article.displayDate}</span><span><Icon name="clock" size={16} />{article.readTime} oxu</span></div>
          </header>
          <div className="articleDetail__cover"><SmartImage src={article.image} alt={article.title} sizes="(max-width: 900px) 100vw, 1100px" priority fallbackLabel={article.category} /></div>
          <div className="articleDetail__layout">
            <aside>
              <div className="articleToc">
                <span>Bu məqalədə</span>
                <ol>{article.content.map((section, index) => <li key={section.heading}><a href={`#section-${index + 1}`}>{section.heading}</a></li>)}</ol>
              </div>
              <ShareButtons title={article.title} />
            </aside>
            <div className="articleBody">
              <p className="articleLead">{article.excerpt}</p>
              {article.content.map((section, index) => (
                <section id={`section-${index + 1}`} key={section.heading}>
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </section>
              ))}
              <aside className="medicalNote">
                <Icon name="shield" size={23} />
                <p><strong>Tibbi qeyd</strong><span>Bu məqalə məlumat xarakterlidir və həkim müayinəsini əvəz etmir. Şəxsi şikayətlər üçün mütəxəssisə müraciət edin.</span></p>
              </aside>
              {article.doctorSlug && (
                <Link className="articleAuthorLink" href={`/doctors/${article.doctorSlug}`}>
                  Müəllif həkimin profilinə bax <Icon name="arrow" size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </article>
      {fallbackRelated.length > 0 && (
        <section className="section section--soft">
          <div className="container">
            <div className="sectionHeading"><span className="eyebrow">Oxumağa davam edin</span><h2>Əlaqəli məqalələr</h2></div>
            <div className="cardGrid cardGrid--three">{fallbackRelated.map((item) => <ArticleCard article={item} key={item.slug} />)}</div>
          </div>
        </section>
      )}
      <ContactCta />
      <JsonLd data={articleSchema} />
    </>
  );
}

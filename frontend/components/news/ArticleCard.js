import Link from "next/link";
import SmartImage from "@/components/common/SmartImage";
import Icon from "@/components/common/Icon";
import styles from "@/components/common/Cards.module.css";

export default function ArticleCard({ article }) {
  return (
    <article className={styles.articleCard}>
      <Link className={styles.articleImage} href={`/news/${article.slug}`} tabIndex={-1}>
        <span className={styles.articleCategory}>{article.category}</span>
        <SmartImage
          src={article.image}
          alt={article.title}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          fallbackLabel={article.category}
        />
      </Link>
      <div className={styles.articleContent}>
        <div className={styles.articleMeta}>
          <span>{article.displayDate}</span><span>{article.readTime} oxu</span>
        </div>
        <h3><Link href={`/news/${article.slug}`}>{article.title}</Link></h3>
        <p>{article.excerpt}</p>
        <Link className={styles.textLink} href={`/news/${article.slug}`}>
          Məqaləni oxu <Icon name="arrow" size={17} />
        </Link>
      </div>
    </article>
  );
}

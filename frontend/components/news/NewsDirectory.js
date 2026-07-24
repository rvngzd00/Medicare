"use client";

import { useMemo, useState } from "react";
import ArticleCard from "@/components/news/ArticleCard";
import EmptyState from "@/components/common/EmptyState";
import Icon from "@/components/common/Icon";

export default function NewsDirectory({ articles }) {
  const allCategoriesLabel = "Bütün yazılar";
  const [category, setCategory] = useState(allCategoriesLabel);
  const [query, setQuery] = useState("");
  const categories = useMemo(
    () => [
      allCategoriesLabel,
      ...new Set(articles.map((article) => article.category).filter(Boolean))
    ],
    [articles]
  );
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("az");
    return articles.filter((article) => {
      const categoryMatch = category === allCategoriesLabel || article.category === category;
      const queryMatch = !normalized || `${article.title} ${article.excerpt} ${article.author}`.toLocaleLowerCase("az").includes(normalized);
      return categoryMatch && queryMatch;
    });
  }, [articles, category, query]);

  return (
    <>
      <div className="newsTools">
        <div className="chipList" role="group" aria-label="Məqalə kateqoriyaları">
          {categories.map((item) => (
            <button className={category === item ? "is-active" : ""} type="button" onClick={() => setCategory(item)} key={item}>{item}</button>
          ))}
        </div>
        <label className="inlineSearch">
          <Icon name="search" size={18} />
          <span className="srOnly">Məqalə axtar</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Məqalə axtar..." />
        </label>
      </div>
      {results.length ? (
        <div className="cardGrid cardGrid--three">
          {results.map((article) => <ArticleCard article={article} key={article.slug} />)}
        </div>
      ) : (
        <EmptyState title="Məqalə tapılmadı" text="Başqa açar söz və ya kateqoriya ilə axtarın." action={<button className="button button--soft" type="button" onClick={() => { setQuery(""); setCategory(allCategoriesLabel); }}>Axtarışı sıfırla</button>} />
      )}
    </>
  );
}

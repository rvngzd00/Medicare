"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/common/Icon";
import EmptyState from "@/components/common/EmptyState";
export default function SearchExperience({ initialQuery = "", collections }) {
  const [query, setQuery] = useState(initialQuery);
  const searchable = useMemo(
    () => [
      ...(collections?.doctors || []).map((item) => ({ type: "Həkim", title: item.name, text: `${item.specialty}. ${item.bio}`, href: `/doctors/${item.slug}`, icon: "user" })),
      ...(collections?.departments || []).map((item) => ({ type: "Şöbə", title: item.name, text: item.summary, href: `/departments/${item.slug}`, icon: item.icon })),
      ...(collections?.services || []).map((item) => ({ type: "Xidmət", title: item.name, text: item.summary, href: `/services/${item.slug}`, icon: item.icon })),
      ...(collections?.articles || []).map((item) => ({ type: "Məqalə", title: item.title, text: item.excerpt, href: `/news/${item.slug}`, icon: "document" }))
    ],
    [collections]
  );
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("az");
    if (normalized.length < 2) return [];
    return searchable.filter((item) => `${item.title} ${item.text} ${item.type}`.toLocaleLowerCase("az").includes(normalized));
  }, [query, searchable]);

  return (
    <div className="searchExperience">
      <label className="searchExperience__input">
        <span className="srOnly">Saytda axtar</span>
        <Icon name="search" size={24} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Həkim, şöbə, xidmət və ya mövzu..." autoFocus />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Axtarışı təmizlə"><Icon name="close" size={18} /></button>}
      </label>
      {query.trim().length < 2 ? (
        <div className="searchExperience__hint">
          <p>Axtarış üçün ən azı 2 simvol yazın.</p>
          <div className="chipList">
            {["Kardiologiya", "Laboratoriya", "Pediatr", "Check-up"].map((word) => <button type="button" key={word} onClick={() => setQuery(word)}>{word}</button>)}
          </div>
        </div>
      ) : results.length ? (
        <>
          <p className="searchExperience__count"><strong>{results.length}</strong> nəticə tapıldı</p>
          <div className="searchResults">
            {results.map((item) => (
              <Link href={item.href} key={`${item.type}-${item.href}`}>
                <span className="searchResults__icon"><Icon name={item.icon} size={22} /></span>
                <span><small>{item.type}</small><strong>{item.title}</strong><p>{item.text}</p></span>
                <Icon name="arrow" size={19} />
              </Link>
            ))}
          </div>
        </>
      ) : (
        <EmptyState title={`“${query}” üçün nəticə yoxdur`} text="Yazılışı yoxlayın və daha ümumi açar sözlə yenidən sınayın." />
      )}
    </div>
  );
}

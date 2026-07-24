import { SITE_NAME, SITE_URL } from "@/constants/site";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function createMetadata({
  title,
  description,
  path = "/",
  image = "/images/medicare-og-cover.jpg",
  type = "website",
  canonical,
  keywords,
  robots,
  ogTitle,
  ogDescription,
  twitterCard = "summary_large_image"
}) {
  const cleanTitle = typeof title === "string" ? title.trim() : "";
  const fullTitle = cleanTitle
    ? cleanTitle.toLocaleLowerCase("az").includes(SITE_NAME.toLocaleLowerCase("az"))
      ? cleanTitle
      : `${cleanTitle} | ${SITE_NAME}`
    : `${SITE_NAME} — Dəqiq tibbi qayğı`;
  const canonicalUrl = safeWebUrl(canonical) || absoluteUrl(path);
  const imageUrl =
    safeWebUrl(image) || absoluteUrl("/images/medicare-og-cover.jpg");
  const socialTitle = ogTitle || fullTitle;
  const socialDescription = ogDescription || description;

  return {
    title: { absolute: fullTitle },
    description,
    ...(keywords?.length ? { keywords } : {}),
    ...(robots ? { robots } : {}),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "az_AZ",
      type,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: fullTitle }]
    },
    twitter: {
      card: ["summary", "summary_large_image"].includes(twitterCard)
        ? twitterCard
        : "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: [imageUrl]
    }
  };
}

export function createCmsMetadata(
  page,
  { title, description, path, image, type = "website" }
) {
  return createMetadata({
    title: page?.seo?.title || page?.title || title,
    description: page?.seo?.description || page?.excerpt || description,
    path,
    image: page?.seo?.ogImage?.url || image,
    type,
    canonical: page?.seo?.canonicalUrl,
    keywords: page?.seo?.keywords,
    robots: page?.seo?.robots,
    ogTitle: page?.seo?.ogTitle,
    ogDescription: page?.seo?.ogDescription,
    twitterCard: page?.seo?.twitterCard
  });
}

function safeWebUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, SITE_URL);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

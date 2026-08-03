import { SITE_NAME, SITE_URL } from "@/constants/site";

export const DEFAULT_SEO_DESCRIPTION =
  "Medicare Hospital-da ixtisaslaşmış həkimlər, müasir diaqnostika, laboratoriya və fərdi tibbi xidmətlərlə sağlamlığınız üçün etibarlı qayğı alın.";

export const DEFAULT_ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1
  }
};

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
  twitterCard = "summary_large_image",
  publishedTime,
  modifiedTime,
  authors
}) {
  const cleanTitle = typeof title === "string" ? title.trim() : "";
  const cleanDescription =
    typeof description === "string" && description.trim()
      ? description.trim()
      : DEFAULT_SEO_DESCRIPTION;
  const fullTitle = cleanTitle
    ? cleanTitle.toLocaleLowerCase("az").includes(SITE_NAME.toLocaleLowerCase("az"))
      ? cleanTitle
      : `${cleanTitle} | ${SITE_NAME}`
    : `${SITE_NAME} — Dəqiq tibbi qayğı`;
  const canonicalUrl = safeWebUrl(canonical) || absoluteUrl(path);
  const imageUrl =
    safeWebUrl(image) || absoluteUrl("/images/medicare-og-cover.jpg");
  const socialTitle = ogTitle || fullTitle;
  const socialDescription =
    typeof ogDescription === "string" && ogDescription.trim()
      ? ogDescription.trim()
      : cleanDescription;
  const normalizedAuthors = Array.isArray(authors)
    ? authors.filter((author) => typeof author === "string" && author.trim())
    : [];

  return {
    title: { absolute: fullTitle },
    description: cleanDescription,
    ...(normalizeKeywords(keywords).length
      ? { keywords: normalizeKeywords(keywords) }
      : {}),
    robots: normalizeRobots(robots),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "az_AZ",
      type,
      ...(type === "article" && publishedTime
        ? { publishedTime: validIsoDate(publishedTime) }
        : {}),
      ...(type === "article" && (modifiedTime || publishedTime)
        ? { modifiedTime: validIsoDate(modifiedTime || publishedTime) }
        : {}),
      ...(type === "article" && normalizedAuthors.length
        ? { authors: normalizedAuthors }
        : {}),
      images: [{ url: imageUrl, alt: fullTitle }]
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

function normalizeKeywords(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((keyword) => String(keyword).trim()).filter(Boolean))];
  }
  if (typeof value === "string") {
    return [...new Set(value.split(",").map((keyword) => keyword.trim()).filter(Boolean))];
  }
  return [];
}

function normalizeRobots(value) {
  if (typeof value === "string") {
    const directives = new Set(
      value.toLocaleLowerCase("en").split(",").map((item) => item.trim())
    );
    return {
      ...DEFAULT_ROBOTS,
      index: !directives.has("noindex"),
      follow: !directives.has("nofollow"),
      ...(directives.has("noarchive") ? { nocache: true } : {}),
      googleBot: {
        ...DEFAULT_ROBOTS.googleBot,
        index: !directives.has("noindex"),
        follow: !directives.has("nofollow")
      }
    };
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const googleBot = value.googleBot || {};
    return {
      ...DEFAULT_ROBOTS,
      ...value,
      googleBot: {
        ...DEFAULT_ROBOTS.googleBot,
        index: googleBot.index ?? value.index ?? DEFAULT_ROBOTS.googleBot.index,
        follow: googleBot.follow ?? value.follow ?? DEFAULT_ROBOTS.googleBot.follow,
        ...googleBot
      }
    };
  }
  return DEFAULT_ROBOTS;
}

function validIsoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
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

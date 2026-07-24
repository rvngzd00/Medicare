import { SITE_URL } from "@/constants/site";
import {
  getArticlesContent,
  getDepartmentsContent,
  getDoctorsContent,
  getPublishedPagesContent,
  getServicesContent
} from "@/services/content";

export default async function sitemap() {
  const [
    doctorResult,
    departmentResult,
    serviceResult,
    articleResult,
    pageResult
  ] =
    await Promise.all([
      getDoctorsContent(),
      getDepartmentsContent(),
      getServicesContent(),
      getArticlesContent(),
      getPublishedPagesContent()
    ]);
  const staticRoutes = [
    "",
    "/about",
    "/doctors",
    "/departments",
    "/services",
    "/news",
    "/appointment",
    "/contact",
    "/faq",
    "/privacy-policy",
    "/terms",
    "/cookie-policy",
    "/search"
  ];
  const now = new Date();
  const staticSlugs = new Set(
    staticRoutes.map((route) => route.replace(/^\//, "") || "home")
  );
  const customPages = pageResult.items.filter(
    (page) => page?.slug && !staticSlugs.has(page.slug)
  );
  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: now,
      changeFrequency: route === "" ? "weekly" : "monthly",
      priority: route === "" ? 1 : 0.7
    })),
    ...doctorResult.items.map((item) => ({ url: `${SITE_URL}/doctors/${item.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.8 })),
    ...departmentResult.items.map((item) => ({ url: `${SITE_URL}/departments/${item.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.8 })),
    ...serviceResult.items.map((item) => ({ url: `${SITE_URL}/services/${item.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.75 })),
    ...articleResult.items.map((item) => ({ url: `${SITE_URL}/news/${item.slug}`, lastModified: validDate(item.date, now), changeFrequency: "yearly", priority: 0.65 })),
    ...customPages.map((page) => ({
      url: `${SITE_URL}/${page.slug}`,
      lastModified: validDate(page.updatedAt, now),
      changeFrequency: "monthly",
      priority: 0.65
    }))
  ];
}

function validDate(value, fallback) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

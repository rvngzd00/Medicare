import "server-only";
import { cache } from "react";

import { doctors as mockDoctors, getDoctor as getMockDoctor } from "@/data/doctors";
import {
  departments as mockDepartments,
  getDepartment as getMockDepartment
} from "@/data/departments";
import { services as mockServices, getService as getMockService } from "@/data/services";
import { articles as mockArticles, getArticle as getMockArticle } from "@/data/articles";
import {
  branches as mockBranches,
  leadership as mockLeadership,
  facilities as mockFacilities,
  testimonials as mockTestimonials
} from "@/data/site";
import { faqs as mockFaqs } from "@/data/faqs";
import {
  CONTACT as mockContact,
  MAIN_NAV as mockNavigation,
  SOCIAL_LINKS as mockSocialLinks
} from "@/constants/site";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/+$/, "");
const API_ORIGIN = getApiOrigin(API_URL);
const CONTENT_REVALIDATE_SECONDS = 300;
const SHORT_CONTENT_REVALIDATE_SECONDS = 60;
const CONTENT_FAILURE_COOLDOWN_MS = 15_000;
const CONTENT_REQUEST_TIMEOUT_MS = 8_000;
let contentUnavailableUntil = 0;
let lastContentFailureMessage = "";
const mockCertificates = [
  {
    id: "iso-9001",
    code: "ISO 9001:2015",
    title: "Keyfiyyət idarəetmə sistemi",
    description: ""
  },
  {
    id: "iso-15189",
    code: "ISO 15189",
    title: "Tibbi laboratoriya keyfiyyəti",
    description: ""
  },
  {
    id: "himss-ready",
    code: "HIMSS Ready",
    title: "Rəqəmsal klinik proseslər",
    description: ""
  }
];

export const USE_LIVE_CONTENT = process.env.NEXT_PUBLIC_USE_MOCK_API !== "true";

class ContentApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ContentApiError";
    this.status = status;
  }
}

async function requestContent(
  path,
  { revalidate = CONTENT_REVALIDATE_SECONDS } = {}
) {
  if (contentUnavailableUntil > Date.now()) {
    throw new ContentApiError(
      lastContentFailureMessage || "Canlı məzmun xidməti müvəqqəti əlçatmazdır.",
      503
    );
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
      // Production Prisma gives up pool/connection work within five seconds;
      // leave enough time for its structured 503 response to reach Next.js.
      signal: AbortSignal.timeout(CONTENT_REQUEST_TIMEOUT_MS)
    });
  } catch {
    lastContentFailureMessage = "Canlı məzmun xidməti ilə əlaqə yaratmaq mümkün olmadı.";
    contentUnavailableUntil = Date.now() + CONTENT_FAILURE_COOLDOWN_MS;
    throw new ContentApiError(lastContentFailureMessage);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ContentApiError("Məzmun xidməti etibarlı cavab qaytarmadı.", response.status);
  }

  if (!response.ok || payload?.success !== true) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      "Canlı məzmunu yükləmək mümkün olmadı.";
    if (response.status >= 500) {
      lastContentFailureMessage = message;
      contentUnavailableUntil = Date.now() + CONTENT_FAILURE_COOLDOWN_MS;
    }
    throw new ContentApiError(message, response.status);
  }

  contentUnavailableUntil = 0;
  lastContentFailureMessage = "";
  return { data: payload.data, meta: payload.meta || null };
}

async function getCollection(path, mockItems, adapter, options = {}) {
  if (!USE_LIVE_CONTENT) {
    return {
      items: mockItems.map((item) => adapter(item)),
      source: "mock",
      meta: null,
      unavailable: false
    };
  }

  try {
    const result = await requestContent(path, options);
    const rawItems = Array.isArray(result.data) ? result.data : [];
    return {
      items: rawItems.map((item) => adapter(item)),
      source: "live",
      meta: result.meta,
      unavailable: false
    };
  } catch (error) {
    return {
      items: [],
      source: "unavailable",
      meta: null,
      unavailable: true,
      message: error.message
    };
  }
}

async function getDetail(path, mockItem, adapter, options = {}) {
  if (!USE_LIVE_CONTENT) {
    return {
      item: mockItem ? adapter(mockItem) : null,
      source: "mock",
      unavailable: false
    };
  }

  try {
    const result = await requestContent(path, options);
    return {
      item: result.data ? adapter(result.data) : null,
      source: "live",
      unavailable: false
    };
  } catch (error) {
    if (error.status === 404) {
      return { item: null, source: "live", unavailable: false };
    }
    return {
      item: null,
      source: "unavailable",
      unavailable: true,
      message: error.message
    };
  }
}

export function getDoctorsContent() {
  return getCollection("/public/doctors?limit=100", mockDoctors, adaptDoctor);
}

export function getDoctorContent(slug) {
  return getDetail(
    `/public/doctors/${encodeURIComponent(slug)}`,
    getMockDoctor(slug),
    adaptDoctor
  );
}

export function getDepartmentsContent() {
  return getCollection(
    "/public/departments?limit=100",
    mockDepartments,
    adaptDepartment
  );
}

export function getDepartmentContent(slug) {
  return getDetail(
    `/public/departments/${encodeURIComponent(slug)}`,
    getMockDepartment(slug),
    adaptDepartment
  );
}

export function getServicesContent() {
  return getCollection(
    "/public/services?limit=100",
    mockServices,
    adaptService,
    { revalidate: SHORT_CONTENT_REVALIDATE_SECONDS }
  );
}

export function getServiceContent(slug) {
  return getDetail(
    `/public/services/${encodeURIComponent(slug)}`,
    getMockService(slug),
    adaptService,
    { revalidate: SHORT_CONTENT_REVALIDATE_SECONDS }
  );
}

export function getArticlesContent() {
  return getCollection("/public/articles?limit=100", mockArticles, adaptArticle);
}

export function getBranchesContent() {
  return getCollection(
    "/public/content/branches?limit=100",
    mockBranches,
    adaptBranch
  );
}

export function getFaqsContent() {
  return getCollection(
    "/public/content/faqs?limit=100",
    mockFaqs,
    adaptFaq
  );
}

export function getTestimonialsContent() {
  return getCollection(
    "/public/content/testimonials?limit=100",
    mockTestimonials,
    adaptTestimonial
  );
}

export function getCertificatesContent() {
  return getCollection(
    "/public/content/certificates?limit=100",
    mockCertificates,
    adaptCertificate
  );
}

export function getGalleryContent() {
  return getCollection(
    "/public/content/gallery?limit=100",
    mockFacilities,
    adaptGalleryItem
  );
}

export function getLeadershipContent() {
  return getCollection(
    "/public/content/leadership?limit=100",
    mockLeadership,
    adaptLeadership,
    { revalidate: SHORT_CONTENT_REVALIDATE_SECONDS }
  );
}

export async function getPageContent(slug, mockPage = null) {
  return getDetail(
    `/public/pages/${encodeURIComponent(slug)}`,
    mockPage,
    adaptContentPage,
    { revalidate: SHORT_CONTENT_REVALIDATE_SECONDS }
  );
}

function bundledCollection(items, adapter) {
  return {
    items: (Array.isArray(items) ? items : []).map((item) => adapter(item)),
    source: "live",
    meta: null,
    unavailable: false
  };
}

function unavailableCollection(message) {
  return {
    items: [],
    source: "unavailable",
    meta: null,
    unavailable: true,
    message
  };
}

export const getHomeContentBundle = cache(async function getHomeContentBundle() {
  if (!USE_LIVE_CONTENT) {
    const [
      pageContent,
      leadershipContent,
      serviceContent,
      departmentContent,
      doctorContent,
      articleContent,
      testimonialContent,
      faqContent,
      branchContent
    ] = await Promise.all([
      getPageContent("home"),
      getLeadershipContent(),
      getServicesContent(),
      getDepartmentsContent(),
      getDoctorsContent(),
      getArticlesContent(),
      getTestimonialsContent(),
      getFaqsContent(),
      getBranchesContent()
    ]);
    return {
      pageContent,
      leadershipContent,
      serviceContent,
      departmentContent,
      doctorContent,
      articleContent,
      testimonialContent,
      faqContent,
      branchContent
    };
  }

  try {
    const { data } = await requestContent("/public/home", {
      revalidate: SHORT_CONTENT_REVALIDATE_SECONDS
    });
    return {
      pageContent: {
        item: data?.page ? adaptContentPage(data.page) : null,
        source: "live",
        unavailable: false
      },
      leadershipContent: bundledCollection(data?.leadership, adaptLeadership),
      serviceContent: bundledCollection(data?.services, adaptService),
      departmentContent: bundledCollection(data?.departments, adaptDepartment),
      doctorContent: bundledCollection(data?.doctors, adaptDoctor),
      articleContent: bundledCollection(data?.articles, adaptArticle),
      testimonialContent: bundledCollection(data?.testimonials, adaptTestimonial),
      faqContent: bundledCollection(data?.faqs, adaptFaq),
      branchContent: bundledCollection(data?.branches, adaptBranch)
    };
  } catch (error) {
    const unavailable = () => unavailableCollection(error.message);
    return {
      pageContent: {
        item: null,
        source: "unavailable",
        unavailable: true,
        message: error.message
      },
      leadershipContent: unavailable(),
      serviceContent: unavailable(),
      departmentContent: unavailable(),
      doctorContent: unavailable(),
      articleContent: unavailable(),
      testimonialContent: unavailable(),
      faqContent: unavailable(),
      branchContent: unavailable()
    };
  }
});

export async function getPublishedPagesContent() {
  if (!USE_LIVE_CONTENT) {
    return { items: [], source: "mock", unavailable: false };
  }
  try {
    const result = await requestContent("/public/pages");
    return {
      items: Array.isArray(result.data) ? result.data : [],
      source: "live",
      unavailable: false
    };
  } catch (error) {
    return {
      items: [],
      source: "unavailable",
      unavailable: true,
      message: error.message
    };
  }
}

export async function getPublicConfigurationContent() {
  const fallback = {
    contact: mockContact,
    navigation: mockNavigation,
    footerNavigation: mockNavigation,
    socialLinks: mockSocialLinks,
    homeSections: [],
    inactiveHomeSectionKeys: [],
    cookieBanner: true,
    indexing: true,
    maintenance: false,
    siteName: "Medicare Hospital",
    tagline: "Sağlamlığınız bizim dəyərimizdir",
    seoTitle: "Medicare Hospital — Dəqiq tibbi qayğı",
    seoDescription:
      "Medicare Hospital-da ixtisaslaşmış həkimlər, müasir diaqnostika, laboratoriya və fərdi tibbi xidmətlərlə sağlamlığınız üçün etibarlı qayğı alın.",
    canonical: "https://medicarehospital.az",
    analyticsId: "",
    servicePricesVisible: true
  };

  if (!USE_LIVE_CONTENT) {
    return {
      configuration: fallback,
      source: "mock",
      unavailable: false
    };
  }

  try {
    const { data } = await requestContent("/public/configuration");
    const settings = data?.settings || {};
    const identity = settings["site.identity"] || {};
    const contactSettings = settings.contact || {};
    const seoSettings = settings["seo.default"] || {};
    const integrationSettings = settings["integrations.public"] || {};
    const servicePricingSettings = settings["services.pricing"] || {};
    const rawNavigation = Array.isArray(data?.navigation) ? data.navigation : [];
    const navigation = rawNavigation
      .filter((item) => item.location === "HEADER")
      .map(adaptNavigationItem)
      .filter(Boolean);
    const footerNavigation = rawNavigation
      .filter((item) => item.location === "FOOTER")
      .map(adaptNavigationItem)
      .filter(Boolean);
    const socialLinks = Array.isArray(data?.socialLinks)
      ? data.socialLinks.map(adaptSocialLink).filter(Boolean)
      : [];
    const homeSections = Array.isArray(data?.homeSections)
      ? data.homeSections.map(adaptHomeSection).filter(Boolean)
      : [];
    const inactiveHomeSectionKeys = Array.isArray(data?.inactiveHomeSectionKeys)
      ? data.inactiveHomeSectionKeys.filter((key) => typeof key === "string")
      : [];

    return {
      configuration: {
        ...fallback,
        siteName: identity.siteName || fallback.siteName,
        tagline: identity.tagline || fallback.tagline,
        cookieBanner:
          typeof identity.cookieBanner === "boolean"
            ? identity.cookieBanner
            : fallback.cookieBanner,
        indexing:
          typeof identity.indexing === "boolean"
            ? identity.indexing
            : fallback.indexing,
        maintenance: Boolean(identity.maintenance),
        contact: {
          ...fallback.contact,
          phone: contactSettings.phone || fallback.contact.phone,
          phoneHref: toTelephoneHref(
            contactSettings.phone || fallback.contact.phone
          ),
          phoneSecondary:
            contactSettings.phoneSecondary || fallback.contact.phoneSecondary,
          phoneSecondaryHref: toTelephoneHref(
            contactSettings.phoneSecondary || fallback.contact.phoneSecondary
          ),
          phoneTertiary:
            contactSettings.phoneTertiary || fallback.contact.phoneTertiary,
          phoneTertiaryHref: toTelephoneHref(
            contactSettings.phoneTertiary || fallback.contact.phoneTertiary
          ),
          whatsapp: contactSettings.whatsapp || fallback.contact.whatsapp,
          whatsappHref: `https://wa.me/${String(
            contactSettings.whatsapp || fallback.contact.whatsapp
          ).replace(/\D/g, "")}`,
          mobileSecondary:
            contactSettings.mobileSecondary || fallback.contact.mobileSecondary,
          mobileSecondaryHref: toTelephoneHref(
            contactSettings.mobileSecondary || fallback.contact.mobileSecondary
          ),
          emergency:
            contactSettings.emergencyPhone || fallback.contact.emergency,
          emergencyHref: toTelephoneHref(
            contactSettings.emergencyPhone || fallback.contact.emergency
          ),
          email: contactSettings.email || fallback.contact.email,
          emailHref: `mailto:${contactSettings.email || fallback.contact.email}`,
          address: contactSettings.address || fallback.contact.address,
          hours: contactSettings.workHours || fallback.contact.hours
        },
        navigation,
        footerNavigation,
        socialLinks,
        homeSections,
        inactiveHomeSectionKeys,
        seoTitle: seoSettings.seoTitle || fallback.seoTitle,
        seoDescription:
          seoSettings.seoDescription || fallback.seoDescription,
        canonical: safeAbsoluteUrl(
          seoSettings.canonical,
          fallback.canonical
        ),
        analyticsId: /^G-[A-Z0-9]+$/i.test(integrationSettings.analyticsId || "")
          ? integrationSettings.analyticsId
          : "",
        servicePricesVisible: servicePricingSettings.visible !== false
      },
      source: "live",
      unavailable: false
    };
  } catch (error) {
    return {
      configuration: fallback,
      source: "unavailable",
      unavailable: true,
      message: error.message
    };
  }
}

export function getArticleContent(slug) {
  return getDetail(
    `/public/articles/${encodeURIComponent(slug)}`,
    getMockArticle(slug),
    adaptArticle
  );
}

export async function getSearchContent() {
  const [doctorResult, departmentResult, serviceResult, articleResult] =
    await Promise.all([
      getDoctorsContent(),
      getDepartmentsContent(),
      getServicesContent(),
      getArticlesContent()
    ]);
  const results = [doctorResult, departmentResult, serviceResult, articleResult];
  const degraded = results.some((result) => result.unavailable);

  return {
    collections: {
      doctors: doctorResult.items,
      departments: departmentResult.items,
      services: serviceResult.items,
      articles: articleResult.items
    },
    source: degraded
      ? "unavailable"
      : results.every((result) => result.source === "live")
        ? "live"
        : "mock",
    unavailable: degraded,
    message: degraded
      ? "Axtarışın canlı məzmun xidməti hazırda əlçatmazdır."
      : undefined
  };
}

function adaptDoctor(raw, context = {}) {
  const mockDepartment =
    typeof raw.department === "string"
      ? getMockDepartment(raw.department)
      : null;
  const department =
    typeof raw.department === "string"
      ? {
          slug: raw.department,
          name: raw.departmentName || mockDepartment?.name
        }
      : raw.department || context.department || {};
  const branch =
    typeof raw.branch === "string"
      ? { name: raw.branch, slug: raw.branchSlug }
      : raw.branch || context.branch || {};
  const firstName = raw.firstName || "";
  const lastName = raw.lastName || "";
  const title = raw.title?.trim() || "Dr.";
  const name = raw.name || `${title} ${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
  const relatedDoctors = Array.isArray(raw.relatedDoctors)
    ? raw.relatedDoctors.map((doctor) =>
        adaptDoctor(doctor, { department, branch })
      )
    : [];

  return {
    id: raw.id,
    slug: raw.slug,
    name,
    specialty: raw.specialty || "Tibb mütəxəssisi",
    department: department.slug || raw.departmentSlug || "",
    departmentId: department.id || raw.departmentId,
    departmentName: department.name || "",
    experience: raw.experienceYears ?? raw.experience ?? 0,
    branch: branch.name || raw.branchName || "Medicare Hospital",
    branchId: branch.id || raw.branchId,
    branchSlug: branch.slug,
    image: resolveMedia(raw.profileImage, raw.image || "/images/doctor-placeholder.svg"),
    imageAlt: raw.profileImage?.altText,
    featured: Boolean(raw.featured),
    bio: raw.shortBio || raw.bio || "Medicare-in ixtisaslaşmış həkim komandasının üzvü.",
    about: raw.bio || raw.about || raw.shortBio || "",
    education: Array.isArray(raw.educations)
      ? raw.educations.map(formatEducation)
      : raw.education || [],
    certificates: Array.isArray(raw.certificates)
      ? raw.certificates.map((item) =>
          typeof item === "string" ? item : formatCertificate(item)
        )
      : [],
    career: Array.isArray(raw.experiences)
      ? raw.experiences.map(formatExperience)
      : raw.career || [],
    conditions: raw.conditions || [],
    procedures: raw.procedures || [],
    languages: raw.languages || [],
    schedule: Array.isArray(raw.schedules)
      ? raw.schedules.map(formatSchedule)
      : raw.schedule || [],
    seo: adaptSeo(raw.seo),
    relatedDoctors,
    updatedAt: raw.updatedAt
  };
}

function adaptDepartment(raw) {
  const mockDepartment = getMockDepartment(raw.slug);
  const context = {
    department: { id: raw.id, slug: raw.slug, name: raw.name }
  };
  const rawServices = Array.isArray(raw.services)
    ? raw.services
    : !raw.id
      ? (raw.serviceSlugs || [])
          .map((slug) => getMockService(slug))
          .filter(Boolean)
      : [];
  const services = rawServices.map((service) =>
    adaptService(service, context)
  );
  const rawDoctors = Array.isArray(raw.doctors)
    ? raw.doctors
    : !raw.id
      ? mockDoctors.filter((doctor) => doctor.department === raw.slug)
      : [];
  const doctors = rawDoctors.map((doctor) => adaptDoctor(doctor, context));

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    shortName: raw.shortName || raw.name,
    summary: raw.summary || "",
    description: raw.description || raw.summary || "",
    icon: raw.icon || mockDepartment?.icon || "cross",
    image: resolveMedia(raw.image, "/images/department-placeholder.svg"),
    imageAlt: raw.image?.altText,
    conditions: raw.conditions || [],
    serviceSlugs: services.length
      ? services.map((service) => service.slug)
      : raw.serviceSlugs || [],
    faq: (raw.faqs || raw.faq || []).map(adaptFaq),
    services,
    doctors,
    branches: raw.branches || [],
    counts: raw._count || {},
    featured: Boolean(raw.featured),
    seo: adaptSeo(raw.seo),
    updatedAt: raw.updatedAt
  };
}

function adaptService(raw, context = {}) {
  const mockDepartment =
    typeof raw.department === "string"
      ? getMockDepartment(raw.department)
      : null;
  const department =
    typeof raw.department === "string"
      ? {
          slug: raw.department,
          name: raw.departmentName || mockDepartment?.name
        }
      : raw.department || context.department || {};
  const doctorContext = { department };
  const pricingVisible = raw.pricingVisible !== false;

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    department: department.slug || raw.departmentSlug || "",
    departmentId: department.id || raw.departmentId,
    departmentName: department.name || "",
    summary: raw.summary || "",
    description: raw.description || raw.summary || "",
    icon: raw.icon || "cross",
    duration: raw.duration || "Müddət fərdi planlanır",
    preparation:
      raw.preparation ||
      "Xidmətə uyğun hazırlıq qaydasını əlaqə mərkəzindən dəqiqləşdirə bilərsiniz.",
    includes:
      raw.includes ||
      [
        "İlkin klinik qiymətləndirmə",
        "Fərdi xidmət planı",
        "Mütəxəssis rəyi",
        "Nəticə üzrə tövsiyə"
      ],
    image: resolveMedia(raw.image, "/images/department-placeholder.svg"),
    imageAlt: raw.image?.altText,
    priceFrom: pricingVisible ? raw.priceFrom : null,
    currency: pricingVisible ? raw.currency || "AZN" : "",
    pricingVisible,
    priceItems: (pricingVisible ? raw.priceItems || [] : []).map((item, index) => ({
      id: item.id || raw.slug + "-price-" + index,
      code: item.code || "",
      name: item.name,
      price: item.price,
      currency: item.currency || raw.currency || "AZN",
      note: item.note || "",
    })),
    featured: Boolean(raw.featured),
    doctors: Array.isArray(raw.doctors)
      ? raw.doctors.map((doctor) => adaptDoctor(doctor, doctorContext))
      : [],
    faq: (raw.faqs || raw.faq || []).map(adaptFaq),
    seo: adaptSeo(raw.seo),
    updatedAt: raw.updatedAt
  };
}

function adaptArticle(raw) {
  const category = raw.categories?.[0];
  const publishedAt = raw.publishedAt || raw.date || new Date().toISOString();
  const authorName =
    typeof raw.author === "string"
      ? raw.author
      : raw.author
        ? `${raw.author.firstName || ""} ${raw.author.lastName || ""}`.trim()
        : raw.authorName || "Medicare klinik heyəti";
  const normalizedDate = normalizeDate(publishedAt);

  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt || "",
    category: category?.name || raw.category || "Sağlamlıq",
    categorySlug: category?.slug,
    author: authorName || "Medicare klinik heyəti",
    doctorSlug: raw.doctorSlug,
    date: normalizedDate.toISOString(),
    displayDate: formatDisplayDate(normalizedDate),
    readTime: `${raw.readingMinutes || parseReadTime(raw.readTime) || 1} dəq`,
    image: resolveMedia(
      raw.coverImage,
      raw.image || "/images/article-placeholder.svg"
    ),
    imageAlt: raw.coverImage?.altText,
    featured: Boolean(raw.featured),
    content: adaptArticleBody(raw.body || raw.content),
    relatedArticles: Array.isArray(raw.relatedArticles)
      ? raw.relatedArticles.map(adaptArticle)
      : [],
    seo: adaptSeo(raw.seo),
    updatedAt: raw.updatedAt
  };
}

function adaptBranch(raw) {
  const address = raw.address || "";
  const mapFallback = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${raw.name || "Medicare Hospital"} ${address}`
  )}`;
  return {
    id: raw.id,
    slug: raw.slug || raw.id,
    name: raw.name,
    address,
    city: raw.city || "",
    phone: raw.phone || "",
    hours: raw.hours || formatWorkingHours(raw.workingHours),
    note: raw.note || "",
    mapUrl: safeAbsoluteUrl(
      raw.mapUrl || raw.mapEmbedUrl,
      mapFallback
    )
  };
}

function adaptTestimonial(raw) {
  if (raw.name && raw.detail) return raw;
  return {
    id: raw.id,
    quote: raw.quote || "",
    name: raw.patientName || "Medicare pasiyenti",
    detail: raw.patientTitle || raw.department?.name || "Təsdiqlənmiş pasiyent rəyi",
    rating: Math.min(5, Math.max(1, Number(raw.rating) || 5))
  };
}

function adaptCertificate(raw) {
  if (raw.code) return raw;
  return {
    id: raw.id,
    code: raw.title,
    title: raw.issuer,
    description: raw.description || "",
    image: resolveMedia(raw.media, "")
  };
}

function adaptGalleryItem(raw) {
  if (raw.metric && raw.image) return raw;
  return {
    id: raw.id,
    title: raw.title,
    text: raw.description || "Medicare klinik infrastrukturu",
    metric: raw.category || "Medicare",
    image: resolveMedia(raw.media, "/images/facility-placeholder.svg")
  };
}

function adaptContentPage(raw) {
  const blocks = Array.isArray(raw.body?.blocks) ? raw.body.blocks : [];
  const paragraphs = blocks
    .filter((block) => block?.type === "paragraph" && block.text)
    .map((block) => block.text);

  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt || "",
    body: raw.body || { version: 1, blocks: [] },
    paragraphs,
    template: raw.template || "STANDARD",
    sectionLayoutConfigured: Boolean(raw.sectionLayoutConfigured),
    inactiveSectionKeys: Array.isArray(raw.inactiveSectionKeys)
      ? raw.inactiveSectionKeys
      : [],
    sections: Array.isArray(raw.sections)
      ? raw.sections.map(adaptPageSection).filter(Boolean)
      : [],
    seo: adaptSeo(raw.seo),
    updatedAt: raw.updatedAt
  };
}

function adaptLeadership(raw) {
  const firstName = raw.firstName || "";
  const lastName = raw.lastName || "";
  const name = raw.name || `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();
  return {
    id: raw.id,
    slug: raw.slug,
    name,
    firstName,
    lastName,
    position: raw.position || "",
    bio: raw.bio || "",
    education: Array.isArray(raw.education) ? raw.education.filter(Boolean) : [],
    experience: Array.isArray(raw.experience) ? raw.experience.filter(Boolean) : [],
    image: resolveMedia(raw.image && typeof raw.image === "object" ? raw.image : null, typeof raw.image === "string" ? raw.image : ""),
    imageAlt:
      raw.image?.altText ||
      raw.imageAlt ||
      [name, raw.position].filter(Boolean).join(" — "),
    sortOrder: Number(raw.sortOrder) || 0,
    updatedAt: raw.updatedAt
  };
}

function adaptPageSection(section) {
  if (!section?.key) return null;
  const content =
    section.content &&
    typeof section.content === "object" &&
    !Array.isArray(section.content)
      ? { ...section.content }
      : {};
  if (typeof content.image === "string") {
    content.image = resolveCmsImage(content.image);
  }
  return {
    id: section.id,
    key: section.key,
    type: section.type || "RICH_TEXT",
    label: section.label || section.key,
    eyebrow: section.eyebrow || "",
    title: section.title || "",
    description: section.description || "",
    content,
    active: section.active !== false,
    sortOrder: Number(section.sortOrder) || 0
  };
}

function adaptArticleBody(body) {
  if (Array.isArray(body)) return body;
  const blocks = Array.isArray(body?.blocks) ? body.blocks : [];
  const sections = [];
  let current = {
    heading: "Məqalə haqqında",
    paragraphs: []
  };

  for (const block of blocks) {
    if (block?.type === "heading") {
      if (current.paragraphs.length) sections.push(current);
      current = {
        heading: block.text || "Ətraflı məlumat",
        paragraphs: []
      };
      continue;
    }

    const text =
      block?.text ||
      (Array.isArray(block?.items) ? block.items.join(" ") : "");
    if (text) current.paragraphs.push(text);
  }

  if (current.paragraphs.length) sections.push(current);
  return sections.length
    ? sections
    : [
        {
          heading: "Məqalə haqqında",
          paragraphs: ["Bu tibbi material yenilənmə mərhələsindədir."]
        }
      ];
}

function adaptFaq(item) {
  return {
    id: item.id,
    category: item.category || "Ümumi",
    question: item.question,
    answer: item.answer
  };
}

function adaptSeo(seo) {
  if (!seo || typeof seo !== "object" || Array.isArray(seo)) return null;
  return {
    ...seo,
    ogImage: seo.ogImage
      ? {
          ...seo.ogImage,
          url: resolveMedia(seo.ogImage, "")
        }
      : null
  };
}

function adaptNavigationItem(item) {
  const external = Boolean(item.isExternal);
  const href = external
    ? safeAbsoluteUrl(item.url, "")
    : safeInternalHref(item.url);
  if (!href) return null;

  return {
    id: item.id,
    label: item.label,
    href,
    external
  };
}

function adaptSocialLink(item) {
  const href = safeAbsoluteUrl(item.url, "");
  if (!href) return null;
  return {
    id: item.id,
    label: item.label || item.platform,
    href
  };
}

function adaptHomeSection(item) {
  if (!item?.key) return null;
  const content =
    item.content && typeof item.content === "object" && !Array.isArray(item.content)
      ? item.content
      : {};

  return {
    id: item.id,
    key: item.key,
    title: item.title || "",
    subtitle: item.subtitle || "",
    content: {
      ...content,
      primaryAction: adaptContentAction(content.primaryAction),
      secondaryAction: adaptContentAction(content.secondaryAction)
    }
  };
}

function adaptContentAction(action) {
  if (!action || typeof action !== "object" || Array.isArray(action)) {
    return null;
  }
  const href = safeInternalHref(action.href);
  const label = typeof action.label === "string" ? action.label.trim() : "";
  return href && label ? { href, label } : null;
}

function formatEducation(item) {
  const qualification = [item.degree, item.field].filter(Boolean).join(", ");
  const years = formatYearRange(item.startYear, item.endYear);
  return [item.institution, qualification, years].filter(Boolean).join(" — ");
}

function formatCertificate(item) {
  return [item.title, item.issuer].filter(Boolean).join(" — ");
}

function formatExperience(item) {
  const start = item.startDate ? new Date(item.startDate).getFullYear() : "";
  const end = item.current
    ? "indiyədək"
    : item.endDate
      ? new Date(item.endDate).getFullYear()
      : "";
  const years = formatYearRange(start, end);
  const place = [item.organization, item.position].filter(Boolean).join(", ");
  return [years, place].filter(Boolean).join(" — ");
}

function formatSchedule(item) {
  const dayNames = {
    MONDAY: "Bazar ertəsi",
    TUESDAY: "Çərşənbə axşamı",
    WEDNESDAY: "Çərşənbə",
    THURSDAY: "Cümə axşamı",
    FRIDAY: "Cümə",
    SATURDAY: "Şənbə",
    SUNDAY: "Bazar"
  };
  return `${dayNames[item.dayOfWeek] || item.dayOfWeek || ""} ${item.startTime || ""}–${item.endTime || ""}`.trim();
}

function formatYearRange(start, end) {
  if (!start && !end) return "";
  if (start && end) return `${start}–${end}`;
  return String(start || end);
}

function parseReadTime(value) {
  return Number.parseInt(value, 10) || 0;
}

function normalizeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function formatDisplayDate(value) {
  try {
    return new Intl.DateTimeFormat("az-AZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Baku"
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function formatWorkingHours(value) {
  if (!value || typeof value !== "object") return "";
  return Object.entries(value)
    .map(([day, hours]) => `${day}: ${hours}`)
    .join(", ");
}

function resolveMedia(media, fallback) {
  const value = media?.url || media?.thumbnailUrl;
  if (!value) return fallback;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/(?!\/)/.test(value) && !/^\/uploads\//i.test(value)) return value;
  try {
    return new URL(value, `${API_ORIGIN}/`).toString();
  } catch {
    return fallback;
  }
}

function resolveCmsImage(value) {
  const source = typeof value === "string" ? value.trim() : "";
  if (!source) return "";
  if (/^\/uploads\//i.test(source)) {
    return new URL(source, `${API_ORIGIN}/`).toString();
  }
  if (/^\/(?!\/)/.test(source)) return source;
  return safeAbsoluteUrl(source, "");
}

function getApiOrigin(value) {
  try {
    return new URL(value).origin;
  } catch {
    return "http://localhost:4000";
  }
}

function toTelephoneHref(value) {
  return `tel:${String(value || "").replace(/[^\d+*]/g, "")}`;
}

function safeInternalHref(value) {
  const href = typeof value === "string" ? value.trim() : "";
  return /^\/(?!\/)/.test(href) ? href : "";
}

function safeAbsoluteUrl(value, fallback) {
  const href = typeof value === "string" ? value.trim() : "";
  try {
    const url = new URL(href);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

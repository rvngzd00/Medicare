const statusLabels = {
  ACTIVE: "Aktiv",
  INACTIVE: "Deaktiv",
  LOCKED: "Bloklanıb",
  DRAFT: "Qaralama",
  PUBLISHED: "Dərc olunub",
  SCHEDULED: "Planlaşdırılıb",
  ARCHIVED: "Arxivdə",
  NEW: "Yeni",
  CONFIRMED: "Təsdiqlənib",
  COMPLETED: "Tamamlanıb",
  CANCELLED: "Ləğv edilib",
  IN_PROGRESS: "İcradadır",
  RESOLVED: "Həll olunub",
  SPAM: "Spam",
};

const backendStatuses = Object.fromEntries(
  Object.entries(statusLabels).map(([value, label]) => [label, value]),
);

const resourceStatusValues = {
  doctors: ["Aktiv", "Deaktiv"],
  departments: ["Aktiv", "Deaktiv"],
  services: ["Aktiv", "Deaktiv"],
  articles: ["Dərc olunub", "Planlaşdırılıb", "Qaralama", "Arxivdə"],
  users: ["Aktiv", "Deaktiv", "Bloklanıb"],
};

const entityNames = {
  doctors: "həkim",
  departments: "şöbə",
  services: "xidmət",
  articles: "məqalə",
  users: "istifadəçi",
};

export function toAzStatus(status) {
  return statusLabels[status] || status || "—";
}

export function toBackendStatus(status) {
  return backendStatuses[status] || status;
}

export function getResourceStatusOptions(resource) {
  return resourceStatusValues[resource] || [];
}

export function formatAdminDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("az-AZ", {
    day: "2-digit",
    month: options.longMonth ? "long" : "2-digit",
    year: "numeric",
    ...(options.time ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function formatRelativeAdminDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const difference = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.round(difference / 60000));
  if (minutes < 1) return "İndi";
  if (minutes < 60) return `${minutes} dəq əvvəl`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} saat əvvəl`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} gün əvvəl`;
  return formatAdminDate(value);
}

function initials(...parts) {
  return parts.filter(Boolean).map((part) => String(part).trim()[0]).join("").slice(0, 2).toLocaleUpperCase("az") || "MC";
}

function personName(person, prefix = "") {
  if (!person) return "Təyin edilməyib";
  return `${prefix}${[person.firstName, person.lastName].filter(Boolean).join(" ")}`.trim();
}

function listNames(items) {
  if (!Array.isArray(items) || !items.length) return "Kateqoriyasız";
  return items.map((item) => item.name || item.label).filter(Boolean).join(", ");
}

export function adaptResourceRecord(resource, record) {
  if (!record) return null;
  const rawStatus = record.status || (record.active ? "ACTIVE" : "INACTIVE");
  const common = {
    id: record.id,
    status: toAzStatus(rawStatus),
    updatedAt: formatAdminDate(record.updatedAt),
    featured: Boolean(record.featured),
    _raw: record,
  };

  if (resource === "doctors") {
    return {
      ...common,
      name: personName(record, record.title ? `${record.title} ` : "Dr. "),
      detail: [record.specialty, record.shortBio].filter(Boolean).join(" · "),
      initials: initials(record.firstName, record.lastName),
      department: record.department?.name || "Təyin edilməyib",
      branch: record.branch?.name || "Medicare Hospital — Sabunçu",
      experience: `${record.experienceYears || 0} il`,
    };
  }

  if (resource === "departments") {
    return {
      ...common,
      name: record.name,
      detail: record.summary,
      initials: initials(...String(record.name || "").split(" ")),
      head: "—",
      doctors: `${record._count?.doctors || 0} həkim`,
      order: String((record.sortOrder ?? 0) + 1).padStart(2, "0"),
    };
  }

  if (resource === "services") {
    return {
      ...common,
      name: record.name,
      detail: record.summary,
      initials: initials(...String(record.name || "").split(" ")),
      department: record.department?.name || "Təyin edilməyib",
      price: record.priceFrom ? `${record.priceFrom} ${record.currency || "AZN"}-dən` : "Sorğu ilə",
    };
  }

  if (resource === "articles") {
    return {
      ...common,
      name: record.title,
      detail: `${record.readingMinutes || 1} dəq oxuma · ${record.viewCount || 0} baxış`,
      initials: initials(...String(record.title || "").split(" ")),
      category: listNames(record.categories),
      author: personName(record.author),
      publishDate: formatAdminDate(record.publishedAt || record.scheduledAt || record.createdAt, { time: rawStatus === "SCHEDULED" }),
    };
  }

  if (resource === "users") {
    return {
      ...common,
      name: personName(record),
      detail: record.email,
      initials: initials(record.firstName, record.lastName),
      role: record.role?.name || "Rol təyin edilməyib",
      lastSeen: record.lastLoginAt ? formatRelativeAdminDate(record.lastLoginAt) : "Hələ daxil olmayıb",
      twoFactor: "Tətbiq edilmir",
    };
  }

  return {
    ...common,
    name: record.name || record.title || record.key || record.id,
    detail: record.summary || record.description || "",
    initials: initials(record.name || record.title || record.key),
  };
}

export function adaptResourceList(resource, records) {
  return Array.isArray(records)
    ? records.map((record) => adaptResourceRecord(resource, record)).filter(Boolean)
    : [];
}

export function resourceListQuery(resource, { query = "", status = "Hamısı", page = 1, limit = 20 } = {}) {
  const params = { page, limit };
  if (query.trim()) params.search = query.trim();
  if (status !== "Hamısı") {
    if (["doctors", "departments", "services"].includes(resource)) {
      params.active = status === "Aktiv" ? "true" : "false";
    } else {
      params.status = toBackendStatus(status);
    }
  }
  return params;
}

export function resourceStatusMutation(resource, row, forceActive) {
  const raw = row?._raw || {};
  if (["doctors", "departments", "services"].includes(resource)) {
    const nextActive = typeof forceActive === "boolean" ? forceActive : !raw.active;
    return { payload: { active: nextActive }, label: nextActive ? "Aktiv" : "Deaktiv" };
  }
  if (resource === "articles") {
    const nextStatus = forceActive === true ? "PUBLISHED" : raw.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    return {
      payload: {
        status: nextStatus,
        ...(nextStatus === "PUBLISHED"
          ? {
              ...(raw.status !== "PUBLISHED"
                ? { publishedAt: new Date().toISOString() }
                : {}),
              scheduledAt: null
            }
          : {}),
      },
      label: toAzStatus(nextStatus),
    };
  }
  if (resource === "users") {
    const nextStatus = forceActive === true ? "ACTIVE" : raw.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    return { payload: { status: nextStatus }, label: toAzStatus(nextStatus) };
  }
  return { payload: {}, label: row?.status || "—" };
}

function bodyToText(body) {
  if (typeof body === "string") return body;
  if (!body?.blocks || !Array.isArray(body.blocks)) return "";
  return body.blocks.map((block) => {
    if (block.type === "heading") return `${"#".repeat(block.level || 2)} ${block.text || ""}`;
    return block.text || "";
  }).filter(Boolean).join("\n\n");
}

function textToBody(text) {
  const blocks = String(text || "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean).map((part) => {
    const heading = part.match(/^(#{1,3})\s+(.+)$/s);
    if (heading) return { type: "heading", level: heading[1].length, text: heading[2].trim() };
    return { type: "paragraph", text: part };
  });
  return { version: 1, blocks };
}

function seoValues(record) {
  return {
    seoTitle: record?.seo?.title || "",
    seoDescription: record?.seo?.description || "",
    _seoTitle: record?.seo?.title || "",
    _seoDescription: record?.seo?.description || "",
    _seoPayload: record?.seo ? {
      title: record.seo.title,
      description: record.seo.description,
      canonicalUrl: record.seo.canonicalUrl,
      keywords: record.seo.keywords,
      robots: record.seo.robots,
      ogTitle: record.seo.ogTitle,
      ogDescription: record.seo.ogDescription,
      ogImageId: record.seo.ogImageId,
      twitterCard: record.seo.twitterCard,
      structuredData: record.seo.structuredData,
    } : null,
  };
}

export function backendRecordToEditorValues(resource, record) {
  if (!record) return {};

  if (resource === "doctors") {
    const educationText = (record.educations || []).map((item) => [item.institution, item.degree].filter(Boolean).join(" — ")).join("\n");
    const certificateText = (record.certificates || []).map((item) => item.title).join("\n");
    return {
      ...record,
      firstName: record.firstName || "",
      lastName: record.lastName || "",
      specialty: record.specialty || "",
      department: record.departmentId || "",
      branch: record.branchId || "",
      experience: String(record.experienceYears ?? ""),
      bio: record.bio || "",
      photo: record.profileImage?.originalName || "",
      education: educationText,
      certificates: certificateText,
      _educationText: educationText,
      _certificateText: certificateText,
      languages: record.languages || [],
      conditions: record.conditions || [],
      procedures: (record.procedures || []).join("\n"),
      email: record.email || "",
      phone: record.phone || "",
      schedule: [],
      hours: "",
      slug: record.slug || "",
      featured: Boolean(record.featured),
      active: Boolean(record.active),
      ...seoValues(record),
    };
  }

  if (resource === "departments") {
    return {
      ...record,
      name: record.name || "",
      order: String(record.sortOrder ?? 0),
      summary: record.summary || "",
      description: record.description || "",
      image: record.image?.originalName || "",
      doctors: [],
      services: [],
      technologies: record.technologies || [],
      conditions: record.conditions || [],
      faq: "",
      slug: record.slug || "",
      active: Boolean(record.active),
      ...seoValues(record),
    };
  }

  if (resource === "services") {
    return {
      ...record,
      name: record.name || "",
      department: record.departmentId || "",
      icon: record.icon || "",
      summary: record.summary || "",
      description: record.description || "",
      image: record.image?.originalName || "",
      price: record.priceFrom ? String(record.priceFrom) : "",
      currency: record.currency || "AZN",
      slug: record.slug || "",
      featured: Boolean(record.featured),
      active: Boolean(record.active),
      ...seoValues(record),
    };
  }

  if (resource === "articles") {
    const bodyText = bodyToText(record.body);
    const categoryIds = (record.categories || []).map((category) => category.id);
    return {
      ...record,
      title: record.title || "",
      lead: record.excerpt || "",
      content: bodyText,
      _bodyText: bodyText,
      _body: record.body,
      cover: record.coverImage?.originalName || "",
      coverAlt: record.coverImage?.altText || "",
      category: record.categories?.[0]?.id || "",
      _categoryIds: categoryIds,
      author: record.authorId || "",
      tags: [],
      related: [],
      featured: Boolean(record.featured),
      status: toAzStatus(record.status),
      _initialStatus: record.status,
      _publishedAt: record.publishedAt,
      publishDate: record.scheduledAt ? new Date(record.scheduledAt).toISOString().slice(0, 16) : "",
      slug: record.slug || "",
      ...seoValues(record),
    };
  }

  if (resource === "users") {
    return {
      ...record,
      firstName: record.firstName || "",
      lastName: record.lastName || "",
      email: record.email || "",
      phone: "",
      jobTitle: "",
      password: "",
      role: record.roleId || record.role?.id || "",
      language: "Azərbaycan dili",
      active: record.status === "ACTIVE",
      _initialActive: record.status === "ACTIVE",
    };
  }

  return record;
}

function cleanText(value) {
  const text = String(value || "").trim();
  return text || undefined;
}

function seoPayload(values) {
  const title = cleanText(values.seoTitle);
  const description = cleanText(values.seoDescription);
  const unchanged = title === cleanText(values._seoTitle) && description === cleanText(values._seoDescription);
  if (unchanged) return undefined;
  if (!title && !description && values._seoPayload) return null;
  return title && description
    ? removeUndefined({ ...(values._seoPayload || {}), title, description })
    : undefined;
}

function integer(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBakuIsoDateTime(value) {
  const dateTime = cleanText(value);
  if (!dateTime) return undefined;
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTime)
    ? `${dateTime}:00+04:00`
    : dateTime;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function lineArray(value) {
  return String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
}

export function editorValuesToBackend(resource, values, { mode = "new", intent = "publish" } = {}) {
  if (resource === "doctors") {
    const payload = {
      slug: cleanText(values.slug),
      firstName: cleanText(values.firstName),
      lastName: cleanText(values.lastName),
      specialty: cleanText(values.specialty),
      shortBio: cleanText(values.bio)?.slice(0, 280),
      bio: cleanText(values.bio),
      experienceYears: integer(values.experience),
      phone: cleanText(values.phone),
      email: cleanText(values.email),
      languages: Array.isArray(values.languages) ? values.languages : [],
      conditions: Array.isArray(values.conditions) ? values.conditions : [],
      procedures: lineArray(values.procedures),
      departmentId: cleanText(values.department),
      branchId: cleanText(values.branch) || null,
      featured: Boolean(values.featured),
      active: intent === "draft" ? false : Boolean(values.active),
      seo: seoPayload(values),
    };
    const educations = lineArray(values.education);
    const certificates = lineArray(values.certificates);
    if (values.education !== values._educationText) payload.educations = educations.map((item, index) => {
      const [institution, degree] = item.split("—").map((part) => part.trim());
      return { institution, degree: degree || "Tibbi təhsil", sortOrder: index };
    });
    if (values.certificates !== values._certificateText) payload.certificates = certificates.map((title, index) => ({ title, sortOrder: index }));
    return removeUndefined(payload);
  }

  if (resource === "departments") {
    return removeUndefined({
      slug: cleanText(values.slug),
      name: cleanText(values.name),
      summary: cleanText(values.summary),
      description: cleanText(values.description),
      conditions: Array.isArray(values.conditions) ? values.conditions : [],
      technologies: Array.isArray(values.technologies) ? values.technologies : [],
      sortOrder: integer(values.order),
      active: intent === "draft" ? false : Boolean(values.active),
      seo: seoPayload(values),
    });
  }

  if (resource === "services") {
    return removeUndefined({
      slug: cleanText(values.slug),
      name: cleanText(values.name),
      summary: cleanText(values.summary),
      description: cleanText(values.description),
      priceFrom: cleanText(values.price),
      currency: cleanText(values.currency) || "AZN",
      icon: cleanText(values.icon),
      departmentId: cleanText(values.department),
      featured: Boolean(values.featured),
      active: intent === "draft" ? false : Boolean(values.active),
      seo: seoPayload(values),
    });
  }

  if (resource === "articles") {
    const selectedStatus = intent === "draft" ? "DRAFT" : toBackendStatus(values.status || "Dərc olunub");
    const originalCategoryIds = Array.isArray(values._categoryIds) ? values._categoryIds : [];
    const categoryIds = values.category
      ? [values.category, ...originalCategoryIds.filter((id) => id !== values.category && id !== originalCategoryIds[0])]
      : [];
    return removeUndefined({
      slug: cleanText(values.slug),
      title: cleanText(values.title),
      excerpt: cleanText(values.lead),
      body: values._body && values.content === values._bodyText ? values._body : textToBody(values.content),
      status: selectedStatus,
      featured: Boolean(values.featured),
      readingMinutes: Math.max(1, Math.ceil(String(values.content || "").trim().split(/\s+/).filter(Boolean).length / 190)),
      scheduledAt:
        selectedStatus === "SCHEDULED"
          ? toBakuIsoDateTime(values.publishDate)
          : null,
      publishedAt:
        selectedStatus === "PUBLISHED" &&
        (mode === "new" || values._initialStatus !== "PUBLISHED")
          ? new Date().toISOString()
          : undefined,
      authorId: cleanText(values.author) || null,
      categoryIds,
      seo: seoPayload(values),
    });
  }

  if (resource === "users") {
    return removeUndefined({
      email: cleanText(values.email),
      password: cleanText(values.password),
      firstName: cleanText(values.firstName),
      lastName: cleanText(values.lastName),
      roleId: cleanText(values.role),
      status: intent === "draft"
        ? "INACTIVE"
        : mode === "edit" && Boolean(values.active) === Boolean(values._initialActive)
          ? undefined
          : values.active ? "ACTIVE" : "INACTIVE",
      ...(mode === "edit" && !cleanText(values.password) ? { password: undefined } : {}),
    });
  }

  return removeUndefined(values);
}

function removeUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

export function mediaFieldForResource(resource) {
  return {
    doctors: { formField: "photo", payloadField: "profileImageId", altField: "firstName" },
    departments: { formField: "image", payloadField: "imageId", altField: "name" },
    services: { formField: "image", payloadField: "imageId", altField: "name" },
    articles: { formField: "cover", payloadField: "coverImageId", altField: "coverAlt" },
  }[resource] || null;
}

export function adaptMessage(record) {
  const status = record?.status || "NEW";
  return {
    id: record?.id,
    sender: personName(record),
    email: record?.email || "—",
    phone: record?.phone || "—",
    subject: record?.subject || "Mövzusuz mesaj",
    preview: record?.message || "",
    body: record?.message || "",
    time: record?.createdAt ? new Intl.DateTimeFormat("az-AZ", { hour: "2-digit", minute: "2-digit" }).format(new Date(record.createdAt)) : "—",
    date: formatAdminDate(record?.createdAt, { longMonth: true }),
    unread: status === "NEW",
    status,
    statusLabel: toAzStatus(status),
    adminNotes: record?.adminNotes || "",
    priority: status === "NEW" ? "Normal" : toAzStatus(status),
    category: "Əlaqə",
    _raw: record,
  };
}

export function adaptActivity(record) {
  const actor = record?.user ? personName(record.user) : "Sistem";
  const actionLabels = {
    CREATE: "yeni qeyd yaratdı",
    UPDATE: "məlumatı yenilədi",
    DELETE: "qeydi sildi",
    RESTORE: "qeydi bərpa etdi",
    LOGIN: "sistemə daxil oldu",
    LOGOUT: "sessiyanı bitirdi",
  };
  return {
    actor,
    action: `${record?.entityType || "sistem"} üzrə ${actionLabels[record?.action] || String(record?.action || "əməliyyat etdi").toLocaleLowerCase("az")}`,
    time: formatRelativeAdminDate(record?.createdAt),
    type: record?.action === "CREATE" ? "publish" : record?.action === "DELETE" ? "system" : "edit",
  };
}

export function adaptLookupOptions(records, labelBuilder) {
  return (Array.isArray(records) ? records : []).map((record) => ({
    value: record.id,
    label: labelBuilder ? labelBuilder(record) : record.name || personName(record) || record.id,
  }));
}

export function normalizeAdminError(error, fallback = "Məlumatı emal etmək mümkün olmadı.") {
  if (error?.name === "AbortError") return "";
  if (error?.code === "SESSION_EXPIRED") return "Sessiyanın müddəti bitib. Giriş səhifəsinə yönləndirilirsiniz.";
  const fieldList = Array.isArray(error?.details?.fields) ? ` (${error.details.fields.join(", ")})` : "";
  return `${error?.message || fallback}${fieldList}`;
}

export function entitySuccessMessage(resource, action) {
  const entity = entityNames[resource] || "qeyd";
  return action === "create"
    ? `${entity[0].toLocaleUpperCase("az")}${entity.slice(1)} uğurla yaradıldı.`
    : action === "delete"
      ? `${entity[0].toLocaleUpperCase("az")}${entity.slice(1)} silindi.`
      : `${entity[0].toLocaleUpperCase("az")}${entity.slice(1)} yeniləndi.`;
}

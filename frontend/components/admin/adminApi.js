function normalizeApiBase(value) {
  const normalized = String(value || "").trim().replace(/\/+$/, "");
  if (!normalized) return "/api/v1";
  return /\/api\/v1$/i.test(normalized) ? normalized : `${normalized}/api/v1`;
}

export const ADMIN_API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
export const ADMIN_DEMO_MODE = process.env.NEXT_PUBLIC_ADMIN_DEMO_MODE
  ? process.env.NEXT_PUBLIC_ADMIN_DEMO_MODE === "true"
  : process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

let inMemoryAccessToken = null;
let refreshPromise = null;
let latestResponseContext = { meta: null, message: null };
const responseContexts = new WeakMap();

export class AdminApiError extends Error {
  constructor(message, { status = 500, code = "ADMIN_API_ERROR", details = null } = {}) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class SessionExpiredError extends AdminApiError {
  constructor(message = "Sessiyanın müddəti bitib. Yenidən daxil olun.") {
    super(message, { status: 401, code: "SESSION_EXPIRED" });
    this.name = "SessionExpiredError";
  }
}

function emitSessionExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("medicare:session-expired"));
  }
}

async function readPayload(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return { message: await response.text() };
}

function responseError(payload, fallback) {
  return {
    message: payload?.error?.message || payload?.message || fallback,
    code: payload?.error?.code || payload?.code || "ADMIN_API_ERROR",
    details: payload?.error?.details || payload?.details || payload?.errors || null,
  };
}

function unwrapPayload(payload) {
  if (!payload || payload.success !== true || !Object.hasOwn(payload, "data")) {
    latestResponseContext = { meta: null, message: payload?.message || null };
    return payload;
  }

  const context = {
    meta: payload.meta || null,
    message: payload.message || null,
  };
  latestResponseContext = context;

  const data = payload.data;
  if (data && (typeof data === "object" || typeof data === "function")) {
    responseContexts.set(data, context);
  }
  return data;
}

async function refreshAccessToken(signal) {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch(`${ADMIN_API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  })
    .then(async (response) => {
      const envelope = await readPayload(response);
      const session = response.ok ? unwrapPayload(envelope) : null;
      if (!response.ok || !session?.accessToken) {
        const error = responseError(envelope, "Sessiyanın müddəti bitib.");
        throw new SessionExpiredError(error.message);
      }
      inMemoryAccessToken = session.accessToken;
      return session.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    headers,
    auth = true,
    retryAfterRefresh = true,
    signal,
  } = options;

  const requestHeaders = {
    Accept: "application/json",
    ...(!(body instanceof FormData) && body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(auth && inMemoryAccessToken ? { Authorization: `Bearer ${inMemoryAccessToken}` } : {}),
    ...headers,
  };

  let response;
  try {
    response = await fetch(`${ADMIN_API_BASE}${path}`, {
      method,
      credentials: "include",
      headers: requestHeaders,
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new AdminApiError("Serverlə əlaqə yaratmaq mümkün olmadı.", {
      status: 0,
      code: "NETWORK_ERROR",
      details: error.message,
    });
  }

  if (response.status === 401 && auth && retryAfterRefresh) {
    try {
      const accessToken = await refreshAccessToken(signal);
      return request(path, {
        ...options,
        retryAfterRefresh: false,
        headers: { ...headers, Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      inMemoryAccessToken = null;
      emitSessionExpired();
      throw new SessionExpiredError();
    }
  }

  const payload = await readPayload(response);
  if (!response.ok) {
    const error = responseError(payload, "Sorğunu icra etmək mümkün olmadı.");
    throw new AdminApiError(error.message, {
      status: response.status,
      code: error.code,
      details: error.details,
    });
  }

  return unwrapPayload(payload);
}

function demoDelay(value, delay = 320) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), delay);
  });
}

export const authService = {
  async login({ email, password, remember = false }) {
    if (ADMIN_DEMO_MODE) {
      return demoDelay({
        accessToken: null,
        user: {
          id: "demo-session-user",
          email,
          displayName: email.split("@")[0].replaceAll(".", " "),
          role: "Super Admin",
        },
        remember,
      }, 720);
    }

    const payload = await request("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    inMemoryAccessToken = payload.accessToken;
    return payload;
  },

  async getSession(options = {}) {
    if (ADMIN_DEMO_MODE) return demoDelay({ authenticated: true, mode: "demo" }, 120);
    if (!inMemoryAccessToken) await refreshAccessToken(options.signal);
    return request("/auth/me", options);
  },

  async logout() {
    if (ADMIN_DEMO_MODE) {
      inMemoryAccessToken = null;
      return demoDelay({ success: true }, 180);
    }
    try {
      return await request("/auth/logout", { method: "POST", retryAfterRefresh: false });
    } finally {
      inMemoryAccessToken = null;
    }
  },
};

export const adminApi = {
  dashboard: {
    getSummary: (params = {}, options = {}) => request(`/admin/dashboard?${new URLSearchParams(params)}`, options),
    getActivity: (params = {}, options = {}) => request(`/admin/activity-logs?${new URLSearchParams(params)}`, options),
  },

  resources: {
    list: (resource, params = {}, options = {}) => request(`/admin/${resource}?${new URLSearchParams(params)}`, options),
    get: (resource, id, options = {}) => request(`/admin/${resource}/${encodeURIComponent(id)}`, options),
    create: (resource, data, options = {}) => request(`/admin/${resource}`, { ...options, method: "POST", body: data }),
    update: (resource, id, data, options = {}) => request(`/admin/${resource}/${encodeURIComponent(id)}`, { ...options, method: "PATCH", body: data }),
    remove: (resource, id, options = {}) => request(`/admin/${resource}/${encodeURIComponent(id)}`, { ...options, method: "DELETE" }),
    restore: (resource, id, options = {}) => request(`/admin/${resource}/${encodeURIComponent(id)}/restore`, { ...options, method: "POST", body: {} }),
  },

  appointments: {
    list: (params = {}, options = {}) => request(`/admin/appointments?${new URLSearchParams(params)}`, options),
    update: (id, data, options = {}) => request(`/admin/appointments/${encodeURIComponent(id)}`, { ...options, method: "PATCH", body: data }),
  },

  messages: {
    list: (params = {}, options = {}) => request(`/admin/contacts?${new URLSearchParams(params)}`, options),
    update: (id, data, options = {}) => request(`/admin/contacts/${encodeURIComponent(id)}`, { ...options, method: "PATCH", body: data }),
  },

  users: {
    list: (params = {}, options = {}) => request(`/admin/users?${new URLSearchParams(params)}`, options),
    get: (id, options = {}) => request(`/admin/users/${encodeURIComponent(id)}`, options),
    create: (data, options = {}) => request("/admin/users", { ...options, method: "POST", body: data }),
    update: (id, data, options = {}) => request(`/admin/users/${encodeURIComponent(id)}`, { ...options, method: "PATCH", body: data }),
    remove: (id, options = {}) => request(`/admin/users/${encodeURIComponent(id)}`, { ...options, method: "DELETE" }),
  },

  media: {
    upload: (file, metadata = {}, options = {}) => {
      const form = new FormData();
      form.append("image", file);
      Object.entries(metadata).forEach(([key, value]) => form.append(key, value));
      return request("/admin/media", { ...options, method: "POST", body: form });
    },
    replace: (id, file, metadata = {}, options = {}) => {
      const form = new FormData();
      form.append("image", file);
      Object.entries(metadata).forEach(([key, value]) => form.append(key, value));
      return request(`/admin/media/${encodeURIComponent(id)}`, { ...options, method: "PUT", body: form });
    },
    remove: (id, options = {}) => request(`/admin/media/${encodeURIComponent(id)}`, { ...options, method: "DELETE" }),
  },

  settings: {
    list: (params = {}, options = {}) => request(`/admin/settings?${new URLSearchParams(params)}`, options),
    create: (data, options = {}) => request("/admin/settings", { ...options, method: "POST", body: data }),
    update: (id, data, options = {}) => request(`/admin/settings/${encodeURIComponent(id)}`, { ...options, method: "PATCH", body: data }),
  },

  cms: {
    listPages: (options = {}) => request("/admin/cms/pages", options),
    getPage: (id, options = {}) =>
      request(`/admin/cms/pages/${encodeURIComponent(id)}`, options),
    createPage: (data, options = {}) =>
      request("/admin/cms/pages", {
        ...options,
        method: "POST",
        body: data,
      }),
    savePage: (id, data, options = {}) =>
      request(`/admin/cms/pages/${encodeURIComponent(id)}`, {
        ...options,
        method: "PUT",
        body: data,
      }),
    listRevisions: (id, options = {}) =>
      request(
        `/admin/cms/pages/${encodeURIComponent(id)}/revisions`,
        options,
      ),
    restoreRevision: (id, revisionId, options = {}) =>
      request(
        `/admin/cms/pages/${encodeURIComponent(id)}/revisions/${encodeURIComponent(revisionId)}/restore`,
        { ...options, method: "POST", body: {} },
      ),
  },

  roles: {
    list: (options = {}) => request("/admin/roles", options),
    listPermissions: (options = {}) => request("/admin/permissions", options),
    create: (data, options = {}) => request("/admin/roles", { ...options, method: "POST", body: data }),
    update: (id, data, options = {}) => request(`/admin/roles/${encodeURIComponent(id)}`, { ...options, method: "PATCH", body: data }),
  },
};

export function getAdminResponseContext(data) {
  if (data && (typeof data === "object" || typeof data === "function")) {
    return responseContexts.get(data) || latestResponseContext;
  }
  return latestResponseContext;
}

export function clearAdminAccessToken() {
  inMemoryAccessToken = null;
}

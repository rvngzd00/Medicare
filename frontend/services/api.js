const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    const error = new Error(
      payload?.error?.message || "Sorğunu tamamlamaq mümkün olmadı."
    );
    error.status = response.status;
    error.code = payload?.error?.code;
    throw error;
  }

  return response.json();
}

export const publicApi = {
  doctors: () => request("/public/doctors", { next: { revalidate: 300 } }),
  departments: () => request("/public/departments", { next: { revalidate: 300 } }),
  services: () => request("/public/services", { next: { revalidate: 300 } }),
  articles: () => request("/public/articles", { next: { revalidate: 300 } }),
  sendContactMessage: (payload) => {
    const normalized = normalizeContactPayload(payload);
    return USE_MOCK_API
      ? mockSubmission(normalized)
      : request("/public/contact", {
          method: "POST",
          body: JSON.stringify(normalized)
        });
  }
};

function normalizeContactPayload(payload) {
  return {
    firstName: payload.firstName?.trim(),
    lastName: payload.lastName?.trim(),
    email: payload.email?.trim(),
    phone: payload.phone?.trim(),
    subject: payload.subject,
    message: payload.message?.trim(),
    privacyConsent: Boolean(payload.consent),
    website: payload.website || undefined
  };
}

function mockSubmission(payload) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve({ success: true, data: payload, mock: true }), 650);
  });
}

export { API_URL, USE_MOCK_API };

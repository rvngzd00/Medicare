export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://medicarehospital.az").replace(
    /\/+$/,
    ""
  );

export const SITE_NAME = "Medicare Hospital";

export const CONTACT = {
  phone: "+994 12 450 32 91",
  phoneHref: "tel:+994124503291",
  phoneSecondary: "+994 12 450 07 17",
  phoneSecondaryHref: "tel:+994124500717",
  phoneTertiary: "+994 12 450 53 58",
  phoneTertiaryHref: "tel:+994124505358",
  whatsapp: "+994 55 215 97 44",
  whatsappHref: "https://wa.me/994552159744",
  mobileSecondary: "+994 55 511 69 89",
  mobileSecondaryHref: "tel:+994555116989",
  emergency: "103",
  emergencyHref: "tel:103",
  email: "official@medicarehospital.az",
  emailHref: "mailto:official@medicarehospital.az",
  address: "Sabunçu qəsəbəsi, Əslidar Məmmədəliyev küçəsi 5, Bakı",
  hours: "Hər gün, 24 saat"
};

export const ROUTES = {
  home: "/",
  about: "/about",
  departments: "/departments",
  doctors: "/doctors",
  services: "/services",
  news: "/news",
  appointment: "/appointment",
  contact: "/contact",
  faq: "/faq",
  search: "/search"
};

export const MAIN_NAV = [
  { label: "Ana səhifə", href: ROUTES.home },
  { label: "Haqqımızda", href: ROUTES.about },
  { label: "Şöbələr", href: ROUTES.departments },
  { label: "Həkimlər", href: ROUTES.doctors },
  { label: "Xidmətlər", href: ROUTES.services },
  { label: "Xəbərlər", href: ROUTES.news },
  { label: "Əlaqə", href: ROUTES.contact }
];

export const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/medicarehospital_/"
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/994552159744"
  }
];

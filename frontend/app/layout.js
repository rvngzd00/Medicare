import localFont from "next/font/local";
import { SITE_NAME, SITE_URL } from "@/constants/site";
import {
  DEFAULT_ROBOTS,
  DEFAULT_SEO_DESCRIPTION
} from "@/utils/seo";
import "./globals.css";

const plusJakartaSans = localFont({
  src: [
    {
      path: "./fonts/PlusJakartaSans-Variable.woff2",
      style: "normal",
      weight: "200 800"
    },
    {
      path: "./fonts/PlusJakartaSans-VariableItalic.woff2",
      style: "italic",
      weight: "200 800"
    }
  ],
  variable: "--font-plus-jakarta",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Arial", "sans-serif"]
});

const verification = {
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : {}),
  ...(process.env.YANDEX_SITE_VERIFICATION
    ? { yandex: process.env.YANDEX_SITE_VERIFICATION }
    : {})
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: `${SITE_NAME} — Dəqiq tibbi qayğı`,
    template: `%s | ${SITE_NAME}`
  },
  description: DEFAULT_SEO_DESCRIPTION,
  keywords: [
    "Medicare Hospital",
    "özəl xəstəxana Bakı",
    "həkim qəbulu",
    "tibbi xidmətlər",
    "diaqnostika",
    "Sabunçu xəstəxana"
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  referrer: "origin-when-cross-origin",
  robots: DEFAULT_ROBOTS,
  formatDetection: {
    telephone: false,
    email: false,
    address: false
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/images/medicare-logo.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/images/medicare-logo.png", sizes: "512x512" }]
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: `${SITE_NAME} — Dəqiq tibbi qayğı`,
    description: DEFAULT_SEO_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "az_AZ",
    type: "website",
    images: [
      {
        url: "/images/medicare-og-cover.jpg",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Dəqiq tibbi qayğı`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Dəqiq tibbi qayğı`,
    description: DEFAULT_SEO_DESCRIPTION,
    images: ["/images/medicare-og-cover.jpg"]
  },
  ...(Object.keys(verification).length ? { verification } : {}),
  category: "healthcare"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff"
};

export default function RootLayout({ children }) {
  return (
    <html lang="az" className={plusJakartaSans.variable}>
      <body>{children}</body>
    </html>
  );
}

import localFont from "next/font/local";
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

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://medicarehospital.az"),
  applicationName: "Medicare Hospital",
  title: "Medicare Hospital — Dəqiq tibbi qayğı",
  description:
    "Müasir diaqnostika, ixtisaslaşmış həkimlər və pasiyent yönümlü tibbi xidmət.",
  icons: {
    icon: "/images/medicare-logo.png",
    apple: "/images/medicare-logo.png"
  },
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

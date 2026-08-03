import { DEFAULT_SEO_DESCRIPTION } from "@/utils/seo";

export default function manifest() {
  return {
    name: "Medicare Hospital",
    short_name: "Medicare",
    description: DEFAULT_SEO_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b5cab",
    lang: "az",
    scope: "/",
    icons: [
      {
        src: "/images/medicare-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };
}

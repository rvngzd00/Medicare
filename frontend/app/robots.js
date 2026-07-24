import { SITE_URL } from "@/constants/site";
import { getPublicConfigurationContent } from "@/services/content";

export default async function robots() {
  const { configuration } = await getPublicConfigurationContent();
  return {
    rules: [
      configuration.indexing
        ? { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] }
        : { userAgent: "*", disallow: "/" }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}

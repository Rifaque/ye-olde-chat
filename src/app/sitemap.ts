import type { MetadataRoute } from "next";
import { phrases } from "@/lib/phrases";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${siteUrl}/` }, ...phrases.map(({ id }) => ({ url: `${siteUrl}/p/${id}` }))];
}

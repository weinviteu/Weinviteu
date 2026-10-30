import type { MetadataRoute } from "next";
import { withBundledTemplates } from "@/lib/bundled-templates";
import { absoluteUrl } from "@/lib/seo";
import { templatePath } from "@/lib/template-url";
import { supabase } from "@/lib/supabase";
import { templateIsVisible } from "@/lib/template-visibility";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/templates"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];
  const [categories, templates] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true),
    supabase.from("templates").select("*").neq("enabled", false),
  ]);
  // A catalogue read failure still serves the static pages rather than an error.
  if (categories.error || templates.error) return pages;
  const visible = withBundledTemplates(templates.data || [], categories.data || []).filter(t => templateIsVisible(t, categories.data || []));
  return [
    ...pages,
    ...visible.map(t => ({
      url: absoluteUrl(templatePath(t)),
      lastModified: t.created_at ? new Date(t.created_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}

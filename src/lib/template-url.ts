import { slugify } from './slug';

/**
 * Resolve a template filename (which may be a full Supabase URL) to a local
 * preview URL that the browser can load.
 */
export function getTemplateUrl(filename: string) {
  if (filename.startsWith('http')) {
    // Extract just the filename from the full Supabase URL and proxy through our API
    const parts = filename.split('/');
    const file = parts[parts.length - 1];
    return `/api/serve-template/${encodeURIComponent(file)}`;
  }
  return `/templates/${encodeURIComponent(filename)}`;
}

type TemplateLink = { slug?: string | null; id?: number | string | null; title: string };

/** The public page for a template. */
export function templatePath(template: TemplateLink) {
  return `/templates/${template.slug || template.id || slugify(template.title)}`;
}

/** The full-screen invitation, without exposing its storage filename. */
export function templatePreviewPath(template: TemplateLink) {
  return `${templatePath(template)}/preview`;
}

/** Catalogue filtered to one occasion: "Baby Shower" -> /templates?category=baby-shower */
export function categoryPath(category: string) {
  return `/templates?category=${slugify(category)}`;
}

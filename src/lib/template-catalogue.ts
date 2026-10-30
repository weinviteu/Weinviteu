import { bundledTemplates, withBundledTemplates } from "./bundled-templates";
import type { Template } from "./models";
import { slugify } from "./slug";
import { supabase } from "./supabase";
import { templateIsVisible } from "./template-visibility";

/** Every template the public may see. */
export async function loadVisibleTemplates(): Promise<Template[]> {
  const [categories, templates] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true),
    supabase.from("templates").select("*").neq("enabled", false),
  ]);
  if (categories.error) throw categories.error;
  if (templates.error) throw templates.error;
  return withBundledTemplates(templates.data || [], categories.data || []).filter(t => templateIsVisible(t, categories.data || []));
}

/** Finds a template by its slug, or by the older id, filename and title links so those still resolve. */
export function findTemplate(templates: Template[], key: string): Template | null {
  const clean = key.toLowerCase().trim();
  return templates.find(t => t.slug === clean)
    ?? templates.find(t => String(t.id) === clean || t.filename.toLowerCase() === clean || slugify(t.title) === clean)
    // Built-in designs had negative ids before they moved into the database.
    ?? templates.find(t => t.filename === bundledTemplates.find(item => String(item.id) === clean)?.filename)
    ?? null;
}

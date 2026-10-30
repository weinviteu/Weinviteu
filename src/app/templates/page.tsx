import { withBundledTemplates } from "@/lib/bundled-templates";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { templateIsVisible } from "@/lib/template-visibility";
import TemplatesCatalogue from "./TemplatesCatalogue";
import { absoluteUrl, jsonLdHtml } from "@/lib/seo";
import { templatePath } from "@/lib/template-url";

export const revalidate = 0;

export default async function TemplatesPage() {
  const [categories, templates] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("templates").select("*").neq("enabled", false),
  ]);
  const error = categories.error || templates.error;
  const activeCategories = error ? [] : categories.data || [];
  const visibleTemplates = error ? [] : withBundledTemplates(templates.data || [], activeCategories).filter(template => templateIsVisible(template, activeCategories));
  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "3D Digital Invitation Templates",
    url: absoluteUrl("/templates"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: visibleTemplates.length,
      itemListElement: visibleTemplates.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.title, url: absoluteUrl(templatePath(t)) })),
    },
  };
  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(listJsonLd)} />
    <Suspense fallback={<p role="status">Loading collection…</p>}>
      <TemplatesCatalogue templates={visibleTemplates} activeCategories={activeCategories}
        error={error ? "Could not load templates. Please refresh to try again." : ""} />
    </Suspense>
    </>
  );
}

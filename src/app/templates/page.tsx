import { withBundledTemplates } from "@/lib/bundled-templates";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { templateIsVisible } from "@/lib/template-visibility";
import TemplatesCatalogue from "./TemplatesCatalogue";
import PageBanner from "@/components/PageBanner";
import TemplatesCatalogueSkeleton from "./TemplatesCatalogueSkeleton";
import { absoluteUrl, jsonLdHtml } from "@/lib/seo";
import { templatePath } from "@/lib/template-url";
import styles from "./templates.module.css";

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
    <main className={styles.templatesPage}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(listJsonLd)} />
      <PageBanner
        crumb="Templates"
        eyebrow="THE INVITATION COLLECTION"
        title="Find the one that"
        accent="feels like you."
        description="Romantic, playful, or rooted in tradition. Explore the collection and open a live preview to find your celebration’s perfect beginning."
        posters={[
          "/template-posters/wedding-golden-vows.webp",
          "/template-posters/birthday-golden-wish.webp",
          "/template-posters/baby-naming-little-star.webp",
          "/template-posters/traditional-sacred-beginnings.webp",
          "/template-posters/anniversary-still-us.webp",
        ]}
      />
      <Suspense fallback={<TemplatesCatalogueSkeleton />}>
        <TemplatesCatalogue
          templates={visibleTemplates}
          activeCategories={activeCategories}
          error={error ? "Could not load templates. Please refresh to try again." : ""}
        />
      </Suspense>
    </main>
  );
}

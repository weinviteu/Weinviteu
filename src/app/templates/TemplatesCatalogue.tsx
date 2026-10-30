"use client";
import PageBanner from "@/components/PageBanner";
import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import TemplateCard from "@/components/TemplateCard";
import type { Template, Category } from "@/lib/models";
import { getTemplatePricing, DEFAULT_TEMPLATE_PRICE } from "@/lib/template-pricing";
import { getTemplateTier, TEMPLATE_TIERS, TIER_DETAILS, type TemplateTier } from "@/lib/template-tiers";
import { slugify } from "@/lib/slug";
import styles from "./templates.module.css";

export default function TemplatesCatalogue({ templates, activeCategories, error = "" }: { templates: Template[]; activeCategories: Category[]; error?: string }) {
  const params = useSearchParams();
  // Links use readable slugs (baby-shower); older ones used the name (Baby Shower). Both resolve here.
  const categoryParam = slugify(params.get('category') || 'all');
  const urlCategory = activeCategories.find(category => slugify(category.name) === categoryParam)?.name ?? 'all';
  const urlTier = params.get('tier');
  // undefined = follow the URL; null = cleared (every tier, grouped).
  const [tierChoice, setTierChoice] = useState<TemplateTier | null | undefined>(undefined);
  const activeTier: TemplateTier | null = tierChoice === undefined ? (TEMPLATE_TIERS.find(t => t === urlTier) ?? null) : tierChoice;
  const [selection, setSelection] = useState<{ urlCategory: string; value: string } | null>(null);
  const activeCategory = selection?.urlCategory === urlCategory ? selection.value : urlCategory;
  const setActiveCategory = (value: string) => setSelection({ urlCategory, value });
  const categoryBar = useRef<HTMLDivElement>(null);
  // On phones the row scrolls sideways, so bring the chosen category into view (the row only, not the page).
  useEffect(() => {
    const bar = categoryBar.current;
    const pill = bar?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (bar && pill) bar.scrollTo({ left: pill.offsetLeft - (bar.clientWidth - pill.offsetWidth) / 2 });
  }, [activeCategory]);
  const categories = [
    { label: "All Templates", key: "all" },
    ...activeCategories.map(category => ({ label: category.name, key: category.name })),
  ];

  const inCategory =
    activeCategory === "all"
      ? templates
      : templates.filter((t) => t.category?.toLowerCase() === activeCategory.toLowerCase());
  const filtered = activeTier ? inCategory.filter(t => getTemplateTier(t) === activeTier) : inCategory;
  const tierGroups = TEMPLATE_TIERS
    .filter(tier => !activeTier || tier === activeTier)
    .map(tier => ({ tier, items: inCategory.filter(t => getTemplateTier(t) === tier) }))
    .filter(group => group.items.length > 0);
  // "Starts from" follows the lowest real price in each tier, so per-tier prices need no code change later.
  const startingPrice = (tier: TemplateTier) => {
    const prices = templates.filter(t => getTemplateTier(t) === tier).map(t => getTemplatePricing(t).numericPrice);
    return `₹${(prices.length ? Math.min(...prices) : Number(DEFAULT_TEMPLATE_PRICE)).toLocaleString("en-IN")}`;
  };
  const tierCount = (tier: TemplateTier) => inCategory.filter(t => getTemplateTier(t) === tier).length;
  const otherTiers = TEMPLATE_TIERS.filter(t => t !== activeTier && tierCount(t) > 0);

  return (
    <main className={styles.templatesPage}>
      {error && <p role="alert">{error}</p>}
      <PageBanner crumb="Templates" eyebrow="THE INVITATION COLLECTION" title="Find the one that" accent="feels like you." description="Romantic, playful, or rooted in tradition. Explore the collection and open a live preview to find your celebration’s perfect beginning." posters={["/template-posters/wedding-golden-vows.webp", "/template-posters/birthday-golden-wish.webp", "/template-posters/baby-naming-little-star.webp", "/template-posters/traditional-sacred-beginnings.webp", "/template-posters/anniversary-still-us.webp"]} />

      {/* Category pills */}
      <div ref={categoryBar} className={styles.categoryBar}>
        {categories.map((cat) => (
          <button
            key={cat.key}
            aria-pressed={activeCategory === cat.key}
            className={`${styles.categoryPill} ${activeCategory === cat.key ? styles.active : ""}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Collection tiers: pick one to narrow the list, or clear to see every tier */}
      <div className={styles.tierPanel}>
        <div className={styles.tierPanelHead}>
          <span className={styles.tierPanelLabel}>Choose your collection</span>
          {activeTier && (
            <button type="button" className={styles.tierClear} onClick={() => setTierChoice(null)}>
              <X size={13} aria-hidden="true" /> Clear
            </button>
          )}
        </div>
        <div className={`${styles.tierCards} ${activeTier ? styles.tierCardsPicked : ""}`} role="group" aria-label="Collections">
          {TEMPLATE_TIERS.map((tier, index) => (
            <button
              key={tier}
              type="button"
              aria-pressed={activeTier === tier}
              className={`${styles.tierCard} ${styles[`tierCard_${tier}`]} ${activeTier === tier ? styles.tierCardOn : ""}`}
              onClick={() => setTierChoice(activeTier === tier ? null : tier)}
            >
              <span className={styles.tierGems} aria-hidden="true">
                {Array.from({ length: index + 1 }, (_, g) => <i key={g} />)}
              </span>
              <span className={styles.tierCardText}>
                <span className={styles.tierCardName}>{TIER_DETAILS[tier].label}</span>
                <span className={styles.tierCardMeta}>
                  {tierCount(tier)} design{tierCount(tier) === 1 ? "" : "s"}<span className={styles.tierCardPrice}> · from <strong>{startingPrice(tier)}</strong></span>
                </span>
              </span>
              <span className={styles.tierCardCheck} aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
            </button>
          ))}
        </div>
      </div>

      <p className={styles.templatesCount}>
        {activeTier
          ? `SHOWING ${filtered.length} ${TIER_DETAILS[activeTier].label.toUpperCase()} DESIGN${filtered.length === 1 ? "" : "S"}`
          : `SHOWING ALL ${filtered.length} DESIGNS`}
      </p>

      {tierGroups.map(({ tier, items }) => (
        <section key={tier} className={styles.tierSection} aria-labelledby={`tier-${tier}`}>
          <header className={styles.tierHeader}>
            <div>
              <p className={`${styles.tierEyebrow} ${styles[`tier_${tier}`]}`}>{TIER_DETAILS[tier].label} collection · {items.length} design{items.length === 1 ? "" : "s"}</p>
              <h2 id={`tier-${tier}`}>{TIER_DETAILS[tier].tagline}</h2>
              <p className={styles.tierDescription}>{TIER_DETAILS[tier].description}</p>
            </div>
            <p className={styles.tierHeaderPrice}>Starts from <strong>{startingPrice(tier)}</strong></p>
          </header>
          <div key={`${tier}-${activeCategory}`} className={`${styles.templatesGrid} ${styles.tierGridIn}`}>
            {items.map((t) => (
              <TemplateCard key={t.filename} template={t} />
            ))}
          </div>
        </section>
      ))}

      {/* Empty state */}
      {!error && filtered.length === 0 && (
        <div className={styles.emptyState}>
          <p>No {activeTier ? `${TIER_DETAILS[activeTier].label} ` : ""}designs {activeCategory === "all" ? "yet" : `for ${activeCategory} yet`}.</p>
          <div className={styles.emptyActions}>
            {otherTiers.map(tier => (
              <button key={tier} className={styles.categoryPill} onClick={() => setTierChoice(tier)}>
                See {TIER_DETAILS[tier].label} ({tierCount(tier)})
              </button>
            ))}
            {otherTiers.length === 0 && activeCategory !== "all" && (
              <button className={styles.categoryPill} onClick={() => setActiveCategory("all")}>Show all categories</button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

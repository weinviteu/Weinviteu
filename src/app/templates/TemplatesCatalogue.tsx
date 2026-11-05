"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
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
  // The chosen category and collection live in the URL, so coming back from a template
  // (browser Back) restores exactly what the visitor had picked.
  const activeTier: TemplateTier | null = TEMPLATE_TIERS.find(t => t === urlTier) ?? null;
  const activeCategory = urlCategory;
  const updateUrl = (changes: { category?: string; tier?: TemplateTier | null }) => {
    const next = new URLSearchParams(params.toString());
    if ('category' in changes) {
      if (!changes.category || changes.category === 'all') next.delete('category');
      else next.set('category', slugify(changes.category));
    }
    if ('tier' in changes) {
      if (changes.tier) next.set('tier', changes.tier);
      else next.delete('tier');
    }
    const query = next.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  };
  const setActiveCategory = (value: string) => updateUrl({ category: value });
  const setTierChoice = (tier: TemplateTier | null) => updateUrl({ tier });
  const categoryBar = useRef<HTMLDivElement>(null);
  // Ensure the template catalogue always displays from the top banner down
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);
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
  const categoryCount = (key: string) => key === "all" ? templates.length : templates.filter(t => t.category?.toLowerCase() === key.toLowerCase()).length;
  const currentCategory = categories.find(cat => cat.key === activeCategory) ?? categories[0];
  // Phones: every occasion in one dropdown panel instead of a row that hides some off-screen.
  const [pickerOpen, setPickerOpen] = useState(false);
  const picker = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!pickerOpen) return;
    const outside = (e: PointerEvent) => { if (!picker.current?.contains(e.target as Node)) setPickerOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setPickerOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [pickerOpen]);

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
    <div className={styles.catalogueSection}>
      {error && <p role="alert">{error}</p>}

      {/* Occasion picker (phones) */}
      <div ref={picker} className={styles.categoryPicker}>
        <button type="button" className={`${styles.pickerButton} ${pickerOpen ? styles.pickerButtonOpen : ""}`}
          aria-haspopup="true" aria-expanded={pickerOpen} aria-controls="occasion-menu" onClick={() => setPickerOpen(open => !open)}>
          <span className={styles.pickerText}>
            <span className={styles.pickerLabel}>Occasion</span>
            <span className={styles.pickerValue}>{currentCategory.label}<small>{categoryCount(currentCategory.key)} designs</small></span>
          </span>
          <ChevronDown size={18} className={styles.pickerChevron} aria-hidden="true" />
        </button>
        {pickerOpen && (
          <div id="occasion-menu" className={styles.pickerMenu} role="group" aria-label="Choose an occasion">
            {categories.map(cat => {
              const on = activeCategory === cat.key;
              return (
                <button key={cat.key} type="button" aria-pressed={on} className={`${styles.pickerOption} ${on ? styles.pickerOptionOn : ""}`}
                  onClick={() => { setActiveCategory(cat.key); setPickerOpen(false); }}>
                  <span>{cat.label}<small>{categoryCount(cat.key)} designs</small></span>
                  {on && <Check size={15} strokeWidth={2.6} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Category pills (wider screens) */}
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
                  from <strong>{startingPrice(tier)}</strong>
                </span>
              </span>
              <span className={styles.tierCardCheck} aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
            </button>
          ))}
        </div>
      </div>

      <p className={styles.templatesCount}>
        {activeTier
          ? `SHOWING ${TIER_DETAILS[activeTier].label.toUpperCase()} DESIGNS`
          : "SHOWING ALL DESIGNS"}
      </p>

      {tierGroups.map(({ tier, items }) => (
        <section key={tier} className={styles.tierSection} aria-labelledby={`tier-${tier}`}>
          <header className={styles.tierHeader}>
            <div>
              <p className={`${styles.tierEyebrow} ${styles[`tier_${tier}`]}`}>{TIER_DETAILS[tier].label} collection</p>
              <h2 id={`tier-${tier}`}>{TIER_DETAILS[tier].tagline}</h2>
              <p className={styles.tierDescription}>{TIER_DETAILS[tier].description}</p>
            </div>
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
                See {TIER_DETAILS[tier].label}
              </button>
            ))}
            {otherTiers.length === 0 && activeCategory !== "all" && (
              <button className={styles.categoryPill} onClick={() => setActiveCategory("all")}>Show all categories</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

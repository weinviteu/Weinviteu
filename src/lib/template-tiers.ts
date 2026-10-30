/** Every template belongs to one collection tier, chosen in Admin → Templates. */
export const TEMPLATE_TIERS = ['simple', 'premium', 'luxury'] as const;
export type TemplateTier = typeof TEMPLATE_TIERS[number];
export const DEFAULT_TEMPLATE_TIER: TemplateTier = 'premium';

export const TIER_DETAILS: Record<TemplateTier, { label: string; tagline: string; description: string }> = {
  simple: {
    label: 'Simple',
    tagline: 'Elegant & effortless',
    description: 'Clean, graceful designs with gentle motion — beautiful, quick to personalise and easy for every guest.',
  },
  premium: {
    label: 'Premium',
    tagline: 'Rich 3D storytelling',
    description: 'Layered 3D scenes and interactive reveals that turn opening your invitation into a moment.',
  },
  luxury: {
    label: 'Luxury',
    tagline: 'Our most cinematic',
    description: 'Grand, ornate experiences with our most detailed artwork and theatrical openings.',
  },
};

export function getTemplateTier(template: { tier?: string | null }): TemplateTier {
  const tier = template.tier?.trim().toLowerCase();
  return TEMPLATE_TIERS.find(t => t === tier) ?? DEFAULT_TEMPLATE_TIER;
}

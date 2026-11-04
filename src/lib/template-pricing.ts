import { DEFAULT_TEMPLATE_TIER, getTemplateTier, type TemplateTier } from './template-tiers';

/** Display discounts only when the administrator supplies an actual higher original price. */
export interface TemplatePricing {
  price: string; originalPrice: string; discount: string; numericPrice: number; saveAmount: string;
  /** 18% GST on the price, and the price including it. */
  gst: string; total: string; numericTotal: number;
}
/** The collection tier sets the price; GST is charged on top. */
export const TIER_PRICES: Record<TemplateTier, number> = { simple: 1999, premium: 2999, luxury: 3999 };
export const GST_PERCENT = 18;
export const GST_NOTE = `+ ${GST_PERCENT}% GST`;
export const DEFAULT_TEMPLATE_PRICE = String(TIER_PRICES[DEFAULT_TEMPLATE_TIER]);
export const DEFAULT_TEMPLATE_ORIGINAL_PRICE = '';
function amount(value?: string | null): number | null {
  if (!value?.trim()) return null;
  const text = value.replace(/[₹,\s]/g, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const result = Number(text);
  return Number.isFinite(result) ? result : null;
}
export const rupees = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export function getTemplatePricing(template: { tier?: string | null; original_price?: string | null }): TemplatePricing {
  const price = TIER_PRICES[getTemplateTier(template)];
  // Whole paise, so ₹1,999 gives ₹359.82 GST rather than a floating-point tail.
  const gst = Math.round(price * GST_PERCENT) / 100;
  const total = Math.round((price + gst) * 100) / 100;
  const original = amount(template.original_price);
  const discounted = original !== null && original > price;
  return {
    price: rupees(price), numericPrice: price,
    gst: rupees(gst), total: rupees(total), numericTotal: total,
    originalPrice: discounted ? rupees(original) : '',
    discount: discounted ? `${Math.round((original - price) / original * 100)}% OFF` : '',
    saveAmount: discounted ? `Save ${rupees(original - price)}` : '',
  };
}

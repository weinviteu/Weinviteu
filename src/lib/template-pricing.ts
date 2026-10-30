/** Display discounts only when the administrator supplies an actual higher original price. */
export interface TemplatePricing {
  price: string; originalPrice: string; discount: string; numericPrice: number; saveAmount: string;
}
export const DEFAULT_TEMPLATE_PRICE = '1999';
export const DEFAULT_TEMPLATE_ORIGINAL_PRICE = '';
function amount(value?: string | null): number | null {
  if (!value?.trim()) return null;
  const text = value.replace(/[₹,\s]/g, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const result = Number(text);
  return Number.isFinite(result) ? result : null;
}
const rupees = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export function getTemplatePricing(template: { price?: string | null; original_price?: string | null; category?: string | null }): TemplatePricing {
  const custom = amount(template.price);
  const price = custom ?? Number(DEFAULT_TEMPLATE_PRICE);
  const original = amount(template.original_price);
  const discounted = original !== null && original > price;
  return {
    price: rupees(price), numericPrice: price,
    originalPrice: discounted ? rupees(original) : '',
    discount: discounted ? `${Math.round((original - price) / original * 100)}% OFF` : '',
    saveAmount: discounted ? `Save ${rupees(original - price)}` : '',
  };
}

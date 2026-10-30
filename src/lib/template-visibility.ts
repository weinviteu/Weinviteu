import type { Category, Template } from './models';
/** A linked category ID is authoritative, including when its category is hidden. */
export function templateIsVisible(template: Template, categories: Category[]): boolean {
  if (template.enabled === false) return false;
  const active = categories.filter(category => category.is_active);
  if (template.category_id != null) return active.some(category => category.id === template.category_id);
  return active.some(category => category.name.trim().toLowerCase() === template.category.trim().toLowerCase());
}

import { z } from 'zod';
import { TEMPLATE_TIERS } from './template-tiers';
const color = z.string().regex(/^(#[0-9a-fA-F]{6})?$/);
const image = z.string().max(7_000_000).regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/);
export const editorSchema = z.object({
  texts: z.record(z.string().max(500), z.string().max(10000)),
  images: z.record(z.string().regex(/^[A-Za-z0-9_.]+$/).max(150), image),
  config: z.record(z.string().regex(/^[A-Za-z0-9_.]+$/).max(150), z.union([z.string().max(10000).regex(/^[^<>\u0000]*$/, 'Use plain text, not HTML.'), z.number().finite().min(0).max(1000000)])).optional(),
  musicName: z.string().max(250).optional(),
  primaryColor: color, bgColor: color,
  musicUrl: z.string().max(14_000_000).refine(s => !s || /^data:audio\/[\w.+-]+;base64,[A-Za-z0-9+/=]+$/.test(s)),
});
export const settingsSchema = z.object({
  studio_name: z.string().trim().min(1).max(150), contact_email: z.email(),
  whatsapp_number: z.union([z.literal(''), z.string().regex(/^\+?[\d ()-]{7,25}$/)]), location: z.string().max(200),
  email_notifications: z.boolean().optional(), whatsapp_tracking: z.boolean().optional(),
});
export const templateSchema = z.object({ title: z.string().trim().min(1).max(150), category: z.string().trim().min(1).max(80), badge: z.string().max(80), price: z.string().trim().max(80).optional(), original_price: z.string().trim().max(80).optional(), tier: z.enum(TEMPLATE_TIERS).optional(), enabled: z.boolean().optional() });

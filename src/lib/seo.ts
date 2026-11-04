import type { Template } from "./models";
import { getTemplatePricing } from "./template-pricing";
import { getTemplatePoster } from "./template-posters";
import { getTemplateTier, TIER_DETAILS } from "./template-tiers";

/** Canonical origin for links, sitemaps and share cards. Set SITE_URL to the live https domain in production. */
export const SITE_URL = (
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/+$/, "");

export const SITE_NAME = "WeInviteU";
export const SITE_TAGLINE = "Making Every Invitation Special";

export const SITE_DESCRIPTION =
  "WeInviteU designs premium 3D digital invitations for weddings, engagements, birthdays, baby showers, naming ceremonies, griha pravesh, poojas, anniversaries and grand openings. Preview every design live, get it personalised with your names, photos, music, venue map and RSVP, and share one link on WhatsApp with unlimited guests — designs start from ₹1,999 + GST.";

export const SITE_KEYWORDS = [
  "digital invitation", "3D digital invitation", "e-invite", "online invitation card", "WhatsApp invitation",
  "digital wedding card", "birthday e-invite", "baby shower invitation",
  "naming ceremony invitation", "griha pravesh invitation", "housewarming invitation", "pooja invitation",
  "anniversary invitation", "grand opening invitation", "interactive invitation website", "WeInviteU",
];

/** Search phrases people actually use for each occasion, including Indian ceremony names. */
const OCCASION_SEO: Record<string, { noun: string; keywords: string[] }> = {
  wedding: { noun: "wedding", keywords: ["wedding invitation", "digital wedding card", "marriage e-invite", "shaadi invitation", "WhatsApp wedding invite", "wedding invitation website"] },
  birthday: { noun: "birthday party", keywords: ["birthday invitation", "birthday e-invite", "digital birthday card", "kids birthday invitation", "1st birthday invitation"] },
  "baby shower": { noun: "baby shower", keywords: ["baby shower invitation", "seemantham invitation", "godh bharai invitation", "valaikappu invitation", "digital baby shower card"] },
  "baby naming": { noun: "naming ceremony", keywords: ["naming ceremony invitation", "namakaran invitation", "barsala invitation", "cradle ceremony invitation", "baby naming e-invite"] },
  traditional: { noun: "traditional ceremony", keywords: ["griha pravesh invitation", "gruhapravesam invitation", "housewarming invitation", "pooja invitation", "satyanarayan pooja invite"] },
  anniversary: { noun: "anniversary", keywords: ["anniversary invitation", "wedding anniversary e-invite", "25th anniversary invitation", "silver jubilee invitation"] },
  corporate: { noun: "corporate event", keywords: ["corporate event invitation", "business event e-invite", "conference invitation", "product launch invitation"] },
  "opening ceremony": { noun: "grand opening", keywords: ["grand opening invitation", "shop opening invitation", "inauguration invitation", "showroom launch invite"] },
};

function occasion(category?: string | null) {
  const key = category?.trim().toLowerCase() || "";
  return OCCASION_SEO[key] ?? { noun: key || "celebration", keywords: [`${key || "event"} invitation`, `${key || "event"} e-invite`] };
}

export const absoluteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

/** Title, description, keywords and share image for one template's detail page. */
export function templateSeo(template: Template) {
  const pricing = getTemplatePricing(template);
  const tier = TIER_DETAILS[getTemplateTier(template)];
  const { noun, keywords } = occasion(template.category);
  const title = `${template.title} – ${template.category} 3D Digital Invitation`;
  const description =
    `${template.title} is a ${tier.label.toLowerCase()} 3D digital ${noun} invitation by ${SITE_NAME}. ${tier.description} ` +
    `Preview it live, then we personalise the names, date, venue, photos and music and send you one link to share on WhatsApp with unlimited guests. Starts from ${pricing.price} + 18% GST, delivered in 24–48 hours.`;
  const poster = getTemplatePoster(template.filename);
  return {
    title, description, tier, pricing,
    image: poster ? absoluteUrl(poster) : undefined,
    keywords: [...keywords, `${tier.label.toLowerCase()} ${noun} invitation`, `${template.title} invitation`, "3D digital invitation", SITE_NAME],
  };
}

/** Render-safe JSON-LD: `<` is escaped so data can never close the script tag. */
export const jsonLdHtml = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl("/images/logo.png"),
      slogan: SITE_TAGLINE,
      description: SITE_DESCRIPTION,
      areaServed: "IN",
      parentOrganization: { "@type": "Organization", name: "RAKVIH Solutions Private Limited", url: "https://rakvih.in/" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "en-IN",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

/** A page's own openGraph replaces the layout's, so every page restates the site-wide fields. */
export const pageOpenGraph = (og: { url: string; title: string; description?: string; images?: string[] }) => ({
  type: "website" as const, siteName: SITE_NAME, locale: "en_IN", ...og,
});

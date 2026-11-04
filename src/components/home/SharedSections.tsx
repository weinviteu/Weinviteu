import type React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Plus, X } from "lucide-react";
import { withBundledTemplates } from "@/lib/bundled-templates";
import { getTemplatePoster } from "@/lib/template-posters";
import { getTemplatePricing, DEFAULT_TEMPLATE_PRICE, GST_NOTE, TIER_PRICES, rupees } from "@/lib/template-pricing";
import { TEMPLATE_TIERS, TIER_DETAILS } from "@/lib/template-tiers";
import { templateIsVisible } from "@/lib/template-visibility";
import { supabase } from "@/lib/supabase";
import { jsonLdHtml } from "@/lib/seo";

/** Home-page sections reused on other pages. They are styled by app/home-refresh.css inside a `.home-redesign` wrapper. */

/** Visible templates, their poster images and the lowest price, as the home page computes them. */
export async function loadCatalogueSummary() {
  const [{ data: categories }, { data: rawTemplates }] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("templates").select("*").neq("enabled", false).order("created_at", { ascending: false }).order("id", { ascending: false }),
  ]);
  const cats = categories || [];
  const templates = withBundledTemplates(rawTemplates || [], cats).filter(t => templateIsVisible(t, cats));
  const lowest = templates.length ? Math.min(...templates.map(t => getTemplatePricing(t).numericPrice)) : Number(DEFAULT_TEMPLATE_PRICE);
  const posters = [...new Set(templates.map(t => getTemplatePoster(t.filename)).filter((p): p is string => !!p))];
  return { templates, posters, startingPrice: `₹${lowest.toLocaleString("en-IN")}` };
}

const comparison = [
  { paper: "Weeks of printing and delivery", digital: "Ready in 24 to 48 hours" },
  { paper: "Couriers, postage and hand delivery", digital: "One link, sent anywhere in seconds" },
  { paper: "Every extra card costs more", digital: "Unlimited guests, same price" },
  { paper: "Separate calls for directions & replies", digital: "Map and guest replies built in" },
  { paper: "A card that is read once", digital: "An interactive 3D story" },
];

export function WhyDigital({ tint = true }: { tint?: boolean }) {
  return (
    <section className={`hx-section${tint ? " hx-tint" : ""}`}>
      <div className="hx-wrap">
        <header className="hx-head hx-head-center">
          <div>
            <p className="hx-eyebrow"><span aria-hidden="true" />Why go digital<span aria-hidden="true" /></p>
            <h2>All the charm of a printed card. <em>None of the hassle.</em></h2>
          </div>
        </header>
        <div className="hx-versus">
          <div className="hx-versus-card">
            <p className="hx-versus-title">Printed cards</p>
            <ul>{comparison.map(row => <li key={row.paper}><X size={16} aria-hidden="true" /> {row.paper}</li>)}</ul>
          </div>
          <span className="hx-versus-vs" aria-hidden="true">vs</span>
          <div className="hx-versus-card hx-versus-us">
            <p className="hx-versus-title">WeInviteU</p>
            <ul>{comparison.map(row => <li key={row.digital}><Check size={16} aria-hidden="true" /> {row.digital}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Shared by the visible FAQ and its FAQPage structured data, so the two never drift apart. */
export function faqItems(startingPrice: string) {
  return [
    { q: "How do I order an invitation?", a: "Pick a design you love, then tap the WhatsApp button on it or message us from the Contact page. Share your names, date, venue and any photos, and we take care of the rest." },
    { q: "How long does it take?", a: "Most invitations are personalised and delivered within 24 to 48 hours of receiving your details." },
    { q: "How much does it cost?", a: `Designs start from ${startingPrice} ${GST_NOTE}. Each collection has one price: ${TEMPLATE_TIERS.map(tier => `${TIER_DETAILS[tier].label} ${rupees(TIER_PRICES[tier])}`).join(", ")}, all plus GST. There are no extra charges for sharing with more guests.` },
    { q: "Can I see a design before I order?", a: "Yes. Every design in our collection can be previewed live in your browser, exactly as your guests will experience it." },
    { q: "Will it work for guests who are not tech-savvy?", a: "It is just a link. Guests tap it in WhatsApp, Instagram, SMS or email and it opens in their browser — nothing to download or install." },
    { q: "Can I add our photos and personal details?", a: "Of course. We personalise your names, dates, venue, timings and photos so the invitation tells your story, not a template’s." },
  ];
}

export function Faq({ startingPrice, tint = true }: { startingPrice: string; tint?: boolean }) {
  const faqs = faqItems(startingPrice);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <section className={`hx-section${tint ? " hx-tint" : ""}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(faqJsonLd)} />
      <div className="hx-wrap hx-faq-layout">
        <header className="hx-faq-head">
          <p className="hx-eyebrow"><span aria-hidden="true" />Questions, answered</p>
          <h2>Good to <em>know.</em></h2>
          <p className="hx-lede">Can’t find what you’re looking for? We’re happy to help.</p>
          <Link href="/contact" className="hx-outline-btn">Get in touch <ArrowUpRight size={14} /></Link>
        </header>
        <div className="hx-faq">
          {faqs.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>{f.q}<Plus size={18} aria-hidden="true" /></summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

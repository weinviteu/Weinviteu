import Link from "next/link";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import type { Template } from "@/lib/models";
import { getTemplateUrl, templatePath, templatePreviewPath } from "@/lib/template-url";
import { findTemplate, loadVisibleTemplates } from "@/lib/template-catalogue";
import { getTemplatePricing, GST_NOTE } from "@/lib/template-pricing";
import { SITE_NAME, SITE_URL, absoluteUrl, jsonLdHtml, pageOpenGraph, templateSeo } from "@/lib/seo";
import { getTemplateTier, TIER_DETAILS } from "@/lib/template-tiers";
import { getTemplateWalkthrough } from "@/lib/template-content";
import TemplateCard from "@/components/TemplateCard";
import QuickSpecs from "@/components/QuickSpecs";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { readRegisteredTemplate } from "@/lib/template-source";

import styles from "./template-detail.module.css";
import SimulatorStage from "./SimulatorStage";
import TemplateActions from "./TemplateActions";
import TemplateInquiryForm from "./TemplateInquiryForm";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

/** Share one fresh catalogue read between metadata, page and related templates. */
const fetchCatalogue = cache(loadVisibleTemplates);
const fetchTemplate = cache(async (id: string): Promise<Template | null> => findTemplate(await fetchCatalogue(), id));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const template = await fetchTemplate(id);

  if (!template) {
    return {
      title: "Template Not Found",
      description: "The requested invitation template could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const seo = templateSeo(template);
  const path = templatePath(template);
  const images = seo.image ? [seo.image] : undefined;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: path },
    openGraph: pageOpenGraph({ url: path, title: `${seo.title} | ${SITE_NAME}`, description: seo.description, images }),
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description, images },
  };
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { id } = await params;
  const template = await fetchTemplate(id);

  if (!template) {
    notFound();
  }
  // Older id links keep working and pass their ranking to the readable address.
  if (template.slug !== id) permanentRedirect(templatePath(template));

  const pricing = getTemplatePricing(template);
  const tier = TIER_DETAILS[getTemplateTier(template)];
  const [html, allOther] = await Promise.all([
    readRegisteredTemplate(supabase, template.filename).catch(() => ""),
    fetchCatalogue().then(items => items.filter(t => t.id !== template.id)),
  ]);
  const walkthrough = getTemplateWalkthrough(template, html);
  const previewUrl = getTemplateUrl(template.filename);
  const previewPath = templatePreviewPath(template);

  const sameCategory = allOther.filter(
    (t) => t.category?.toLowerCase() === template.category?.toLowerCase()
  );
  const relatedTemplates = (sameCategory.length >= 3 ? sameCategory : allOther).slice(0, 3);

  const whatsappOrderUrl = `/api/whatsapp?template=${encodeURIComponent(
    template.title
  )}&text=${encodeURIComponent(
    `Hi WeInviteU! I would like to order the "${template.title}" template (${tier.label} collection, starting from ${pricing.price} ${GST_NOTE} = ${pricing.total}). Please guide me through customizing it for my celebration.`
  )}`;

  const seo = templateSeo(template);
  const pageUrl = absoluteUrl(templatePath(template));
  const productJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${pageUrl}#product`,
        name: `${template.title} – ${template.category} 3D Digital Invitation`,
        description: seo.description,
        url: pageUrl,
        ...(seo.image ? { image: seo.image } : {}),
        category: `${template.category} invitations`,
        brand: { "@type": "Brand", name: SITE_NAME },
        additionalProperty: [
          { "@type": "PropertyValue", name: "Collection", value: tier.label },
          { "@type": "PropertyValue", name: "Format", value: "Interactive 3D digital invitation (shareable link)" },
        ],
        offers: {
          "@type": "Offer",
          url: pageUrl,
          price: pricing.numericPrice,
          priceCurrency: "INR",
          priceSpecification: { "@type": "UnitPriceSpecification", price: pricing.numericPrice, priceCurrency: "INR", valueAddedTaxIncluded: false },
          availability: "https://schema.org/InStock",
          seller: { "@id": `${SITE_URL}/#organization` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Templates", item: absoluteUrl("/templates") },
          { "@type": "ListItem", position: 3, name: template.title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className={styles.detailPage}>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(productJsonLd)} />
      <div className={styles.container}>
        {/* Mobile: Preview and Share sit at the top, above the phone */}
        <TemplateActions previewUrl={previewPath} templateTitle={template.title} className={styles.actionsTop} />

        {/* ── Main Two-Column Showcase: Simulator + Pricing ── */}
        <section className={styles.heroShowcase}>
          {/* Left: Realistic Live Phone Simulator */}
          <SimulatorStage previewUrl={previewUrl} embedUrl={`${previewPath}?embed=1`} templateTitle={template.title} />

          {/* Right: Overview, Price Box, and Direct Actions */}
          <div className={styles.overviewCol}>
            <div className={styles.badgeRow}>
              <span className={`${styles.badgePill} ${styles.desktopOnly}`}>{template.badge || "EXCLUSIVE"}</span>
              <span className={styles.tierPill}>{tier.label} collection</span>
              <span className={styles.categoryPill}>{template.category}</span>
              <span className={`${styles.categoryPill} ${styles.desktopOnly}`}>✦ 3D Interactive</span>
              {walkthrough.hasAudio && <span className={styles.categoryPill}>🎵 Audio<span className={styles.desktopOnly}> supported</span></span>}
            </div>

            <h1 className={styles.templateTitle}>
              {template.title}
              <br />
              <em>Digital Invitation</em>
            </h1>

            <p className={styles.templateLead}>
              Preview this {template.category.toLowerCase()} invitation and explore its design.
              Ask our studio about personalizing the wording and media available in this template.
            </p>

            {/* Price & Value Proposition Card */}
            <div className={styles.pricingCard}>
              <div className={styles.priceRow}>
                <div className={styles.priceHeader}>
                  <span className={styles.priceFrom}>Starts from</span>
                  <span className={styles.currentPrice}>{pricing.price}</span>
                  {pricing.originalPrice && (
                    <span className={styles.originalPrice}>{pricing.originalPrice}</span>
                  )}
                  {pricing.discount && (<span className={styles.discountBadge}>{pricing.discount}</span>)}
                </div>
                <TemplateActions previewUrl={previewPath} templateTitle={template.title} className={styles.actionsInline} />
              </div>
              <p className={styles.priceTax}>
                {GST_NOTE} ({pricing.gst}) · <strong>Total {pricing.total}</strong>
              </p>
              <p className={styles.priceSubtitle}>
                One-time payment · Unlimited guest shares · No monthly subscriptions
              </p>

              <div className={styles.ctaButtonGroup}>
                <a
                  href={whatsappOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnWhatsAppPrimary}
                >
                  <WhatsAppIcon size={22} /> Order via WhatsApp (from {pricing.price})
                </a>
                <a href="#inquiry-form" className={styles.btnSecondaryAction}>
                  Request Customization / Inquire Below
                </a>
              </div>

              {/* Inclusions */}
              <div className={styles.inclusionsList}>
                {walkthrough.highlights.map(item => <div key={item} className={styles.inclusionItem}>
                  <CheckCircle2 size={16} className={styles.checkIcon} /><span>{item}</span>
                </div>)}
              </div>
            </div>

            <QuickSpecs />
          </div>
        </section>

        {/* ── Section: STARTING TO END CONTENTS WALKTHROUGH ── */}
        <section className={`${styles.walkthroughSection} ${styles.peachBand}`}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>CONTENTS & PERSONALIZATION</p>
            <h2 className={styles.sectionHeading}>
              What&apos;s Inside <em>This Template</em>
            </h2>
            <p className={styles.sectionDesc}>
              A guide to the sections, features and personalization options included in this invitation.
            </p>
          </div>

          {/* Opening Reveal Banner */}
          <div className={styles.openingBanner}>
            <div className={styles.openingIconHalo}>
              <Sparkles size={34} />
            </div>
            <div className={styles.openingContent}>
              <h3>Live Preview: {walkthrough.openingAction}</h3>
              <p>{walkthrough.openingDescription}</p>
            </div>
          </div>

          {walkthrough.steps.length === 0 && <p className={styles.sectionDesc}>
            Section headings are not available for this template. Explore the live preview for its full contents.
          </p>}
          {/* Sequential Step Timeline */}
          <div className={styles.timelineStepper}>
            {walkthrough.steps.map((step) => (
              <article key={step.step} className={styles.stepCard}>
                <div className={styles.stepNumberCol}>
                  <div className={styles.stepNumberBubble}>
                    {step.step < 10 ? `0${step.step}` : step.step}
                  </div>
                  <span className={styles.stepPhaseBadge}>{step.badge}</span>
                </div>

                <div className={styles.stepBody}>
                  <div className={styles.stepTopRow}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    {step.headline && <p className={styles.stepHeadline}>{step.headline}</p>}
                  </div>

                  <ul className={styles.sectionPoints}>
                    {step.points.map(point => <li key={point}>{point}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Instant Order / Inquiry Section ── */}
        <section className={styles.inquirySection} id="inquiry-form">
          <div style={{ textAlign: "center" }}>
            <p className={styles.sectionEyebrow}>FAST & EFFORTLESS SETUP</p>
            <h2 className={styles.sectionHeading} style={{ fontSize: "36px" }}>
              Ready to Customize <em>{template.title}</em>?
            </h2>
            <p className={styles.sectionDesc}>
              Leave your details below. Our design studio will contact you promptly to gather your
              names, ceremony timings, photos, and music preference.
            </p>
          </div>

          <TemplateInquiryForm
            templateTitle={template.title}
            templatePrice={`from ${pricing.price} ${GST_NOTE}`}
            templateCategory={template.category}
          />
        </section>

        {/* ── Recommended & Similar Templates ── */}
        {relatedTemplates.length > 0 && (
          <section className={`${styles.relatedSection} ${styles.peachBand}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <p className={styles.sectionEyebrow}>MORE FROM OUR COLLECTION</p>
                <h2 className={styles.sectionHeading} style={{ fontSize: "32px", margin: 0 }}>
                  You Might Also <em>Love</em>
                </h2>
              </div>
              <Link href="/templates" className={styles.backLink}>
                View All Templates <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className={styles.relatedGrid}>
              {relatedTemplates.map((t) => (
                <TemplateCard key={t.filename} template={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

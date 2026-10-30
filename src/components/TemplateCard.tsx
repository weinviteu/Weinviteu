import React from "react";
import Link from "next/link";
import { Eye, ArrowUpRight } from "lucide-react";
import { templatePath, templatePreviewPath } from "@/lib/template-url";
import { getTemplatePricing } from "@/lib/template-pricing";
import { getTemplateTier, TIER_DETAILS } from "@/lib/template-tiers";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import TemplateCover from "@/components/TemplateCover";

export interface TemplateData {
  id?: number | string;
  slug?: string | null;
  title: string;
  filename: string;
  category: string;
  badge: string;
  bg?: string;
  price?: string;
  original_price?: string;
  tier?: string;
}

export default function TemplateCard({ template }: { template: TemplateData }) {
  const url = templatePreviewPath(template);
  const detailUrl = templatePath(template);
  const pricing = getTemplatePricing(template);
  const tier = getTemplateTier(template);

  return (
    <article className="home-tmpl-card">
      <div className="home-tmpl-stage">
        <span className="home-tmpl-badge">{template.badge}</span>
        <span className={`home-tmpl-tier home-tmpl-tier-${tier}`}>{TIER_DETAILS[tier].label}</span>

        {/* Clickable stage overlay taking the user to the template's [id] page */}
        <Link
          href={detailUrl}
          className="home-tmpl-stage-link"
          aria-label={`View ${template.title} details, step-by-step contents, and pricing`}
        >
          <span className="home-tmpl-stage-hint">
            View Details & Contents <ArrowUpRight size={13} />
          </span>
        </Link>

        <div className="home-tmpl-phone">
          <div className="home-tmpl-screen">
            <div className="home-tmpl-notch" />
            <TemplateCover filename={template.filename} title={template.title} />
          </div>
        </div>
      </div>

      <div className="home-tmpl-info">
        <div className="home-tmpl-meta">
          <Link href={detailUrl} className="home-tmpl-info-link">
            <h3>{template.title}</h3>
          </Link>
          <p>{template.category} · {TIER_DETAILS[tier].label} collection</p>

          {/* Price displayed prominently inside the template card */}
          <div className="home-tmpl-price-row">
            <span className="home-tmpl-price-from">Starts from</span>
            <span className="home-tmpl-price">{pricing.price}</span>
            {pricing.originalPrice && (
              <span className="home-tmpl-price-orig">{pricing.originalPrice}</span>
            )}
            {pricing.discount && (<span className="home-tmpl-price-badge">{pricing.discount}</span>)}
          </div>
        </div>

        <div className="home-tmpl-btns">
          <Link
            href={detailUrl}
            className="round-link"
            aria-label={`View ${template.title} starting-to-end contents`}
            title="View Details & Contents"
          >
            <ArrowUpRight size={15} />
          </Link>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="round-link"
            aria-label={`Preview ${template.title} in new tab`}
            title="Preview in new tab"
          >
            <Eye size={14} />
          </a>
          <a
            href={`/api/whatsapp?template=${encodeURIComponent(template.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="home-wa-icon"
            aria-label="Order or inquire on WhatsApp"
            title="Inquire on WhatsApp"
          >
            <WhatsAppIcon size={24} />
          </a>
        </div>
      </div>
    </article>
  );
}

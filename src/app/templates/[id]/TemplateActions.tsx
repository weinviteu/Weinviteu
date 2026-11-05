"use client";

import { useState } from "react";
import { Eye, Share2, Check } from "lucide-react";
import styles from "./template-detail.module.css";

/** Preview and Share, shown beside the price (desktop) and at the top of the page (mobile). */
export default function TemplateActions({ previewUrl, templateTitle, className = "" }: { previewUrl: string; templateTitle: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    // Phones get the native share sheet (WhatsApp, Instagram…); everything else copies the link.
    if (navigator.share) {
      try { await navigator.share({ title: `${templateTitle} | WeInviteU`, url }); } catch { /* dismissed */ }
      return;
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className={`${styles.templateActions} ${className}`}>
      <a href={previewUrl} target="_blank" rel="noopener noreferrer" className={styles.actionPreview} aria-label={`Preview ${templateTitle} full screen in a new tab`}>
        <Eye size={17} aria-hidden="true" /> <span className={styles.actionLabel}>Preview</span>
      </a>
      <button type="button" onClick={handleShare} className={styles.actionShare} aria-label={copied ? "Link copied" : `Share ${templateTitle}`}>
        {copied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}
        <span className={styles.actionLabel}>{copied ? "Copied" : "Share"}</span>
      </button>
    </div>
  );
}

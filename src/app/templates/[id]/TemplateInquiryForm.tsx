"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import styles from "./template-detail.module.css";
import WhatsAppIcon from "@/components/WhatsAppIcon";

interface Props {
  templateTitle: string;
  templatePrice: string;
  templateCategory: string;
}

export default function TemplateInquiryForm({
  templateTitle,
  templatePrice,
  templateCategory,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in your name, email, and WhatsApp number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          category: templateCategory,
          template_name: templateTitle,
          message: `Inquiry for ${templateTitle} (${templatePrice}). Event date: ${
            eventDate || "Not specified"
          }. ${message ? `Notes: ${message}` : ""}`.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry.");
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please connect via WhatsApp."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappUrl = `/api/whatsapp?template=${encodeURIComponent(
    templateTitle
  )}&text=${encodeURIComponent(
    `Hi WeInviteU! I submitted an inquiry for ${templateTitle} (${templatePrice}). My name is ${name || "a client"}.`
  )}`;

  if (submitted) {
    return (
      <div className={styles.formSuccess}>
        <CheckCircle2 size={54} color="#25D366" />
        <h3>Inquiry Received!</h3>
        <p>
          Thank you, <strong>{name}</strong>. Our senior invitation designer will contact you
          within 2 hours to begin customizing <strong>{templateTitle}</strong>.
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.btnWhatsAppPrimary}
          style={{ display: "inline-flex", margin: "10px auto 0" }}
        >
          <WhatsAppIcon size={20} /> Continue on WhatsApp Instantly <ArrowRight size={16} />
        </a>
      </div>
    );
  }

  return (
    <form className={styles.inquiryForm} onSubmit={handleSubmit}>
      {error && (
        <div
          style={{
            gridColumn: "span 2",
            padding: "12px 16px",
            background: "rgba(220, 53, 69, 0.15)",
            border: "1px solid rgba(220, 53, 69, 0.4)",
            color: "#ff8585",
            borderRadius: "10px",
            fontSize: "13.5px",
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label className={styles.formLabel} htmlFor="inq-name">
          Your Full Name *
        </label>
        <input
          id="inq-name"
          type="text"
          className={styles.formInput}
          placeholder="e.g. Priya Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className={styles.formLabel} htmlFor="inq-phone">
          WhatsApp / Phone Number *
        </label>
        <input
          id="inq-phone"
          type="tel"
          className={styles.formInput}
          placeholder="+91 98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <div>
        <label className={styles.formLabel} htmlFor="inq-email">
          Email Address *
        </label>
        <input
          id="inq-email"
          type="email"
          className={styles.formInput}
          placeholder="priya@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label className={styles.formLabel} htmlFor="inq-date">
          Tentative Event Date
        </label>
        <input
          id="inq-date"
          type="date"
          className={styles.formInput}
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
      </div>

      <div className={styles.formGroupFull}>
        <label className={styles.formLabel} htmlFor="inq-notes">
          Customization Notes or Questions (Optional)
        </label>
        <textarea
          id="inq-notes"
          className={styles.formTextarea}
          placeholder="Tell us about your celebration, preferred music, color theme, or any custom ceremony requirements..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={styles.formSubmitBtn}
      >
        {submitting ? "Submitting Inquiry..." : `Order / Inquire for ${templateTitle} (${templatePrice})`}
      </button>
    </form>
  );
}

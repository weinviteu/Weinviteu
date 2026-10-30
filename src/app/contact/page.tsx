"use client";

import PageBanner from "@/components/PageBanner";
import { useState, useEffect } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import styles from "./contact.module.css";
import type { Category } from "@/lib/models";

export default function ContactPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "Wedding",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [settings, setSettings] = useState({
    studio_name: "",
    contact_email: "",
    whatsapp_number: "",
    location: ""
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setSettings(data);
          setSettingsLoaded(true);
        }
      })
      .catch(console.error);

    fetch("/api/categories")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          setFormData(prev => ({ ...prev, category: data[0].name }));
        }
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          category: formData.category,
          template_name: formData.category,
          message: formData.message
        })
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "Failed to submit inquiry");
      }

      setSubmitted(true);
      setFormData({ name: "", email: "", category: categories[0]?.name || "Wedding", message: "" });
    } catch (err: unknown) {
      alert("Something went wrong. Please try again or reach us on WhatsApp.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.contactPage}>
      <PageBanner crumb="Contact Us" eyebrow="LET’S MAKE SOMETHING PERSONAL" title="Your celebration." accent="Our next creation." description="Tell us what you’re dreaming of. From choosing a template to creating the finishing touches, we’re here to bring your invitation to life." posters={["/template-posters/baby-shower-moonlit-wishes.webp", "/template-posters/opening-ceremony-the-grand-reveal.webp", "/template-posters/birthday-golden-wish.webp", "/template-posters/baby-naming-little-star.webp", "/template-posters/traditional-sacred-beginnings.webp"]} />

      {/* Grid */}
      <div className={styles.contactGrid}>

        {/* Left: Contact Info */}
        <div className={styles.contactInfo}>
          <h2>Reach Out</h2>
          <p>We&apos;d love to hear from you. Our team is available to answer any questions you might have about our 3D interactive invitations.</p>

          {/* The layout is shown straight away with placeholder bars, so nothing moves when details arrive. */}
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>
              <Mail size={18} />
            </div>
            <div>
              <h3>Email</h3>
              {settingsLoaded ? <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a> : <span className={styles.pending} />}
            </div>
          </div>

          {(!settingsLoaded || settings.whatsapp_number) && <div className={styles.infoItem}>
            <div className={styles.infoIcon}>
              <Phone size={18} />
            </div>
            <div>
              <h3>Phone</h3>
              {settingsLoaded ? <a href={`tel:${settings.whatsapp_number.replace(/\s+/g, '')}`}>{settings.whatsapp_number}</a> : <span className={styles.pending} />}
            </div>
          </div>}

          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>
              <MapPin size={18} />
            </div>
            <div>
              <h3>Studio</h3>
              {settingsLoaded ? <p>{settings.studio_name}<br />{settings.location}</p> : <p><span className={styles.pending} /><br /><span className={styles.pending} /></p>}
            </div>
          </div>

          {(!settingsLoaded || settings.whatsapp_number) && <div className={styles.whatsappPromo}>
            <p>Looking for a quick response?</p>
            <a href={settingsLoaded ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}` : "/api/whatsapp"} target="_blank" rel="noopener noreferrer" className={styles.waButton}>
              <WhatsAppIcon size={18} />
              Chat on WhatsApp
            </a>
          </div>}
        </div>

        {/* Right: Contact Form */}
        <div className={styles.contactForm}>
          <h2>Send a Message</h2>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <CheckCircle size={48} color="var(--gold)" style={{ marginBottom: "20px" }} />
              <h3 style={{ fontSize: "20px", marginBottom: "10px" }}>Thank you!</h3>
              <p style={{ color: "var(--muted)", lineHeight: 1.7, marginBottom: "25px" }}>
                We&apos;ve received your inquiry and will get back to you within 24 hours.
                You can also track your order status once we begin working on your invitation.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className={styles.submitButton}
                style={{ maxWidth: "200px", margin: "0 auto" }}
              >
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Your Name</label>
                <input
                  type="text" id="name" placeholder="E.g., Ananya & Rahul" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email" id="email" placeholder="you@example.com" required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category">Occasion / Invitation Category</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  {categories.length === 0 && (
                    <>
                      <option value="Wedding">Wedding</option>
                      <option value="Birthday">Birthday</option>
                      <option value="Baby Shower">Baby Shower</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Anniversary">Anniversary</option>
                    </>
                  )}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message">How can we help?</label>
                <textarea
                  id="message" rows={5} placeholder="Tell us about your event and what you're looking for..." required
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>

              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"} <Send size={15} />
              </button>
            </form>
          )}
        </div>

      </div>
    </main>
  );
}

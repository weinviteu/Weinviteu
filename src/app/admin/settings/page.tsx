"use client";

import { useState, useEffect } from "react";
import styles from "../admin.module.css";
import { Save, Loader2, Building, Mail, Phone, MapPin, CheckCircle, Info, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    studio_name: "",
    contact_email: "",
    whatsapp_number: "",
    location: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load studio settings. Please refresh.');
        setSettings(await response.json());
      })
      .catch((error) => {
        setMessage(error.message);
        setIsError(true);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage("Studio settings successfully updated and live.");
        setIsError(false);
        setTimeout(() => setMessage(""), 4000);
      } else {
        const result = await res.json();
        setMessage(result.error || "Failed to update studio settings.");
        setIsError(true);
      }
    } catch {
      setMessage("Network error occurred while saving settings.");
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "16px" }}>
        <Loader2 className={styles.spinner} size={32} color="var(--gold)" />
        <span style={{ color: "var(--muted)", fontSize: "13px" }}>Loading studio configuration…</span>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>Studio Settings</h2>
          <p>Configure your brand identity, primary studio contact channels & WhatsApp concierge.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {message && (
            <span
              style={{
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: isError ? "#f87171" : "#34d399",
                background: isError ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                padding: "6px 12px",
                borderRadius: "6px",
                border: isError ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              {!isError && <CheckCircle size={14} />}
              {message}
            </span>
          )}
          <button
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className={styles.spinner} size={15} /> : <Save size={15} />}
            <span>{isSaving ? "Publishing Changes…" : "Save Studio Settings"}</span>
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) minmax(280px, 360px)", gap: "28px", alignItems: "start" }}>
        {/* Main Settings Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader} style={{ marginBottom: "26px" }}>
            <h3>Brand & Contact Credentials</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, color: "rgba(255, 255, 255, 0.85)" }}>
                <Building size={14} color="var(--gold)" />
                <span>Studio Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g. WeInviteU Design Studio"
                value={settings.studio_name || ""}
                onChange={(e) => setSettings({ ...settings, studio_name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.035)",
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <p style={{ fontSize: "11.5px", color: "var(--muted)", margin: "6px 0 0" }}>
                Displays on the public website footer, page metadata, and client invitations.
              </p>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, color: "rgba(255, 255, 255, 0.85)" }}>
                <Mail size={14} color="var(--gold)" />
                <span>Executive Contact Email</span>
              </label>
              <input
                type="email"
                placeholder="hello@weinviteu.com"
                value={settings.contact_email || ""}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.035)",
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <p style={{ fontSize: "11.5px", color: "var(--muted)", margin: "6px 0 0" }}>
                Used for client communication, inquiries, and outbound invitation delivery.
              </p>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, color: "rgba(255, 255, 255, 0.85)" }}>
                <Phone size={14} color="var(--gold)" />
                <span>WhatsApp Concierge Number</span>
              </label>
              <input
                type="text"
                placeholder="Enter your real number with country code"
                value={settings.whatsapp_number || ""}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.035)",
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <p style={{ fontSize: "11.5px", color: "var(--muted)", margin: "6px 0 0" }}>
                Enter your real WhatsApp number with country code. The demo number is hidden from visitors. Leave blank to disable direct WhatsApp contact.
              </p>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, color: "rgba(255, 255, 255, 0.85)" }}>
                <MapPin size={14} color="var(--gold)" />
                <span>Atelier Location</span>
              </label>
              <input
                type="text"
                placeholder="Bangalore, India"
                value={settings.location || ""}
                onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.035)",
                  color: "#fff",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <p style={{ fontSize: "11.5px", color: "var(--muted)", margin: "6px 0 0" }}>
                Shown on the footer and contact sections to establish trust and studio authenticity.
              </p>
            </div>
          </div>
        </div>

        {/* Live Propagation Info Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className={styles.card} style={{ padding: "26px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <Info size={18} color="var(--gold)" />
              <h3 style={{ margin: 0, fontFamily: "var(--serif)", fontSize: "17px", color: "#fff" }}>
                Instant Synchronization
              </h3>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "12.5px", lineHeight: 1.6, margin: "0 0 16px" }}>
              Changes saved here instantly update:
            </p>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "rgba(255, 255, 255, 0.75)", fontSize: "12.5px", lineHeight: 1.8 }}>
              <li>Global website footer across all pages</li>
              <li>Dedicated contact & booking page</li>
              <li>One-tap WhatsApp inquiry redirection</li>
              <li>Email header attribution for invitations</li>
            </ul>
          </div>

          <div className={styles.card} style={{ padding: "22px", background: "rgba(212, 175, 55, 0.05)", borderColor: "rgba(212, 175, 55, 0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--gold)", marginBottom: "8px" }}>
              <ShieldCheck size={16} />
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                Security Notice
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)", lineHeight: 1.6 }}>
              Only authenticated administrators with the <code style={{ color: "#fff", background: "rgba(255,255,255,0.1)", padding: "2px 5px", borderRadius: "4px" }}>admin</code> role can modify studio credentials in Supabase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

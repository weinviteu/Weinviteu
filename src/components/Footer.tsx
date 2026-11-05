"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Heart,
  Mail,
  Phone,
  MapPin,
  Instagram,
} from "lucide-react";
import { SITE_TAGLINE } from "@/lib/seo";


import { useState, useEffect } from "react";

const INSTAGRAM_URL = "https://www.instagram.com/weinvite_u";
const INSTAGRAM_HANDLE = "@weinvite_u";

export default function Footer() {
  const path = usePathname();
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
  }, []);

  if (path.startsWith("/invite/") || path.startsWith("/admin")) return null;
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link
            className="footer-wordmark"
            href="/"
            aria-label="WeInviteU home"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <img
              src="/images/logo.png"
              alt="WeInviteU"
              style={{ width: "46px", height: "auto", borderRadius: "9px", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
            />
            <div className="footer-wordmark-name">
              WeInviteU
              <small>{SITE_TAGLINE}</small>
            </div>
          </Link>
          <p>
            A beautiful beginning for every celebration. Personal invitations,
            meaningful details, and all your favourite people.
          </p>
          <span className="footer-signoff">
            <Heart size={13} /> Made for moments that matter.
          </span>
          <a className="footer-instagram" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label={`Follow WeInviteU on Instagram, ${INSTAGRAM_HANDLE}`}>
            <span className="footer-instagram-icon" aria-hidden="true"><Instagram size={18} strokeWidth={1.9} /></span>
            <span className="footer-instagram-text">
              <small>Follow us on Instagram</small>
              {INSTAGRAM_HANDLE}
            </span>
            <ArrowUpRight size={14} className="footer-instagram-arrow" aria-hidden="true" />
          </a>
        </div>
        <nav className="footer-column" aria-label="Explore WeInviteU">
          <h2>Explore</h2>
          <Link href="/">Home</Link>
          <Link href="/about">Our story</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/contact">Contact Us</Link>
        </nav>
        <nav className="footer-column" aria-label="Services">
          <h2>Occasions</h2>
          <Link href="/templates?category=wedding">Weddings</Link>
          <Link href="/templates?category=birthday">Birthdays</Link>
          <Link href="/templates?category=baby-shower">Baby Showers</Link>
          <Link href="/templates?category=traditional">Traditional</Link>
        </nav>
        <nav className="footer-column" aria-label="Legal">
          <h2>Legal</h2>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms & Conditions</Link>
          <Link href="/contact">Support</Link>
        </nav>
        <div className="footer-column footer-contact">
          <h2>Let&apos;s connect</h2>
          {settingsLoaded ? (
            <>
              <span className="demo-contact-label">CONTACT DETAILS</span>
              <a href={`mailto:${settings.contact_email}`}>
                <Mail size={14} /> {settings.contact_email}
              </a>
              {settings.whatsapp_number && <a href={`tel:${settings.whatsapp_number.replace(/\s+/g, '')}`}>
                <Phone size={14} /> {settings.whatsapp_number}
              </a>}
              <span>
                <MapPin size={14} /> {settings.location}
              </span>
            </>
          ) : (
            <span style={{ fontSize: "13px", opacity: 0.5 }}>Loading contact details…</span>
          )}

        </div>
      </div>
      <div className="footer-bottom">
        <small>
          © {new Date().getFullYear()} WeInviteU. All rights reserved.
        </small>
        <span className="developer-credit">
          Designed and Powered by{" "}
          <a
            href="https://rakvih.in/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Rakvih Solutions <ArrowUpRight size={12} />
          </a>
        </span>
        <Link href="#content">Back to top ↑</Link>
      </div>
    </footer>
  );
}

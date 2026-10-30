"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  ArrowUpRight,
  ArrowRight,
  MessageSquare,
  Home,
  LayoutGrid,
  Sparkles,
  Mail,
  ChevronRight,
  Star
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";

export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [path]);

  // Monitor scroll position to apply elevated header style on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open to prevent background scrolling
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (path.startsWith("/invite/") || path.startsWith("/admin")) return null;

  const navLinks = [
    { href: "/", label: "Home", icon: Home, subtitle: "Main landing page" },
    { href: "/templates", label: "Templates", icon: LayoutGrid, subtitle: "Explore 3D designs", badge: "Popular" },
    { href: "/about", label: "About Us", icon: Sparkles, subtitle: "Our craft & vision" },
    { href: "/contact", label: "Contact Us", icon: Mail, subtitle: "Custom inquiries" },
  ];

  return (
    <>
      <header className={`header ${scrolled ? "is-scrolled" : ""} ${open ? "menu-open" : ""}`}>
        <Link href="/" className="logo" onClick={() => setOpen(false)}>
          <img
            src="/images/logo.png"
            alt="WeInviteU"
            className="logo-img"
          />
          <span className="brand-name">
            WeInviteU<small>A LITTLE MORE PERSONAL</small>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="header-nav-wrap">
          <nav className="desktop-navigation" aria-label="Main navigation">
            {navLinks.map(({ href, label }) => {
              const isActive = href === "/" ? path === href : path.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="nav-label">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="header-cta-group">
            <a
              href="/api/whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="header-cta whatsapp"
              aria-label="Chat on WhatsApp"
            >
              <WhatsAppIcon size={18} />
              <span>WhatsApp</span>
            </a>
            <Link href="/contact" className="header-cta primary">
              <span>Get in Touch</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>

        {/* Mobile Header Quick Actions & Hamburger Button */}
        <div className="mobile-header-actions">
          <a
            href="/api/whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-top-whatsapp"
            aria-label="Chat on WhatsApp"
          >
            <WhatsAppIcon size={17} />
            <span className="mobile-top-whatsapp-text">Chat</span>
          </a>

          <button
            className={`icon-button mobile-menu ${open ? "is-active" : ""}`}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      <div
        className={`mobile-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Navigation Drawer */}
      <nav
        id="mobile-navigation"
        className={`mobile-navigation ${open ? "open" : ""}`}
        aria-label="Mobile navigation"
      >
        <div className="mobile-nav-inner">
          <div className="mobile-nav-header-tag">
            <span>MAIN NAVIGATION</span>
            <div className="mobile-nav-tag-line" />
          </div>

          <div className="mobile-nav-links">
            {navLinks.map(({ href, label, icon: Icon, subtitle, badge }) => {
              const isActive = href === "/" ? path === href : path.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`mobile-nav-link ${isActive ? "active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <div className="mobile-nav-link-left">
                    <div className="mobile-nav-icon-box">
                      <Icon size={18} />
                    </div>
                    <div className="mobile-nav-text-group">
                      <div className="mobile-nav-label-row">
                        <span className="mobile-nav-title">{label}</span>
                        {badge && <span className="mobile-nav-badge">{badge}</span>}
                      </div>
                      <span className="mobile-nav-subtitle">{subtitle}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="mobile-nav-arrow" />
                </Link>
              );
            })}
          </div>

          <div className="mobile-cta-section">
            <div className="mobile-cta-card">
              <div className="mobile-cta-card-header">
                <span className="mobile-cta-card-title">CUSTOM DESIGN & INQUIRIES</span>
                <span className="mobile-cta-card-status">
                  <span className="pulse-dot" /> Online
                </span>
              </div>
              <p className="mobile-cta-card-desc">
                Need a tailored 3D digital invitation or instant custom edit? Talk directly with our team.
              </p>

              <div className="mobile-cta-group">
                <a
                  href="/api/whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-nav-cta whatsapp"
                  onClick={() => setOpen(false)}
                >
                  <WhatsAppIcon size={18} />
                  <span>WhatsApp Chat</span>
                </a>
                <Link
                  href="/contact"
                  className="mobile-nav-cta primary"
                  onClick={() => setOpen(false)}
                >
                  <MessageSquare size={16} />
                  <span>Get in Touch</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          <div className="mobile-nav-footer">
            <Star size={11} className="star" />
            <span>Handcrafted 3D Digital Invitations</span>
            <Star size={11} className="star" />
          </div>
        </div>
      </nav>
    </>
  );
}

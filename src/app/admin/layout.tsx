"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LayoutTemplate,
  Settings,
  LogOut,
  Search,
  ExternalLink,
  Wand2,
  Sparkles,
  MessageSquare,
  Layers,
  Tag,
  Menu,
  X
} from "lucide-react";
import styles from "./admin.module.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  // Phones and tablets: the sidebar is a drawer opened from the ☰ button.
  // It remembers the page it was opened on, so moving to another page closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuOpen = openOn === path;
  const setMenuOpen = (open: boolean) => setOpenOn(open ? path : null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    closeBtn.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      menuBtn.current?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    await fetch("/api/admin-auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  const navManagement = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/inquiries", label: "Client Inquiries", icon: MessageSquare },
    { href: "/admin/orders", label: "Orders & Drafts", icon: Layers },
    { href: "/admin/templates", label: "Template Library", icon: LayoutTemplate },
    { href: "/admin/categories", label: "Categories", icon: Tag },
  ];

  const navCreative = [
    { href: "/admin/customize", label: "Customizer", icon: Wand2 },
    { href: "/admin/settings", label: "Studio Settings", icon: Settings },
  ];

  if (path === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className={styles.adminLayout}>
      {/* ── Atelier Sidebar (a slide-out drawer on phones and tablets) ── */}
      <div className={`${styles.drawerBackdrop} ${menuOpen ? styles.open : ""}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <aside id="admin-sidebar" className={`${styles.sidebar} ${menuOpen ? styles.open : ""}`} aria-label="Admin menu">
        <div className={styles.sidebarHeader}>
          <Link href="/admin" className={styles.brandLink}>
            <div className={styles.brandLogoWrapper}>
              <img
                src="/images/logo.png"
                alt="WeInviteU Emblem"
                style={{ width: "28px", height: "auto", borderRadius: "6px" }}
              />
            </div>
            <div className={styles.brandTitleGroup}>
              <span className={styles.brandName}>WeInviteU</span>
              <span className={styles.brandTag}>ATELIER STUDIO</span>
            </div>
          </Link>
          <div className={styles.studioStatus}>
            <span className={styles.statusDot} />
            <span>Studio Engine Active</span>
          </div>
          <button ref={closeBtn} type="button" className={styles.drawerClose} onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className={styles.navLinks} aria-label="Admin Navigation">
          <span className={styles.navSectionLabel}>Management</span>
          {navManagement.map((item) => {
            const Icon = item.icon;
            const isActive = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <span className={styles.navSectionLabel}>Creation & Config</span>
          {navCreative.map((item) => {
            const Icon = item.icon;
            const isActive = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" target="_blank" rel="noopener noreferrer" className={styles.liveSiteBtn}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={13} color="var(--gold)" />
              <span>Preview Live Site</span>
            </span>
            <ExternalLink size={13} />
          </Link>

          <div className={styles.profileCard}>
            <div className={styles.profileInfo}>
              <div className={styles.profileAvatar}>W</div>
              <div className={styles.profileText}>
                <span className={styles.profileName}>Studio Director</span>
                <span className={styles.profileRole}>Administrator</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className={styles.signOutBtn}
              title="Sign Out"
              aria-label="Sign Out of Admin"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className={styles.mainContent}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button
            ref={menuBtn}
            type="button"
            className={styles.menuBtn}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar"
          >
            <Menu size={20} />
          </button>
          <form action="/admin/orders" className={styles.topbarSearch}>
            <Search size={16} className={styles.searchIcon} />
            <input
              name="q"
              aria-label="Search orders"
              type="search"
              placeholder="Search clients, invitations..."
            />
            <span className={styles.shortcutBadge}>⌘K</span>
          </form>

          <div className={styles.topbarActions}>
            <Link href="/admin/customize" className={styles.topbarQuickBtn} aria-label="Create Invitation">
              <Wand2 size={14} />
              <span>Create Invitation</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.pageContent}>{children}</div>
      </main>
    </div>
  );
}

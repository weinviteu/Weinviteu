import styles from "../legal.module.css";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Database,
  Wand2,
  Lock,
  EyeOff,
  Cookie,
  Clock,
  UserCheck,
  Shield,
  RefreshCw,
  Calendar,
  Sparkles,
  Mail,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How WeInviteU collects, uses and protects your personal information, photos and event details when you inquire about or order a 3D digital invitation.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    id: "collection",
    num: "01",
    icon: Database,
    title: "Information We Collect",
    content: "We collect information you provide directly to us when placing an inquiry or customizing an invitation. This includes your name, email address, phone number, event dates, venue addresses, personal RSVP preferences, and media uploads (photos and background music) necessary to render your digital 3D invitation.",
    takeaway: "We only collect details essential to crafting and delivering your personalized invitation."
  },
  {
    id: "usage",
    num: "02",
    icon: Wand2,
    title: "How We Use Your Information",
    content: "The details you submit are utilized exclusively to build and host your custom interactive 3D invitation, communicate with you regarding design revisions or status updates, and ensure smooth delivery to your invited guests.",
    takeaway: "Your event data is never used for advertising profiling or unsolicited promotions."
  },
  {
    id: "storage",
    num: "03",
    icon: Lock,
    title: "Data Storage & Security",
    content: "We enforce high-standard encryption and security protocols to safeguard your personal data, host environment, and media assets. Our servers prevent unauthorized access, tampering, or data leaks.",
    takeaway: "Enterprise-grade storage keeps your family event media secure."
  },
  {
    id: "third-party",
    num: "04",
    icon: EyeOff,
    title: "Third-Party Sharing & Non-Disclosure",
    content: "We strictly do NOT sell, rent, trade, or monetize your personal identification data or family media with third-party brokers or advertisers. We only integrate with trusted infrastructure providers (such as secure cloud hosting and transactional email services) strictly for order fulfillment.",
    takeaway: "Zero data selling. Period."
  },
  {
    id: "media",
    num: "05",
    icon: FileText,
    title: "Media & Content Privacy",
    content: "Photos and custom text uploaded for your invitation are rendered into your private invitation link. Since your customized website link is distributed to your invited guests, the privacy of the invitation ultimately relies on how you choose to share your link.",
    takeaway: "Your invitation URL is unlisted and accessible only by those who receive your link."
  },
  {
    id: "cookies",
    num: "06",
    icon: Cookie,
    title: "Cookies & Local Storage",
    content: "Our website uses essential browser storage and cookies to remember your session preferences, customizer draft state, and interactive audio playback settings. We do not place intrusive cross-site tracking cookies.",
    takeaway: "Only essential cookies are used for customizer state and guest experience."
  },
  {
    id: "retention",
    num: "07",
    icon: Clock,
    title: "Data Retention Policy",
    content: "We maintain your active invitation link and uploaded event media on our servers for up to 3 months following your specified event date. This guarantees seamless access for all your guests through your celebration. Following this retention window, data may be securely archived or purged.",
    takeaway: "Guaranteed live hosting up to 3 months post-event date."
  },
  {
    id: "rights",
    num: "08",
    icon: UserCheck,
    title: "Your Rights & Data Control",
    content: "You retain total control over your personal data. At any time prior to or after your event, you can request a copy of stored data, update invitation details, or request immediate permanent deletion of your hosted invitation and assets.",
    takeaway: "Request edit, export, or permanent deletion anytime by contacting support."
  },
  {
    id: "children",
    num: "09",
    icon: Shield,
    title: "Children's Privacy",
    content: "Our platform services are not targeted at children under 13. While invitations may celebrate milestone events (such as birthdays or baby showers), all account creations, customizations, and orders must be managed by an adult parent or guardian.",
    takeaway: "All orders and customization permissions are handled by adult account holders."
  },
  {
    id: "updates",
    num: "10",
    icon: RefreshCw,
    title: "Changes to This Privacy Policy",
    content: "WeInviteU reserves the right to refine or update this Privacy Policy to reflect technical upgrades or legal requirements. Any updates will be reflected with a revised date stamp at the header of this page.",
    takeaway: "Policy changes are documented here with transparent revision dates."
  }
];

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.legalPage}>
      {/* Hero Header */}
      <header className={styles.heroSection}>
        <div className={styles.eyebrowBadge}>
          <ShieldCheck size={14} /> Data Protection & Privacy
        </div>
        <h1 className={styles.heroTitle}>
          Privacy <em>Policy</em>
        </h1>
        <p className={styles.heroSubtitle}>
          At WeInviteU, we treat your personal event details, client messages, and family memories with the highest level of security and respect.
        </p>

        <div className={styles.metaRow}>
          <span className={styles.metaChip}>
            <Calendar size={13} color="var(--gold)" /> Last Updated: October 2026
          </span>
          <span className={styles.metaChip}>
            <Sparkles size={13} color="var(--gold)" /> 4 min read
          </span>
        </div>
      </header>

      {/* Tab Navigation Bar */}
      <div className={styles.tabSwitchContainer}>
        <div className={styles.tabSwitch}>
          <Link href="/privacy" className={`${styles.tabBtn} ${styles.tabBtnActive}`}>
            <ShieldCheck size={14} /> Privacy Policy
          </Link>
          <Link href="/terms" className={styles.tabBtn}>
            <FileText size={14} /> Terms & Conditions
          </Link>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={styles.legalLayout}>
        {/* Quick Navigation Sidebar */}
        <aside className={styles.stickySidebar}>
          <div className={styles.sidebarTitle}>Page Sections</div>
          <nav className={styles.navGroup}>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className={styles.navLink}>
                <span className={styles.navNumber}>{s.num}</span>
                <span>{s.title}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Content Section Cards */}
        <div className={styles.contentStack}>
          {sections.map((s) => {
            const IconComp = s.icon;
            return (
              <article key={s.id} id={s.id} className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.iconBox}>
                    <IconComp size={20} />
                  </div>
                  <div className={styles.sectionTitleGroup}>
                    <span className={styles.numBadge}>SECTION {s.num}</span>
                    <h2 className={styles.sectionTitle}>{s.title}</h2>
                  </div>
                </div>

                <div className={styles.sectionBody}>
                  <p>{s.content}</p>
                </div>

                <div className={styles.takeawayBox}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px", color: "var(--gold)" }} />
                  <div>
                    <strong>Key Takeaway: </strong>
                    <span>{s.takeaway}</span>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Support Banner */}
          <div className={styles.supportBanner}>
            <div className={styles.supportText}>
              <h3>Have Privacy Questions?</h3>
              <p>Our team is available to assist with data requests, custom media removal, or security inquiries.</p>
            </div>
            <div className={styles.supportActions}>
              <Link href="/contact" className={styles.supportBtn}>
                <Mail size={14} /> Contact Support <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

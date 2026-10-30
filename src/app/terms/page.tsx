import styles from "../legal.module.css";
import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  User,
  CreditCard,
  Edit3,
  Globe,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Mail,
  ArrowRight,
  Scale
} from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that apply when you browse, order and share a WeInviteU 3D digital invitation — ordering, personalisation, payment, delivery, revisions and acceptable use.",
  alternates: { canonical: "/terms" },
};

const termsSections = [
  {
    id: "acceptance",
    num: "01",
    icon: CheckCircle2,
    title: "Acceptance of Terms",
    content: "By accessing, browsing, or placing an order on WeInviteU, you agree to be bound by these Terms and Conditions. If you do not agree to all terms stated herein, please refrain from utilizing our website and customizer services.",
    takeaway: "Using WeInviteU platform services constitutes your agreement to these terms."
  },
  {
    id: "service",
    num: "02",
    icon: Sparkles,
    title: "Service Description & Delivery",
    content: "WeInviteU provides premium 3D digital invitations and bespoke design customization. Our service delivers a unique, mobile-optimized web link hosting your interactive invitation with customized 3D animation, guest audio, RSVP features, and directions.",
    takeaway: "The final deliverable is a secure, interactive web link customized for your event."
  },
  {
    id: "responsibilities",
    num: "03",
    icon: User,
    title: "User Responsibilities & Content Submissions",
    content: "You are responsible for submitting accurate event information (names, dates, times, venues) and media uploads (photos/music). You warrant that you own or have explicit rights to use any photos or music files uploaded to your invitation.",
    takeaway: "Ensure you hold permissions for all uploaded photos and audio files."
  },
  {
    id: "intellectual",
    num: "04",
    icon: ShieldCheck,
    title: "Intellectual Property Rights",
    content: "All 3D assets, animations, customizer code, design artwork, and templates rendered on WeInviteU remain the exclusive intellectual property of WeInviteU. Ordering an invitation grants you a non-transferable license to share the custom invitation link with your event guests, not ownership of the underlying design or code assets.",
    takeaway: "Purchasing grants a sharing license for your personal event, not code or asset ownership."
  },
  {
    id: "payment",
    num: "05",
    icon: CreditCard,
    title: "Payment & Pricing",
    content: "All template customization pricing and packages are clearly displayed on our platform. Payment must be cleared prior to final published link delivery. We reserve the right to modify template pricing for new orders at any time.",
    takeaway: "Full payment is required prior to final customized link delivery."
  },
  {
    id: "revisions",
    num: "06",
    icon: Edit3,
    title: "Revisions & Customization Policy",
    content: "Standard invitation packages include up to 2 rounds of text, typo, date, and photo adjustments prior to final publishing. Major structural layout shifts or custom feature additions requested beyond standard templates may incur additional design fees.",
    takeaway: "Includes up to 2 complimentary rounds of text/photo revisions."
  },
  {
    id: "hosting",
    num: "07",
    icon: Globe,
    title: "Delivery & 3-Month Active Hosting",
    content: "Your customized 3D invitation link is hosted on our high-speed global servers. We guarantee 99.9% uptime for a period of up to 3 months following your specified event date, after which links may be archived.",
    takeaway: "Guaranteed high-speed hosting active up to 3 months post-event date."
  },
  {
    id: "refunds",
    num: "08",
    icon: RefreshCw,
    title: "Refunds & Cancellation Policy",
    content: "Due to the personalized, custom digital nature of our invitation products, orders are non-refundable once our design team has commenced customization. If you need to cancel prior to work starting, a partial refund may be issued.",
    takeaway: "Digital customized orders are non-refundable once design work has begun."
  },
  {
    id: "liability",
    num: "09",
    icon: AlertTriangle,
    title: "Limitation of Liability",
    content: "WeInviteU shall not be held liable for any indirect, incidental, or consequential damages resulting from internet outages on guest devices, incorrect event details provided by the client, or third-party web browser incompatibilities.",
    takeaway: "WeInviteU is not liable for incorrect client-submitted details or guest device network issues."
  },
  {
    id: "modifications",
    num: "10",
    icon: FileText,
    title: "Modifications to Terms",
    content: "WeInviteU reserves the right to revise these Terms and Conditions at any time. Updated terms will be posted directly to this page with an updated timestamp. Continued usage of our services after updates signifies acceptance.",
    takeaway: "Updated terms are posted here transparently."
  }
];

export default function TermsPage() {
  return (
    <main className={styles.legalPage}>
      {/* Hero Header */}
      <header className={styles.heroSection}>
        <div className={styles.eyebrowBadge}>
          <Scale size={14} /> Legal Agreement
        </div>
        <h1 className={styles.heroTitle}>
          Terms & <em>Conditions</em>
        </h1>
        <p className={styles.heroSubtitle}>
          Please read these terms and conditions carefully before using WeInviteU digital invitation services.
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
          <Link href="/privacy" className={styles.tabBtn}>
            <ShieldCheck size={14} /> Privacy Policy
          </Link>
          <Link href="/terms" className={`${styles.tabBtn} ${styles.tabBtnActive}`}>
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
            {termsSections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className={styles.navLink}>
                <span className={styles.navNumber}>{s.num}</span>
                <span>{s.title}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Content Section Cards */}
        <div className={styles.contentStack}>
          {termsSections.map((s) => {
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
              <h3>Need Further Legal Clarification?</h3>
              <p>Our team is available to assist with custom licensing requests or terms questions.</p>
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

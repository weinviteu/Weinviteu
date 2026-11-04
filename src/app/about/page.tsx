import PageBanner from "@/components/PageBanner";
import Link from "next/link";
import type React from "react";
import { ArrowUpRight, Briefcase, Building2, Code2, Cpu, Eye, GraduationCap, Megaphone, Search, Send, ShoppingCart, Sparkles, Target } from "lucide-react";
import styles from "./about.module.css";
import { pageOpenGraph } from "@/lib/seo";
import type { Metadata } from "next";
import "../home-refresh.css";
import { Faq, WhyDigital, loadCatalogueSummary } from "@/components/home/SharedSections";

export const metadata: Metadata = {
  title: "About Us – The Studio Behind Your 3D Digital Invitations",
  description: "WeInviteU is a modern digital invitation platform by RAKVIH Solutions Private Limited, crafting 3D digital invitations for weddings, engagements, birthdays, anniversaries, family gatherings and special occasions across India.",
  alternates: { canonical: "/about" },
  openGraph: pageOpenGraph({ url: "/about", title: "About WeInviteU – The Studio Behind Your 3D Digital Invitations" }),
};

export const revalidate = 0;

const philosophy = [
  { title: "Emotion in Motion", text: "We grew tired of seeing beautiful celebrations announced through static, lifeless images. Your special day deserves an introduction that captures its true essence and scale through immersive 3D technology." },
  { title: "Meticulous Craft", text: "Every template in our studio is meticulously crafted by professional designers. From elegant typography to fluid motion, we ensure that whether you are planning a grand wedding or an intimate baby shower, your story is told beautifully." },
  { title: "Effortless Joy", text: "While our technology is complex, your experience should be seamless. We handle all the customization and hosting, providing you with a simple, elegant link that works perfectly across all devices and sharing platforms." },
];

const steps = [
  { icon: Search, title: "Browse & Choose", text: "Explore our curated collection and preview any template live in your browser — fully interactive, nothing hidden." },
  { icon: Sparkles, title: "Personalise", text: "We customise the template with your names, dates, venue, photos and everything that makes it yours." },
  { icon: Send, title: "Share & Celebrate", text: "Get a unique link to share with your guests via WhatsApp, Instagram or any way you love. Simple as that." },
];

const capabilities = [
  { icon: Code2, label: "Web & Software Development" },
  { icon: Cpu, label: "Digital Solutions & Technology" },
  { icon: ShoppingCart, label: "E-commerce & Online Platforms" },
  { icon: Briefcase, label: "Business Consulting & Solutions" },
  { icon: Building2, label: "Construction & Development" },
  { icon: Megaphone, label: "Digital Marketing & Branding" },
  { icon: GraduationCap, label: "Training & Development" },
];

/** Eyebrow, two-line serif heading and optional lede, the same heading the home page uses. */
function SectionHead({ eyebrow, title, accent, lede, center = false }: { eyebrow: string; title: string; accent: string; lede?: React.ReactNode; center?: boolean }) {
  return (
    <header className={`hx-head${center ? " hx-head-center" : ""}`}>
      <div>
        <p className="hx-eyebrow"><span aria-hidden="true" />{eyebrow}{center && <span aria-hidden="true" />}</p>
        <h2>{title} <em>{accent}</em></h2>
        {lede && <p className="hx-lede">{lede}</p>}
      </div>
    </header>
  );
}

export default async function AboutPage() {
  const { startingPrice } = await loadCatalogueSummary();
  return (
    <main className={`${styles.aboutPage} home-redesign hx-scope`}>
      <PageBanner crumb="About Us" eyebrow="ABOUT WEINVITEU" title="Every celebration" accent="begins with an invitation." description="An invitation is more than just an announcement — it's the first glimpse of a celebration, a reflection of your style, and the beginning of memories that last a lifetime." />

      {/* ── 1. Who we are ── */}
      <section className="hx-section">
        <div className={`hx-wrap ${styles.intro}`}>
          <div className={styles.introArt}>
            <div className={styles.imageFrame}>
              <img src="/images/about_studio.webp" alt="WeInviteU Design Studio" width={800} height={1000} />
            </div>
            <div className={styles.imageBadge} aria-hidden="true">EST. 2026 • DESIGN STUDIO •</div>
          </div>
          <div className={styles.introText}>
            <SectionHead eyebrow="Who we are" title="Your moments. Your style." accent="Your invitation." />
            <p>At WeInviteU, we believe every special moment deserves a beautiful beginning. WeInviteU is a modern digital invitation platform created to make inviting, celebrating and connecting easier, more creative and more meaningful.</p>
            <p>From weddings and engagements to birthdays, anniversaries, family gatherings and special occasions, we bring creativity and convenience together to help you invite your loved ones in a memorable way.</p>
          </div>
        </div>
      </section>

      {/* ── 2. Our story, mission and vision ── */}
      <section className="hx-section hx-tint">
        <div className="hx-wrap">
          <SectionHead center eyebrow="Our story" title="Born from a simple idea." accent="Smarter, more beautiful invitations for everyone."
            lede="In a world where technology connects people across distances, we wanted to bring a fresh approach to the way people invite and celebrate. By combining creative designs with digital innovation, WeInviteU aims to transform traditional invitations into delightful digital experiences." />
          <blockquote className={styles.pullQuote}>
            We are here to make every invitation special, every celebration personal and every connection meaningful.
          </blockquote>
          <div className={styles.purposeGrid}>
            <article className="hx-feature">
              <span className="hx-feature-icon" aria-hidden="true"><Target size={20} strokeWidth={1.6} /></span>
              <h3>Our Mission</h3>
              <p>To simplify the way people celebrate by creating innovative, elegant and user-friendly digital invitation experiences that bring people closer together.</p>
            </article>
            <article className="hx-feature">
              <span className="hx-feature-icon" aria-hidden="true"><Eye size={20} strokeWidth={1.6} /></span>
              <h3>Our Vision</h3>
              <p>To become a trusted destination for digital invitations and celebration experiences, making every special occasion easier to share, celebrate and remember.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── 3. Philosophy ── */}
      <section className="hx-section">
        <div className="hx-wrap">
          <SectionHead center eyebrow="The philosophy" title="Make the beginning" accent="as meaningful as the moment." />
          <div className={styles.philosophyGrid}>
            {philosophy.map(({ title, text }, i) => (
              <article key={title} className="hx-feature">
                <span className={styles.number}>{String(i + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. How it works: the same connected timeline as the home page ── */}
      <section className="hx-section hx-dark">
        <div className="hx-wrap">
          <SectionHead center eyebrow="How it works" title="Three steps to a" accent="beautiful invitation." />
          <ol className="hx-timeline">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title}>
                <span className="hx-timeline-dot" aria-hidden="true"><Icon size={20} strokeWidth={1.6} /></span>
                <span className="hx-timeline-num">Step {String(i + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 5. Paper vs digital, and common questions (shared with the home page) ── */}
      <WhyDigital tint={false} />
      <Faq startingPrice={startingPrice} />

      {/* ── 6. The company behind WeInviteU ── */}
      <section className="hx-section" aria-labelledby="powered-title">
        <div className={`hx-wrap ${styles.powered}`}>
          <div className={styles.poweredText}>
            <p className="hx-eyebrow"><span aria-hidden="true" />Powered by</p>
            <h2 id="powered-title">RAKVIH Solutions <em>Private Limited</em></h2>
            <p className={styles.tagline}>Innovation Behind Every Experience. A Future Together.</p>
            <p>WeInviteU is a product of RAKVIH Solutions Private Limited, an Indian company driven by innovation, technology and the ambition to create meaningful digital experiences.</p>
            <p>RAKVIH Solutions brings together technology, creativity and business expertise to develop solutions that make everyday activities smarter and businesses more efficient.</p>
            <a href="https://rakvih.in/" target="_blank" rel="noopener noreferrer" className="hx-text-link">
              Visit rakvih.in <ArrowUpRight size={15} />
            </a>
          </div>
          <div className={styles.capabilitiesCard}>
            <p className={styles.capabilitiesLabel}>With capabilities across</p>
            <ul className={styles.capabilities}>
              {capabilities.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <span aria-hidden="true"><Icon size={17} strokeWidth={1.6} /></span>
                  {label}
                </li>
              ))}
            </ul>
            <p className={styles.poweredFoot}>
              RAKVIH continues to explore new opportunities, build innovative platforms and create value across diverse industries.
            </p>
          </div>
        </div>
      </section>

      {/* ── 7. Closing call to action ── */}
      <section className="hx-cta">
        <div className="hx-wrap">
          <p className="hx-eyebrow"><span aria-hidden="true" />Get started<span aria-hidden="true" /></p>
          <h2>Ready to create <em>your invitation?</em></h2>
          <div className="hx-cta-actions">
            <Link href="/templates" className="hx-gold-btn">Browse Templates <ArrowUpRight size={14} /></Link>
            <Link href="/contact" className="hx-wa-btn">Get in Touch <ArrowUpRight size={14} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

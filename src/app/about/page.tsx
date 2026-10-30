import PageBanner from "@/components/PageBanner";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./about.module.css";
import { pageOpenGraph } from "@/lib/seo";
import type { Metadata } from "next";
import "../home-refresh.css";
import { Faq, WhyDigital, loadCatalogueSummary } from "@/components/home/SharedSections";

export const metadata: Metadata = {
  title: "About Us – The Studio Behind Your 3D Digital Invitations",
  description: "Meet WeInviteU, the design studio crafting premium 3D digital invitations for Indian weddings, birthdays, baby showers, naming ceremonies, griha pravesh and corporate events. Learn how we design, personalise and deliver your invitation link in 24–48 hours.",
  alternates: { canonical: "/about" },
  openGraph: pageOpenGraph({ url: "/about", title: "About WeInviteU – The Studio Behind Your 3D Digital Invitations" }),
};

export const revalidate = 0;

export default async function AboutPage() {
  const { startingPrice } = await loadCatalogueSummary();
  return (
    <main className={styles.aboutPage}>
      <PageBanner crumb="About Us" eyebrow="OUR STORY" title="Every beautiful day" accent="begins with a feeling." description="We turn the joy of being invited into something you can open, explore, and remember. Thoughtful design, made personal to your story." />

      {/* ── Manifesto Grid ── */}
      <section className={styles.manifestoSection}>
        <div className={styles.manifestoContainer}>
          <div className={styles.manifestoHeader}>
            <span className={styles.eyebrow}>THE PHILOSOPHY</span>
            <h2>Make the beginning as meaningful as the moment.</h2>
          </div>
          
          <div className={styles.manifestoGrid}>
            <article className={styles.manifestoCard}>
              <span className={styles.manifestoNumber}>01</span>
              <h3>Emotion in Motion</h3>
              <p>
                We grew tired of seeing beautiful celebrations announced through static, lifeless images. Your special day deserves an introduction that captures its true essence and scale through immersive 3D technology.
              </p>
            </article>
            
            <article className={styles.manifestoCard}>
              <span className={styles.manifestoNumber}>02</span>
              <h3>Meticulous Craft</h3>
              <p>
                Every template in our studio is meticulously crafted by professional designers. From elegant typography to fluid motion, we ensure that whether you are planning a grand wedding or an intimate baby shower, your story is told beautifully.
              </p>
            </article>
            
            <article className={styles.manifestoCard}>
              <span className={styles.manifestoNumber}>03</span>
              <h3>Effortless Joy</h3>
              <p>
                While our technology is complex, your experience should be seamless. We handle all the customization and hosting, providing you with a simple, elegant link that works perfectly across all devices and sharing platforms.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Story Section ── */}
      <section className={styles.storySection}>
        <div className={styles.storyImage}>
          <div className={styles.imageFrame}>
            <img 
              src="/images/about_studio.webp"
              alt="WeInviteU Design Studio"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div className={styles.imageBadge}>
            EST. 2026 • DESIGN STUDIO •
          </div>
        </div>
        
        <div className={styles.storyContent}>
          <span className={styles.eyebrow}>THE STUDIO</span>
          <h2>
            Crafted with precision,<br />
            <em>delivered with love.</em>
          </h2>
          <p>
            There is something profoundly special about being invited. It says: you matter, you belong, and this moment would be infinitely better with you in it.
          </p>
          <p>
            WeInviteU brings that timeless feeling to the modern digital world. We act as your personal design studio, taking the stress out of digital invitations so you can focus on what truly matters: celebrating with the people you love.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section how-it-works-section" style={{ paddingBottom: "20px", paddingTop: "24px" }}>
        <div className="center-heading" style={{ marginBottom: "20px" }}>
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>
            Three steps to a
            <br />
            <em>beautiful</em> invitation.
          </h2>
        </div>
        <div className="how-section">
          <div className="how-image-wrap">
            <img
              src="/images/how_it_works.webp"
              alt="Digital Invitation Process"
            />
          </div>
          <div className="steps">
            <div className="step">
              <span>01</span>
              <div>
                <h3>Browse & Choose</h3>
                <p>
                  Explore our curated collection and preview any template live
                  in your browser — fully interactive, nothing hidden.
                </p>
              </div>
            </div>
            <div className="step">
              <span>02</span>
              <div>
                <h3>Personalise</h3>
                <p>
                  We customise the template with your names, dates, venue,
                  photos and everything that makes it yours.
                </p>
              </div>
            </div>
            <div className="step">
              <span>03</span>
              <div>
                <h3>Share & Celebrate</h3>
                <p>
                  Get a unique link to share with your guests via WhatsApp,
                  Instagram or any way you love. Simple as that.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shared with the home page: why digital, and common questions ── */}
      <div className="home-redesign hx-scope">
        <WhyDigital tint={false} />
        <Faq startingPrice={startingPrice} />
      </div>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <span className={styles.eyebrow}>GET STARTED</span>
        <h2>Ready to create your invitation?</h2>
        <div className={styles.buttonRow}>
          <Link href="/templates" className={styles.buttonPrimary}>
            Browse Templates <ArrowUpRight size={15} />
          </Link>
          <Link href="/contact" className={styles.buttonSecondary}>
            Get in Touch <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}

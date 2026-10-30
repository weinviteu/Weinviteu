import Image from "next/image";
import Link from "next/link";
import styles from "./PageBanner.module.css";

type PageBannerProps = {
  crumb: string;
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  posters?: string[];
};

/** Promises floating around the About page's studio medallion. */
const STUDIO_PROMISES = ["Hand-personalised for you", "Ready in 24–48 hours", "One link for every guest"];

const DEFAULT_POSTERS = [
  "/template-posters/baby-naming-little-star.webp",
  "/template-posters/birthday-golden-wish.webp",
  "/template-posters/opening-ceremony-the-grand-reveal.webp",
];

export default function PageBanner({ crumb, eyebrow, title, accent, description, posters = DEFAULT_POSTERS }: PageBannerProps) {
  const variant = crumb === "About Us" ? "story" : crumb === "Contact Us" ? "contact" : "collection";
  const caption = variant === "story" ? "Little details. Lasting memories." : variant === "contact" ? "A beautiful idea starts with hello." : "A first look. A forever feeling.";
  return (
    <section className={styles.banner} data-variant={variant}>
      <span className={styles.rays} aria-hidden="true" />
      <span className={styles.dust} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.copy}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{crumb}</span>
          </nav>
          <p className={styles.eyebrow}><span aria-hidden="true" />{eyebrow}</p>
          <h1>{title}<em>{accent}</em></h1>
          <p className={styles.description}>{description}</p>
          <div className={styles.signature}><span aria-hidden="true">✧</span> Made personal. Made to be remembered.</div>
        </div>
        <div className={styles.visual} aria-hidden="true">
          <div className={styles.arch} />
          <span className={styles.orbit} />
          {variant === "story" ? (
            <div className={styles.medallionStage}>
              <div className={styles.medallion}>
                <svg className={styles.medallionRing} viewBox="0 0 200 200">
                  <defs>
                    <path id="pbRingText" d="M100 100m-78 0a78 78 0 1 1 156 0a78 78 0 1 1-156 0" />
                    <linearGradient id="pbGold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#fff1c9" />
                      <stop offset=".45" stopColor="#d9a95a" />
                      <stop offset="1" stopColor="#8f5f25" />
                    </linearGradient>
                  </defs>
                  <text><textPath href="#pbRingText" startOffset="0" textLength="486" lengthAdjust="spacing">HANDCRAFTED · PERSONAL · MADE TO BE REMEMBERED ·</textPath></text>
                </svg>
                <div className={styles.medallionCore}>
                  <span className={styles.medallionMark}>W</span>
                  <span className={styles.medallionSub}>WeInviteU Studio</span>
                </div>
              </div>
              {STUDIO_PROMISES.map((p, i) => (
                <span key={p} className={styles.promise} data-index={i}><span aria-hidden="true">✦</span>{p}</span>
              ))}
            </div>
          ) : variant === "contact" ? (
            <div className={styles.letter}>
              <span className={styles.noteLabel}>A NOTE TO YOUR NEXT CHAPTER</span>
              <span className={styles.hello}>Let’s make<br /><em>it yours.</em></span>
              <span className={styles.noteRule} />
              <span className={styles.noteSign}>With love, WeInviteU</span>
              <span className={styles.seal}>W</span>
            </div>
          ) : (
            <div className={styles.gallery}>
              {posters.slice(0, 3).map((src, i) => (
                <div key={src} className={styles.card} data-index={i}>
                  <Image src={src} alt="" width={390} height={844} sizes="(max-width: 600px) 120px, 180px" preload={i === 0} />
                </div>
              ))}
              <span className={styles.seal}>W</span>
            </div>
          )}
          <span className={styles.spark}>✧</span>
          <p className={styles.caption}>{caption}</p>
        </div>
      </div>
    </section>
  );
}

"use client";

import { categoryPath } from "@/lib/template-url";
import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import LiveFrame from "./LiveFrame";
import WhatsAppIcon from "./WhatsAppIcon";
import HeroFireworks from "./HeroFireworks";
import styles from "./HeroCategoryShowcase.module.css";

export type HeroCategorySlide = { category: string; title: string; src: string | null; poster: string | null };

const categoryCopy: Record<string, { title: string; accent: string; description: string }> = {
  wedding: { title: "Your forever.", accent: "Beautifully announced.", description: "From the first welcome to the final blessing, invite your favourite people into a wedding story that feels entirely yours." },
  birthday: { title: "Another year.", accent: "A little more magic.", description: "Big milestones, tiny candles, and every joyful year between. Set the mood for a birthday worth coming together for." },
  "baby shower": { title: "Tiny footsteps.", accent: "So much love.", description: "A little wonder is on the way. Bring your loved ones together with a sweet invitation to celebrate this beautiful new chapter." },
  traditional: { title: "Rooted in tradition.", accent: "Shared with love.", description: "Honour your rituals, blessings, and new beginnings with an invitation that brings the warmth of tradition to every screen." },
  corporate: { title: "Make connections.", accent: "Leave an impression.", description: "From inspiring summits to team celebrations, set the stage with an invitation as considered and distinctive as your event." },
  anniversary: { title: "Your love story.", accent: "Still unfolding.", description: "Celebrate the years, the memories, and everything still to come. Invite your people to a milestone made for the two of you." },
  "opening ceremony": { title: "A new beginning.", accent: "A grand first hello.", description: "Open the doors to your next chapter. Build anticipation for your launch with an invitation that makes the occasion feel special." },
  "baby naming": { title: "A little name.", accent: "A lifetime of love.", description: "Gather your family for a name, a blessing, and a beautiful beginning. Create a heartfelt welcome for your newest little star." },
};

// Gold dust motes; deterministic so server and client render the same markup.
const DUST = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  "--s": `${2 + (i % 3)}px`,
  "--t": `${11 + (i * 7) % 9}s`,
  "--dl": `${-((i * 13) % 17)}s`,
}));

/** Signed distance from the active slide, wrapping around so the fan always has neighbours on both sides. */
function offsetFrom(i: number, active: number, total: number) {
  let offset = i - active;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

export default function HeroCategoryShowcase({ slides }: { slides: HeroCategorySlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  useEffect(() => {
    if (paused || interacting || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(value => (value + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [paused, interacting, slides.length]);
  if (!slides.length) return <Link href="/templates" className={styles.empty}>Explore our invitation collection <ArrowUpRight size={16} /></Link>;
  const slide = slides[index % slides.length];
  const copy = categoryCopy[slide.category.trim().toLowerCase()] || { title: "A special occasion.", accent: "An unforgettable hello.", description: `Bring your people together with a personalised ${slide.category.toLowerCase()} invitation, brought to life in 3D.` };
  const categoryHref = categoryPath(slide.category);

  return (
    <section className={styles.hero} aria-roledescription="carousel" aria-label="Invitation categories"
      onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
      <HeroFireworks className={styles.fireworks} />
      <div className={styles.dust} aria-hidden="true">
        {DUST.map((d, i) => <i key={i} style={d as CSSProperties} />)}
      </div>
      <div className={styles.copy} key={`copy-${index}`} aria-live="polite">
        <p className={styles.eyebrow}><span aria-hidden="true" />{slide.category} invitations<span aria-hidden="true" /></p>
        <h1>{copy.title} <em>{copy.accent}</em></h1>
        <p className={styles.lede}>{copy.description}</p>
      </div>

      <div className={styles.actions}>
        <Link href={categoryHref} className={styles.primary}>View {slide.category} designs <ArrowUpRight size={15} /></Link>
        <a href={`/api/whatsapp?text=${encodeURIComponent(`Hello, I'd like a ${slide.category.toLowerCase()} invitation.`)}`}
          target="_blank" rel="noopener noreferrer" className={styles.secondary}>
          <WhatsAppIcon size={18} /> Order on WhatsApp
        </a>
      </div>

      <div className={styles.fan}>
        {slides.map((item, i) => {
          const offset = offsetFrom(i, index, slides.length);
          const distance = Math.abs(offset);
          if (distance > 2) return null;
          const active = offset === 0;
          const Card = active ? "div" : "button";
          return (
            <Card key={item.src || item.category} className={styles.card} data-active={active || undefined} data-distance={distance}
              style={{ "--offset": offset, "--distance": distance } as CSSProperties}
              {...(active ? {} : { type: "button" as const, onClick: () => setIndex(i), "aria-label": `Show ${item.category} invitations: ${item.title}` })}>
              <span className={styles.screen}>
                {active && item.src ? (
                  <LiveFrame key={item.category} hero title={`${item.title} — live preview`}
                    src={`${item.src}?autoscroll=1&muted=1`} poster={item.poster} loading="eager" scrolling="no"
                    sandbox="allow-scripts allow-forms allow-popups allow-modals" allow="autoplay" />
                ) : item.poster ? (
                  <img className="template-cover" src={item.poster} alt="" width={390} height={844} loading="eager" decoding="async" />
                ) : (
                  <span className={styles.placeholder}><small>WEINVITEU</small><strong>{item.category}</strong></span>
                )}
              </span>
              <span className={styles.notch} aria-hidden="true" />
              <span className={styles.cardLabel}>{item.category}</span>
            </Card>
          );
        })}
      </div>

      {slides.length > 1 && (
        <button type="button" className={styles.pause} aria-label={paused ? "Play category slideshow" : "Pause category slideshow"} onClick={() => setPaused(value => !value)}>
          {paused ? <Play size={12} /> : <Pause size={12} />}
        </button>
      )}
    </section>
  );
}

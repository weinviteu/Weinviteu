import { withBundledTemplates } from "@/lib/bundled-templates";
import { selectHeroTemplates } from "@/lib/hero-templates";
import type React from "react";
import "./home-refresh.css";
import Link from "next/link";
import {
  ArrowUpRight, Sparkles, MapPin, CalendarCheck, Timer, Music2, Smartphone,
  Clock, Users, LayoutGrid, Check, Search, MessageCircle, Send,
} from "lucide-react";
import TemplateCard from "@/components/TemplateCard";
import HeroCategoryShowcase from "@/components/HeroCategoryShowcase";
import { Faq, WhyDigital } from "@/components/home/SharedSections";
import RevealEnvelope from "@/components/home/RevealEnvelope";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getTemplatePoster } from "@/lib/template-posters";
import { categoryPath, getTemplateUrl } from "@/lib/template-url";
import { getTemplatePricing, DEFAULT_TEMPLATE_PRICE, GST_NOTE } from "@/lib/template-pricing";
import { templateIsVisible } from "@/lib/template-visibility";
import { supabase } from "@/lib/supabase";

export const revalidate = 0; // Disable caching so new templates show up immediately

const WHATSAPP_HELLO = "/api/whatsapp?text=Hello%2C%20I%27d%20like%20to%20know%20more%20about%20your%20invitations.";

const rawOccasions = [
  {
    badge: 'Royal & Timeless',
    title: 'Weddings',
    category: 'Wedding',
    description: 'Grand palace mandaps, floral romance, and breathtaking ceremony reveals.',
    bg: '/images/occasion-wedding.webp',
  },
  {
    badge: 'Milestone & Fun',
    title: 'Birthdays',
    category: 'Birthday',
    description: 'Champagne flutes, sparkling fairy lights, and unforgettable party moments.',
    bg: '/images/occasion-birthday.webp',
  },
  {
    badge: 'Sweet Beginnings',
    title: 'Baby Showers',
    category: 'Baby Shower',
    description: 'Pastel floral cradles, golden stars, and heartfelt welcomes for your little one.',
    bg: '/images/occasion-babyshower.webp',
  },
  {
    badge: 'Sacred Rituals',
    title: 'Traditional',
    category: 'Traditional',
    description: 'Temple courtyard pooja, Griha Pravesh, marigold rangolis, and brass diya rituals.',
    bg: '/images/occasion-traditional.webp',
  },
];

// The first feature gets the large showcase tile; the rest fill the bento grid beside it.
const insideFeatures = [
  { icon: MapPin, title: 'Directions to the venue', text: 'A one-tap map link, so nobody has to call you on the day asking where to turn.' },
  { icon: CalendarCheck, title: 'Replies in a tap', text: 'Guests tap “Will you join us?” and let you know they’re coming, right from the invitation.' },
  { icon: Timer, title: 'A live countdown', text: 'Days, hours and minutes to the big moment, building the excitement.' },
  { icon: Music2, title: 'Music and motion', text: 'Gentle animation and, on selected designs, music that sets the mood.' },
];

const steps = [
  { icon: Search, title: 'Browse & choose', text: 'Explore the collection and preview any design live in your browser — fully interactive, nothing hidden.' },
  { icon: MessageCircle, title: 'Send us your details', text: 'Share your names, dates, venue and photos on WhatsApp. We personalise every detail for you.' },
  { icon: Send, title: 'Share & celebrate', text: 'Receive your own invitation link within 24 to 48 hours and send it to every guest, wherever they are.' },
];

function SectionHead({ eyebrow, title, accent, lede, center = false, children }: {
  eyebrow: string; title: string; accent: string; lede?: string; center?: boolean; children?: React.ReactNode;
}) {
  return (
    <header className={`hx-head${center ? " hx-head-center" : ""}`}>
      <div>
        <p className="hx-eyebrow"><span aria-hidden="true" />{eyebrow}{center && <span aria-hidden="true" />}</p>
        <h2>{title} <em>{accent}</em></h2>
        {lede && <p className="hx-lede">{lede}</p>}
      </div>
      {children}
    </header>
  );
}

export default async function Home() {
  const [
    { data: activeCategories },
    { data: rawTemplates }
  ] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('display_order', { ascending: true }),
    supabase.from('templates').select('*').neq('enabled', false).order('created_at', { ascending: false }).order('id', { ascending: false })
  ]);

  const activeCats = activeCategories || [];
  const activeCatNames = new Set(activeCats.map(c => c.name.trim().toLowerCase()));

  // Only keep templates that belong to an active category
  const allTemplates = withBundledTemplates(rawTemplates || [], activeCats).filter(t => templateIsVisible(t, activeCats));

  const occasionsList = rawOccasions.filter(o =>
    activeCatNames.has(o.category.toLowerCase())
  );
  const featuredNames = new Set(occasionsList.map(o => o.category.toLowerCase()));
  // Active categories without a photo card are listed in their own tile of the gallery.
  const otherCategories = activeCats.map(c => c.name.trim()).filter(name => !featuredNames.has(name.toLowerCase()));

  // Ticker strip: active categories in the order set in Admin → Categories; each links to its templates.
  const tickerItems = activeCats.map((cat) => ({
    label: cat.name.trim(),
    href: categoryPath(cat.name),
  }));

  const templatesList = allTemplates || [];
  const lowestPrice = templatesList.length
    ? Math.min(...templatesList.map(t => getTemplatePricing(t).numericPrice))
    : Number(DEFAULT_TEMPLATE_PRICE);
  const startingPrice = `₹${lowestPrice.toLocaleString('en-IN')}`;

  const promises = [
    { icon: LayoutGrid, value: `${templatesList.length}+`, label: 'Live 3D designs' },
    { icon: Clock, value: '24–48 hrs', label: 'Personalised & delivered' },
    { icon: Users, value: 'Unlimited', label: 'Guests, one link' },
    { icon: Smartphone, value: 'Every screen', label: 'Phone, laptop & WhatsApp' },
  ];


  return (
    <main className="studio-home home-redesign">
      {/* ── 1. Hero: The first chapter ── */}
      <HeroCategoryShowcase slides={activeCats.flatMap(category =>
        selectHeroTemplates(templatesList, category.name).map(template => ({
          category: category.name,
          title: template.title,
          src: getTemplateUrl(template.filename),
          poster: getTemplatePoster(template.filename),
        }))
      )} />

      {/* ── 2. Promise strip ── */}
      <section className="hx-promises" aria-label="What you can expect">
        <div className="hx-wrap hx-promise-row">
          {promises.map(({ icon: Icon, value, label }) => (
            <div key={label} className="hx-promise">
              <span className="hx-promise-icon" aria-hidden="true"><Icon size={18} strokeWidth={1.6} /></span>
              <div>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Occasions: bento gallery ── */}
      <section className="hx-section hx-occasion-section">
        <div className="hx-wrap">
          <SectionHead center eyebrow="Your kind of celebration" title="Life gives you moments." accent="Make them a celebration.">
            <Link href="/templates" className="hx-text-link">View all occasions <ArrowUpRight size={15} /></Link>
          </SectionHead>

          <div className="hx-occasions">
            {occasionsList.map((o) => (
              <Link key={o.category} href={categoryPath(o.category)} className="hx-occasion">
                <img src={o.bg} alt="" loading="lazy" />
                <span className="hx-occasion-badge">{o.badge}</span>
                <span className="hx-occasion-arrow" aria-hidden="true"><ArrowUpRight size={16} /></span>
                <div className="hx-occasion-body">
                  <h3>{o.title}</h3>
                  <p>{o.description}</p>
                </div>
              </Link>
            ))}
            {otherCategories.length > 0 && (
              <div className="hx-occasion hx-occasion-more">
                <p className="hx-eyebrow">Also designing for</p>
                <ul>
                  {otherCategories.map(name => (
                    <li key={name}>
                      <Link href={categoryPath(name)}>{name} <ArrowUpRight size={14} /></Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. Featured designs ── */}
      <section className="hx-section hx-tint home-templates-section">
        <div className="hx-wrap">
          <SectionHead center eyebrow="The design edit" title="Find a design." accent="Fall in love."
            lede="Tap any design to see every scene, from the opening to the final blessing.">
            <Link href="/templates" className="hx-outline-btn">
              See all {templatesList.length} designs <ArrowUpRight size={14} />
            </Link>
          </SectionHead>

          <div className="home-templates-grid">
            {templatesList.slice(0, 6).map((t) => (
              <TemplateCard key={t.filename} template={t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Inside every invitation: bento ── */}
      <section className="hx-section">
        <div className="hx-wrap">
          <SectionHead center eyebrow="Inside the invitation" title="More than a card." accent="A little world to explore."
            lede="Each design is a small website of its own, with everything your guests need in one beautiful place." />

          <div className="hx-bento">
            <article className="hx-bento-hero">
              <div className="hx-bento-copy">
                <span className="hx-feature-icon" aria-hidden="true"><Sparkles size={20} strokeWidth={1.6} /></span>
                <h3>A cinematic opening</h3>
                <p>Doors part, curtains rise, seals break. Guests open your invitation rather than just glance at it.</p>
                <Link href="/templates" className="hx-text-link hx-text-link-light">See it in action <ArrowUpRight size={15} /></Link>
              </div>
              <div className="hx-cinematic-art">
                <img src="/images/cinematic-opening.webp" alt="Golden palace doors opening onto a glowing celebration courtyard" width={800} height={1200} loading="lazy" />
              </div>
            </article>
            {insideFeatures.map(({ icon: Icon, title, text }) => (
              <article key={title} className="hx-feature">
                <span className="hx-feature-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.6} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <p className="hx-footnote">Features vary by design — each design&apos;s page lists exactly what it includes.</p>
        </div>
      </section>

      {/* ── 6. How it works: connected timeline ── */}
      <section className="hx-section hx-dark">
        <div className="hx-wrap">
          <SectionHead center eyebrow="From idea to invitation" title="A little inspiration." accent="We’ll take it from here." />
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
          <div className="hx-timeline-cta">
            <a href={WHATSAPP_HELLO} target="_blank" rel="noopener noreferrer" className="hx-wa-btn">
              <WhatsAppIcon size={18} /> Start on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── 7. Paper vs digital ── */}
      <WhyDigital />

      {/* ── 8. The reveal: a drawn envelope that opens as it scrolls into view ── */}
      <section className="hx-reveal" aria-labelledby="hx-reveal-title">
        <div className="hx-wrap hx-reveal-grid">
          <div className="hx-reveal-head">
            <p className="hx-eyebrow"><span aria-hidden="true" />The reveal</p>
            <h2 id="hx-reveal-title">Some moments deserve <em>an opening.</em></h2>
            <p className="hx-lede">A printed card is read once. A WeInviteU invitation is opened — slowly, beautifully, by every one of your guests.</p>
            <ul className="hx-reveal-points">
              <li><Check size={15} aria-hidden="true" /> Opens like a real invitation, seal and all</li>
              <li><Check size={15} aria-hidden="true" /> Your names, photos and story inside</li>
              <li><Check size={15} aria-hidden="true" /> One link for every guest, on any phone</li>
            </ul>
          </div>
          <RevealEnvelope />
        </div>
      </section>

      {/* ── 9. Pricing ── */}
      <section className="hx-section">
        <div className="hx-wrap">
          <div className="hx-price">
            <div className="hx-price-main">
              <p className="hx-eyebrow"><span aria-hidden="true" />Simple pricing</p>
              <h2>One price. <em>Every guest.</em></h2>
              <p className="hx-lede">No per-card costs, no printing, no postage. Choose a design, pay one clear price plus GST, and share it with everyone.</p>
              <p className="hx-price-figure"><span>Designs from</span> <strong>{startingPrice}</strong> <span>{GST_NOTE}</span></p>
            </div>
            <div className="hx-price-list">
              <p>Every invitation includes</p>
              <ul>
                <li><Check size={16} aria-hidden="true" /> Full personalisation of names, dates &amp; venue</li>
                <li><Check size={16} aria-hidden="true" /> Your own photos added to the design</li>
                <li><Check size={16} aria-hidden="true" /> A private link to share with unlimited guests</li>
                <li><Check size={16} aria-hidden="true" /> Delivery within 24 to 48 hours</li>
                <li><Check size={16} aria-hidden="true" /> Works on every phone, tablet and laptop</li>
              </ul>
              <div className="hx-price-actions">
                <Link href="/templates" className="hx-dark-btn">Choose a design <ArrowUpRight size={14} /></Link>
                <a href={WHATSAPP_HELLO} target="_blank" rel="noopener noreferrer" className="hx-wa-btn">
                  <WhatsAppIcon size={18} /> Ask on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. FAQ ── */}
      <Faq startingPrice={startingPrice} />

      {/* ── 11. Closing CTA ── */}
      <section className="hx-cta">
        <div className="hx-wrap">
          <p className="hx-eyebrow"><span aria-hidden="true" />The invitation is only the beginning<span aria-hidden="true" /></p>
          <h2>Your next beautiful <em>beginning starts here.</em></h2>
          <div className="hx-cta-actions">
            <Link href="/templates" className="hx-gold-btn">
              Browse designs <ArrowUpRight size={14} />
            </Link>
            <a href={WHATSAPP_HELLO} target="_blank" rel="noopener noreferrer" className="hx-wa-btn">
              <WhatsAppIcon size={18} /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
      {/* ── Ticker strip: occasions from the database, right above the footer ── */}
      {tickerItems.length > 0 && (
        <nav className="occasion-ticker" aria-label="Occasions we design for">
          <div className="occasion-ticker-track" style={{ "--ticker-duration": `${Math.max(24, tickerItems.length * 5)}s` } as React.CSSProperties}>
            {[0, 1].map((copy) => (
              <ul key={copy} className="occasion-ticker-group" aria-hidden={copy === 1 || undefined}>
                {tickerItems.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} tabIndex={copy === 1 ? -1 : undefined}>{item.label}</Link>
                    <svg className="occasion-ticker-sep" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M8 0 9.6 6.4 16 8 9.6 9.6 8 16 6.4 9.6 0 8 6.4 6.4Z" />
                    </svg>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </nav>
      )}

    </main>
  );
}

import { withBundledTemplates } from "@/lib/bundled-templates";
import { selectHeroTemplates } from "@/lib/hero-templates";
import type React from "react";
import "./home-refresh.css";
import Link from "next/link";
import {
  ArrowUpRight, Sparkles, MapPin, CalendarCheck, Timer, Music2, Smartphone,
  Clock, Users, LayoutGrid, Check, Search, MessageCircle, Send,
  Code2, Cpu, ShoppingCart, Briefcase, Building2, Megaphone, GraduationCap,
} from "lucide-react";
import TemplateCard from "@/components/TemplateCard";
import LiveFrame from "@/components/LiveFrame";
import HeroCategoryShowcase from "@/components/HeroCategoryShowcase";
import { Faq, WhyDigital } from "@/components/home/SharedSections";
import RevealEnvelope from "@/components/home/RevealEnvelope";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getTemplatePoster } from "@/lib/template-posters";
import { categoryPath, getTemplateUrl, templatePath } from "@/lib/template-url";
import { getTemplatePricing, DEFAULT_TEMPLATE_PRICE, GST_NOTE } from "@/lib/template-pricing";
import { getTemplateTier } from "@/lib/template-tiers";
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
    bg: '/images/occasion-wedding-hands.webp',
    pos: '46% 50%',
  },
  {
    badge: 'Milestone & Fun',
    title: 'Birthdays',
    category: 'Birthday',
    description: 'Champagne flutes, sparkling fairy lights, and unforgettable party moments.',
    bg: '/images/occasion-birthday-cake.webp',
    pos: '68% 55%',
  },
  {
    badge: 'Sweet Beginnings',
    title: 'Baby Showers',
    category: 'Baby Shower',
    description: 'Pastel floral cradles, golden stars, and heartfelt welcomes for your little one.',
    bg: '/images/occasion-babyshower-cradle.webp',
    pos: '50% 88%',
  },
  {
    badge: 'Sacred Rituals',
    title: 'Traditional',
    category: 'Traditional',
    description: 'Temple courtyard pooja, Griha Pravesh, marigold rangolis, and brass diya rituals.',
    bg: '/images/occasion-traditional-pooja.webp',
    pos: '42% 60%',
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

const rakvihCapabilities = [
  { icon: Code2, label: "Web & Software Development" },
  { icon: Cpu, label: "Digital Solutions & Technology" },
  { icon: ShoppingCart, label: "E-commerce & Online Platforms" },
  { icon: Briefcase, label: "Business Consulting & Solutions" },
  { icon: Building2, label: "Construction & Development" },
  { icon: Megaphone, label: "Digital Marketing & Branding" },
  { icon: GraduationCap, label: "Training & Development" },
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

  // The "cinematic opening" tile plays a luxury wedding invitation on a loop (the cinematic one when available).
  const luxuryWeddings = templatesList.filter(t => getTemplateTier(t) === 'luxury' && t.category?.trim().toLowerCase() === 'wedding');
  const cinematicTemplate = luxuryWeddings.find(t => t.filename === 'wedding-premium-cinematic.html') ?? luxuryWeddings[0];

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
          detailUrl: templatePath(template),
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
                <img src={o.bg} alt="" loading="lazy" style={"pos" in o && o.pos ? { objectPosition: o.pos } : undefined} />
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
                {/* A gold mandala drawn in line-art, slowly turning behind the title */}
                <svg className="hx-more-art" viewBox="0 0 200 200" aria-hidden="true">
                  <defs>
                    <linearGradient id="more-gold" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#fbe7b0" /><stop offset=".5" stopColor="#d9a54f" /><stop offset="1" stopColor="#f0cf86" />
                    </linearGradient>
                  </defs>
                  <g fill="none" stroke="url(#more-gold)" strokeLinecap="round">
                    <circle cx="100" cy="100" r="96" strokeWidth=".6" />
                    <circle cx="100" cy="100" r="90" strokeWidth=".4" strokeDasharray="1 4" />
                    {Array.from({ length: 16 }, (_, i) => (
                      <path key={`o${i}`} transform={`rotate(${i * 22.5} 100 100)`} strokeWidth=".8" d="M100 14 C112 34 112 52 100 66 C88 52 88 34 100 14 Z" />
                    ))}
                    {Array.from({ length: 16 }, (_, i) => (
                      <path key={`m${i}`} transform={`rotate(${i * 22.5 + 11.25} 100 100)`} strokeWidth=".6" d="M100 40 C107 52 107 62 100 70 C93 62 93 52 100 40 Z" />
                    ))}
                    <circle cx="100" cy="100" r="32" strokeWidth=".8" />
                    {Array.from({ length: 8 }, (_, i) => (
                      <path key={`i${i}`} transform={`rotate(${i * 45} 100 100)`} strokeWidth=".9" d="M100 70 C106 80 106 88 100 94 C94 88 94 80 100 70 Z" />
                    ))}
                    <circle cx="100" cy="100" r="6" strokeWidth="1" />
                  </g>
                  <g fill="url(#more-gold)">
                    {Array.from({ length: 16 }, (_, i) => (
                      <circle key={`d${i}`} cx={100 + 78 * Math.sin((i * Math.PI) / 8)} cy={100 - 78 * Math.cos((i * Math.PI) / 8)} r="1.3" />
                    ))}
                  </g>
                </svg>
                <span className="hx-more-sparkles" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
                <Link href="/templates" className="hx-occasion-arrow" aria-label="Explore all occasion templates">
                  <ArrowUpRight size={16} />
                </Link>

                <div className="hx-occasion-more-body">
                  <div className="hx-occasion-more-head">
                    <p className="hx-eyebrow">Also designing for</p>
                    <h3>Special Milestones</h3>
                  </div>
                  <div className="hx-more-chips">
                    {otherCategories.map(name => (
                      <Link key={name} href={categoryPath(name)} className="hx-more-chip">
                        <span>{name}</span>
                        <ArrowUpRight size={13} className="hx-more-chip-arrow" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. Featured designs ── */}
      <section className="hx-section hx-tint home-templates-section">
        <div className="hx-wrap">
          <SectionHead center eyebrow="The design edit" title="Find a design." accent="Fall in love."
            lede="Tap any design to see every scene, from the opening to the final blessing." />

          <div className="home-templates-grid">
            {templatesList.slice(0, 6).map((t) => (
              <TemplateCard key={t.filename} template={t} />
            ))}
          </div>

          {/* After the designs: a clear way into the full collection */}
          <div className="home-templates-more">
            <Link href="/templates" className="home-templates-more-btn">
              <span>See all {templatesList.length} designs</span>
              <span className="home-templates-more-arrow" aria-hidden="true"><ArrowUpRight size={15} /></span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Inside every invitation: bento ── */}
      <section className="hx-section">
        <div className="hx-wrap">
          <SectionHead center eyebrow="Inside the invitation" title="More than a card." accent="A little world to explore."
            lede="Each design is a small website of its own, with everything your guests need in one beautiful place." />

          <div className="hx-bento">
            <article className={`hx-bento-hero${cinematicTemplate ? " hx-bento-live" : ""}`}>
              <div className="hx-bento-copy">
                <span className="hx-feature-icon" aria-hidden="true"><Sparkles size={20} strokeWidth={1.6} /></span>
                <h3>A cinematic opening</h3>
                <p>Doors part, curtains rise, seals break. Guests open your invitation rather than just glance at it.</p>
                <Link href={cinematicTemplate ? templatePath(cinematicTemplate) : "/templates"} className="hx-text-link hx-text-link-light">See it in action <ArrowUpRight size={15} /></Link>
              </div>
              <div className={`hx-cinematic-art${cinematicTemplate ? " hx-cinematic-live" : ""}`}>
                {cinematicTemplate ? (
                  <Link href={templatePath(cinematicTemplate)} className="hx-cinematic-link" aria-label={`Open ${cinematicTemplate.title}`}>
                    {/* Served with the preview tour, already opened (?open) so it plays from the first inside page, silent and looping. */}
                    <LiveFrame title={`${cinematicTemplate.title} — live preview`}
                      src={`/api/serve-template/${encodeURIComponent(cinematicTemplate.filename.split("/").pop()!)}?autoscroll=1&muted=1&open=1`}
                      poster={getTemplatePoster(cinematicTemplate.filename)} loading="lazy" scrolling="no" tabIndex={-1}
                      sandbox="allow-scripts allow-forms allow-popups allow-modals" allow="autoplay" />
                    <span className="hx-cinematic-chip" aria-hidden="true"><i />Live preview</span>
                  </Link>
                ) : (
                  <img src="/images/cinematic-opening.webp" alt="Golden palace doors opening onto a glowing celebration courtyard" width={800} height={1200} loading="lazy" />
                )}
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

      {/* ── 9.5 The company behind WeInviteU ── */}
      <section className="hx-rakvih-section" aria-labelledby="home-rakvih-title">
        <span className="hx-rakvih-watermark" aria-hidden="true">RAKVIH</span>
        <span className="hx-rakvih-glow" aria-hidden="true" />
        <div className="hx-wrap hx-rakvih-wrap">
          <div className="hx-rakvih-text">
            <div className="hx-rakvih-brand">
              <svg className="hx-rakvih-emblem" viewBox="0 0 64 64" aria-hidden="true">
                <defs>
                  <linearGradient id="rakvih-gold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fbe7b0" /><stop offset=".45" stopColor="#d9a54f" /><stop offset=".75" stopColor="#a8742a" /><stop offset="1" stopColor="#f0cf86" />
                  </linearGradient>
                </defs>
                <circle cx="32" cy="32" r="30" fill="none" stroke="url(#rakvih-gold)" strokeWidth="1.6" />
                <circle cx="32" cy="32" r="25.5" fill="#1a130d" stroke="url(#rakvih-gold)" strokeWidth=".8" strokeDasharray="1.2 2.6" />
                <text x="32" y="41.5" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="27" fill="url(#rakvih-gold)">R</text>
                <path d="M32 3.6l1.6 2.4-1.6 2.4-1.6-2.4z M32 55.6l1.6 2.4-1.6 2.4-1.6-2.4z" fill="url(#rakvih-gold)" />
              </svg>
              <span className="hx-rakvih-badge">Powered by</span>
            </div>
            <h2 id="home-rakvih-title">
              <span className="hx-rakvih-name">RAKVIH Solutions</span>
              <span className="hx-rakvih-legal">Private Limited</span>
            </h2>
            <p className="hx-rakvih-tagline">
              <span className="hx-rakvih-rule" aria-hidden="true" />
              <span>Innovation Behind Every Experience. <em>A Future Together.</em></span>
            </p>
            <p className="hx-rakvih-p">
              WeInviteU is a product of RAKVIH Solutions Private Limited, an Indian company driven by innovation, technology and the ambition to create meaningful digital experiences.
            </p>
            <p className="hx-rakvih-p">
              RAKVIH Solutions brings together technology, creativity and business expertise to develop solutions that make everyday activities smarter and businesses more efficient.
            </p>
            <div className="hx-rakvih-action">
              <a href="https://rakvih.in/" target="_blank" rel="noopener noreferrer" className="hx-rakvih-btn">
                Visit rakvih.in <ArrowUpRight size={15} />
              </a>
            </div>
          </div>

          <div className="hx-rakvih-capabilities-card">
            <p className="hx-rakvih-capabilities-label"><span aria-hidden="true" />With capabilities across<span aria-hidden="true" /></p>
            <ol className="hx-rakvih-capabilities-list">
              {rakvihCapabilities.map(({ icon: Icon, label }, i) => (
                <li key={label}>
                  <span className="hx-rakvih-cap-icon" aria-hidden="true"><Icon size={17} strokeWidth={1.6} /></span>
                  <span className="hx-rakvih-cap-label">{label}</span>
                  <span className="hx-rakvih-cap-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                </li>
              ))}
            </ol>
            <p className="hx-rakvih-foot">
              RAKVIH continues to explore new opportunities, build innovative platforms and create value across diverse industries.
            </p>
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

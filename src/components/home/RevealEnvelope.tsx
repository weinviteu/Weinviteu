"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** Sparks fly from the seal along these (x, y) directions, in envelope-width percent. */
const SPARKS = [[-34, -26], [-22, -40], [-6, -46], [10, -44], [26, -36], [36, -20], [-40, -6], [42, -4], [-28, 10], [30, 12]];

/** Poured-wax outline: a circle with fixed, uneven bulges so the seal never looks stamped from a template. */
const WAX_EDGE = Array.from({ length: 40 }, (_, i) => {
  const a = (i / 40) * Math.PI * 2;
  const r = 44 + Math.sin(a * 5 + 0.7) * 2.2 + Math.sin(a * 9 + 2.1) * 1.3 + Math.cos(a * 3) * 1.1;
  return `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
}).join(" L");

function WaxSeal() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="hxWax" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#a8363f" />
          <stop offset=".45" stopColor="#7d1b27" />
          <stop offset="1" stopColor="#4a0a14" />
        </radialGradient>
        <radialGradient id="hxWaxPress" cx="55%" cy="60%" r="60%">
          <stop offset="0" stopColor="#8a2430" />
          <stop offset="1" stopColor="#5c1019" />
        </radialGradient>
        <radialGradient id="hxWaxGloss" cx="35%" cy="25%" r="40%">
          <stop offset="0" stopColor="#fff" stopOpacity=".45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={`M${WAX_EDGE}Z`} fill="url(#hxWax)" />
      <circle cx="50" cy="50" r="30" fill="url(#hxWaxPress)" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#3d0710" strokeOpacity=".7" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="31.6" fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth="1" />
      <circle cx="50" cy="50" r="25.5" fill="none" stroke="#3d0710" strokeOpacity=".45" strokeWidth=".6" strokeDasharray="1.2 1.6" />
      {/* Debossed monogram: a light lower edge and a dark upper edge read as pressed into the wax */}
      <text x="50" y="61.5" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="32" fill="#ffd9d9" fillOpacity=".22">W</text>
      <text x="50" y="59.5" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="32" fill="#2e050c" fillOpacity=".75">W</text>
      <text x="50" y="60.5" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="32" fill="#6e1521">W</text>
      <ellipse cx="36" cy="30" rx="22" ry="14" fill="url(#hxWaxGloss)" transform="rotate(-25 36 30)" />
    </svg>
  );
}

/** A drawn envelope that opens by itself when scrolled into view; the seal opens it again. */
export default function RevealEnvelope() {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setOpen(true); observer.disconnect(); }
    }, { threshold: 0.6 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`hx-env-stage${open ? " is-open" : ""}`}>
      <div className="hx-env">
        <div className="hx-env-back" aria-hidden="true" />
        <div className="hx-env-card" aria-hidden={!open}>
          <p className="hx-env-card-kicker">You are cordially invited</p>
          <p className="hx-env-card-title">Your story <em>begins here.</em></p>
          <p className="hx-env-card-line">Your names · your date · your venue</p>
          <Link href="/templates" className="hx-env-card-cta" tabIndex={open ? undefined : -1}>
            Start your invitation <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="hx-env-pocket" aria-hidden="true">
          <span className="hx-env-fold hx-env-fold-left" />
          <span className="hx-env-fold hx-env-fold-right" />
          <span className="hx-env-fold-bottom-wrap"><span className="hx-env-fold hx-env-fold-bottom" /></span>
        </div>
        <span className="hx-env-flap-shadow" aria-hidden="true"><span /></span>
        <div className="hx-env-flap" aria-hidden="true">
          <span className="hx-env-flap-front" />
          <span className="hx-env-flap-back" />
        </div>
        <span className="hx-env-sparks" aria-hidden="true">
          {SPARKS.map(([x, y], i) => (
            <i key={i} style={{ "--dx": `${x}cqw`, "--dy": `${y}cqw`, animationDelay: `${0.35 + (i % 4) * 0.05}s` } as React.CSSProperties} />
          ))}
        </span>
        <button
          type="button"
          className="hx-env-seal"
          aria-label={open ? "Seal the invitation again" : "Open the invitation"}
          aria-pressed={open}
          onClick={() => setOpen(o => !o)}
        >
          <WaxSeal />
        </button>
      </div>
      <button type="button" className="hx-env-replay" onClick={() => setOpen(o => !o)}>
        {open ? "Seal it again" : "Tap the seal to open"}
      </button>
    </div>
  );
}

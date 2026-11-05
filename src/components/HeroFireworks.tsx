"use client";

import { useEffect, useRef } from "react";

type Spark = { x: number; y: number; vx: number; vy: number; life: number; decay: number; size: number; hue: string; trail: [number, number][] };

const GOLDS = ["#ffe7ae", "#f4d49d", "#efb79a", "#ffd27a", "#fff4d6"];

/**
 * Slow golden firework bursts and sparkler trails.
 * On wide screens (≥700px) they bloom in the upper-left and upper-right bands.
 * On mobile (<700px) they burst directly on top of the left and right template cards.
 * Pauses off-screen and when hidden; renders nothing for reduced-motion users.
 */
export default function HeroFireworks({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = 0, H = 0, raf = 0, visible = true, nextBurst = 0, side = 0;
    const sparks: Spark[] = [];
    const flashes: { x: number; y: number; life: number }[] = [];
    const rockets: { x: number; y: number; ty: number; vy: number; trail: [number, number][] }[] = [];
    // Spark heads stamp this pre-drawn glow; a canvas shadowBlur on every spark kept a whole CPU core busy.
    const glow = document.createElement("canvas");
    glow.width = glow.height = 32;
    const gctx = glow.getContext("2d");
    if (gctx) {
      const g = gctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, "#fff6dc"); g.addColorStop(0.14, "#fff6dc"); g.addColorStop(0.32, "#ffcf73aa"); g.addColorStop(1, "#ffcf7300");
      gctx.fillStyle = g; gctx.fillRect(0, 0, 32, 32);
    }

    const size = () => {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    // On wide screens bursts sit in the outer band on each side.
    // On mobile (<700px) they burst right on top of the left and right template cards.
    const isMobile = () => W < 700;
    const band = () => Math.max(70, Math.min(W * 0.2, 300));

    const getMobileCardTarget = (isLeft: boolean) => {
      const heroEl = canvas.parentElement;
      if (heroEl) {
        // Query the left card (--offset: -1) or right card (--offset: 1)
        const selector = isLeft
          ? '[data-distance="1"][style*="--offset: -1"], [data-distance="1"][style*="--offset:-1"]'
          : '[data-distance="1"][style*="--offset: 1"], [data-distance="1"][style*="--offset:1"]';
        const cardEl = heroEl.querySelector<HTMLElement>(selector);
        if (cardEl) {
          const cardRect = cardEl.getBoundingClientRect();
          const heroRect = heroEl.getBoundingClientRect();
          const x = cardRect.left + cardRect.width / 2 - heroRect.left;
          // Burst directly on top of the card (16-30px above card top)
          const ty = Math.max(H * 0.14, (cardRect.top - heroRect.top) - (16 + Math.random() * 18));
          return { x, ty };
        }
      }
      // Calculated fallback matching mobile fan geometry:
      const x = isLeft ? W * 0.19 + (Math.random() - 0.5) * 16 : W * 0.81 + (Math.random() - 0.5) * 16;
      const ty = H * 0.34 + (Math.random() - 0.5) * 20;
      return { x, ty };
    };

    const launch = () => {
      const left = side++ % 2 === 0;
      let x: number, ty: number;
      if (isMobile()) {
        const target = getMobileCardTarget(left);
        x = target.x;
        ty = target.ty;
      } else {
        const b = band();
        x = left ? b * (0.25 + Math.random() * 0.6) : W - b * (0.25 + Math.random() * 0.6);
        ty = H * (0.12 + Math.random() * 0.28);
      }
      const startY = Math.min(H * 0.85, Math.max(ty + 170, H * 0.65));
      rockets.push({ x, y: startY, ty, vy: -(H * 0.012 + 3), trail: [] });
    };
    const explode = (x: number, y: number) => {
      const burstScale = isMobile() ? 0.75 : 1;
      const scale = Math.min(1, band() / 260) * burstScale, n = (isMobile() ? 65 : 90) + Math.floor(Math.random() * 35);
      // A soft flash where the shell bursts.
      flashes.push({ x, y, life: 1 });
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        // Square-root spread fills the sphere instead of leaving a thin ring.
        const sp = (0.6 + Math.sqrt(Math.random()) * 3.2) * scale;
        sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: 0.006 + Math.random() * 0.01, size: 1 + Math.random() * 1.6, hue: GOLDS[Math.floor(Math.random() * GOLDS.length)], trail: [] });
      }
    };

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      if (t > nextBurst) {
        launch();
        nextBurst = t + (isMobile() ? 1300 + Math.random() * 1000 : 1100 + Math.random() * 1100);
      }
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push([r.x, r.y]); if (r.trail.length > 10) r.trail.shift();
        r.y += r.vy; r.vy *= 0.985;
        ctx.strokeStyle = "#ffd27a88"; ctx.lineWidth = 1.4; ctx.beginPath();
        r.trail.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        if (r.y <= r.ty || r.vy > -0.6) { explode(r.x, r.y); rockets.splice(i, 1); }
      }
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i], g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 90);
        g.addColorStop(0, `rgba(255, 220, 150, ${0.35 * f.life})`); g.addColorStop(1, "rgba(255, 220, 150, 0)");
        ctx.fillStyle = g; ctx.fillRect(f.x - 90, f.y - 90, 180, 180);
        f.life -= 0.04; if (f.life <= 0) flashes.splice(i, 1);
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.trail.push([s.x, s.y]); if (s.trail.length > 6) s.trail.shift();
        s.vx *= 0.975; s.vy = s.vy * 0.975 + 0.025; s.x += s.vx; s.y += s.vy; s.life -= s.decay;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = s.life * 0.7; ctx.strokeStyle = s.hue; ctx.lineWidth = s.size; ctx.beginPath();
        s.trail.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        // Glittering head: flickers as it fades.
        const glitter = s.life < 0.35 ? (Math.random() < 0.5 ? 0 : 1) : 0.6 + Math.random() * 0.4;
        const d = s.size * 2 + 14;
        ctx.globalAlpha = s.life * glitter; ctx.drawImage(glow, s.x - d / 2, s.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    };

    size();
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(canvas);
    window.addEventListener("resize", size);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); window.removeEventListener("resize", size); };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

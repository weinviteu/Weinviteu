"use client";

import { useEffect, useRef } from "react";

type Spark = { x: number; y: number; vx: number; vy: number; life: number; decay: number; size: number; hue: string; trail: [number, number][] };

const GOLDS = ["#ffe7ae", "#f4d49d", "#efb79a", "#ffd27a", "#fff4d6"];

/**
 * Slow golden firework bursts and sparkler trails that bloom only in the upper-left and upper-right
 * of the banner, leaving the centre (headline and phones) clear. Narrow screens have no free sides, so none launch there. Pauses off-screen and when hidden;
 * renders nothing for reduced-motion users.
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

    const size = () => {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    // Bursts sit in the outer band on each side; narrow screens get a thinner band and smaller bursts.
    const band = () => Math.max(70, Math.min(W * 0.2, 300));
    const launch = () => {
      const b = band(), left = side++ % 2 === 0;
      const x = left ? b * (0.25 + Math.random() * 0.6) : W - b * (0.25 + Math.random() * 0.6);
      const ty = H * (0.12 + Math.random() * 0.28);
      rockets.push({ x, y: H * 0.75, ty, vy: -(H * 0.012 + 3), trail: [] });
    };
    const explode = (x: number, y: number) => {
      const scale = Math.min(1, band() / 260), n = 90 + Math.floor(Math.random() * 40);
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
      if (t > nextBurst && W >= 700) { launch(); nextBurst = t + 1100 + Math.random() * 1100; }
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
        ctx.globalAlpha = s.life * glitter; ctx.fillStyle = "#fff6dc"; ctx.shadowColor = "#ffcf73"; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
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

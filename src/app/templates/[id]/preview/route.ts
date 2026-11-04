import { supabase } from "@/lib/supabase";
import { findTemplate, loadVisibleTemplates } from "@/lib/template-catalogue";
import { readRegisteredTemplate } from "@/lib/template-source";
import { getTemplateUrl, templatePath, templatePreviewPath } from "@/lib/template-url";

function withOpener(html: string) {
  if (/<script[^>]+autoscroll\.js/i.test(html)) return html;
  return html.replace(/<head\b[^>]*>/i, '$&<script src="/templates/autoscroll.js"></script>');
}

const WHATSAPP_MARK = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#25D366"/><path d="M12 3.5a8.5 8.5 0 0 0-7.36 12.75L3.5 20.5l4.35-1.14A8.5 8.5 0 1 0 12 3.5Z" fill="none" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/><path fill="#fff" d="M17.52 14.37c-.29-.15-1.72-.85-1.99-.95-.27-.1-.46-.15-.65.15-.19.3-.75.95-.92 1.14-.17.19-.34.22-.63.07-.29-.15-1.23-.45-2.34-1.44-.86-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.57-.89-2.15-.24-.56-.48-.49-.65-.5-.17-.01-.36-.01-.56-.01-.19 0-.51.07-.77.36-.26.29-1.01.99-1.01 2.42 0 1.43 1.04 2.81 1.18 3 .15.19 2.05 3.13 4.96 4.39.69.3 1.23.48 1.65.61.7.22 1.33.19 1.83.11.56-.08 1.72-.7 1.96-1.38.24-.68.24-1.26.17-1.38-.07-.12-.27-.19-.56-.34z"/></svg>';

/**
 * A floating WhatsApp button for visitors who want the design, always showing its label. It sits in the
 * top-right corner of the invitation (of its centred column on desktop): beside the template's own corner
 * control (usually music) when that row is clear, or just below it on the right edge. It checks the text and buttons underneath and moves to the nearest
 * clear spot, so it never hides the invitation. A shadow root keeps the template's styles from reaching it.
 */
function withContactButton(html: string, title: string) {
  const href = `/api/whatsapp?template=${encodeURIComponent(title)}`;
  const script = `<script>(() => {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;z-index:2147483647;top:calc(8px + env(safe-area-inset-top,0px));right:calc(14px + env(safe-area-inset-right,0px));transition:top .4s cubic-bezier(.16,1,.3,1),left .4s cubic-bezier(.16,1,.3,1);";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = \`<style>
    a { display:flex; align-items:center; gap:7px; height:36px; padding:0 13px 0 6px; border-radius:999px; box-sizing:border-box;
        background:#14110deb; border:1px solid #f4d49d66; box-shadow:0 8px 24px #0006, 0 0 0 3px #25d36624; color:#fbeed8; text-decoration:none;
        font:600 12px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif; white-space:nowrap; -webkit-tap-highlight-color:transparent;
        -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); transition:transform .25s; }
    :host(:not([data-spot])) { visibility:hidden; }
    :host([data-spot]) a { animation:in .6s cubic-bezier(.16,1,.3,1) both; }
    a:hover { transform:translateY(1px); }
    a:focus-visible { outline:2px solid #f4d49d; outline-offset:3px; }
    svg { flex-shrink:0; }
    small { display:block; margin-bottom:1px; font-size:9px; font-weight:500; letter-spacing:.05em; color:#d9a967; }
    @keyframes in { from { opacity:0; transform:translateY(-12px); } }
    @media (prefers-reduced-motion:reduce) { a, :host([data-spot]) a { transition:none; animation:none; } }
  </style><a href=${JSON.stringify(href)} target="_blank" rel="noopener" aria-label="Want this design? Chat with us on WhatsApp">${WHATSAPP_MARK}<span><small>Want this design?</small>Chat with us</span></a>\`;
  const H = 36;
  // How far down the right edge it may go looking for a clear spot.
  const below = () => Math.min(300, innerHeight * 0.36);
  const link = root.querySelector("a");
  let edge = null;
  const visible = el => !el.checkVisibility || el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
  const near = r => r.width > 0 && r.top < edge.top + below() + H + 4 && r.bottom > 0;
  // Boxes of the template's visible text and controls near the top (decorative images may be covered).
  const blockers = () => {
    const boxes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node; (node = walker.nextNode());) {
      const el = node.parentElement;
      if (!el || !node.textContent.trim() || !near(el.getBoundingClientRect()) || !visible(el)) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) if (near(r)) boxes.push(r);
    }
    for (const el of document.querySelectorAll("button,a,input,select,textarea,[role=button],[onclick]")) {
      const r = el.getBoundingClientRect();
      if (near(r) && r.width < innerWidth * 0.7 && visible(el)) { r.control = true; boxes.push(r); }
    }
    return boxes;
  };
  const clearAt = (left, top, w, boxes) => boxes.every(r => r.bottom < top - 4 || r.top > top + H + 4 || r.right < left - 4 || r.left > left + w + 4);
  // The invitation's own frame: on desktop many designs are a centred column, and the button belongs at
  // that column's top-right corner, as on a phone. Full-width designs use the whole screen.
  const frame = () => {
    for (const el of document.elementsFromPoint(innerWidth / 2, innerHeight / 2).reverse()) {
      const r = el.getBoundingClientRect();
      if (r.width >= 280 && r.width < innerWidth * 0.8 && r.height >= innerHeight * 0.9 && Math.abs(r.left + r.right - innerWidth) < 80)
        return { left: Math.max(0, r.left), right: Math.min(innerWidth, r.right) };
    }
    return { left: 0, right: innerWidth };
  };
  // In order: the top row beside the corner control, then just below it on the right edge.
  const spots = w => {
    const f = frame(), right = f.right - edge.right - w, list = [];
    for (let left = right; left >= f.left + (f.right - f.left) * 0.3; left -= 6) list.push([left, edge.top]);
    for (let top = edge.top + 44; top <= edge.top + below(); top += 6) list.push([right, top]);
    return list;
  };
  const move = ([left, top]) => {
    host.dataset.spot = left + "," + top;
    host.style.right = "auto";
    host.style.left = left + "px";
    host.style.top = top + "px";
  };
  const place = fresh => {
    const w = link.offsetWidth, boxes = blockers();
    const current = !fresh && host.dataset.spot && host.dataset.spot.split(",").map(Number);
    if (current && clearAt(current[0], current[1], w, boxes)) return;
    const list = spots(w);
    // Nowhere fully clear: the spot covering the least text, never over the template's buttons.
    const covered = ([left, top]) => boxes.reduce((sum, r) =>
      sum + Math.max(0, Math.min(r.right, left + w) - Math.max(r.left, left)) * Math.max(0, Math.min(r.bottom, top + H) - Math.max(r.top, top)), 0);
    const controls = boxes.filter(r => r.control);
    const spot = list.find(([left, top]) => clearAt(left, top, w, boxes))
      || list.filter(([left, top]) => clearAt(left, top, w, controls)).sort((a, b) => covered(a) - covered(b))[0]
      || list[0];
    move(spot);
  };
  // The corner's offsets, safe areas included, measured with a throwaway marker so the button need not move.
  const measure = () => {
    const marker = document.createElement("div");
    marker.style.cssText = "position:fixed;visibility:hidden;width:1px;height:1px;top:calc(8px + env(safe-area-inset-top,0px));right:calc(14px + env(safe-area-inset-right,0px));";
    document.body.appendChild(marker);
    const r = marker.getBoundingClientRect();
    marker.remove();
    edge = { top: r.top, right: innerWidth - r.right };
    place(true);
  };
  const add = () => {
    document.body.appendChild(host);
    setTimeout(measure, 400);
    // Templates move between screens, so the spot is checked again as the content changes.
    setInterval(() => edge && place(), 1500);
    addEventListener("resize", measure);
  };
  document.body ? add() : addEventListener("DOMContentLoaded", add);

  // The designs carry placeholder reply contacts, so in the preview "Will You Join Us?" and every WhatsApp
  // action reach WeInviteU's WhatsApp instead, keeping the reply message the design writes.
  const toWhatsApp = text => "/api/whatsapp?text=" + encodeURIComponent(text || ${JSON.stringify(`Invitation reply (${title}): I'd love to join!`).replace(/</g, "\\u003c")});
  const rewrite = url => {
    try {
      const u = new URL(String(url), location.href);
      if (/^(wa\\.me|api\\.whatsapp\\.com|web\\.whatsapp\\.com)$/i.test(u.hostname) || u.protocol === "whatsapp:") return toWhatsApp(u.searchParams.get("text"));
    } catch {}
    return null;
  };
  const open = window.open.bind(window);
  window.open = (url, ...rest) => open(rewrite(url) || url, ...rest);
  // Links are rewritten in place (and again whenever a design sets them), so they work however a design handles taps.
  const fixLinks = () => {
    for (const a of document.querySelectorAll("a[href]")) {
      const reply = /^mailto:/i.test(a.getAttribute("href")) && (a.id === "rsvp" || /join us/i.test(a.textContent));
      const to = reply ? toWhatsApp() : rewrite(a.href);
      if (!to || a.getAttribute("href") === to) continue;
      a.setAttribute("href", to);
      a.target = "_blank";
      a.rel = "noopener";
    }
  };
  let queued = false;
  new MutationObserver(() => { if (!queued) { queued = true; queueMicrotask(() => { queued = false; fixLinks(); }); } })
    .observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["href"] });
  fixLinks();
})();</script>`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${script}$&`) : html + script;
}

/** The full-screen invitation at a readable address. Search engines are sent to the template page instead. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const template = findTemplate(await loadVisibleTemplates(), id);
  if (!template) return new Response("Template not found", { status: 404 });
  if (template.slug !== id) return Response.redirect(new URL(templatePreviewPath(template), request.url), 308);
  const embed = new URL(request.url).searchParams.has("embed");
  // Bundled files are large static assets, so they are fetched rather than packaged with this function.
  const file = template.filename.startsWith("http")
    ? await readRegisteredTemplate(supabase, template.filename).catch(() => null)
    : await fetch(new URL(getTemplateUrl(template.filename), request.url)).then(res => res.ok ? res.body : null).catch(() => null);
  if (!file) return new Response("Template not found", { status: 404 });
  const html = typeof file === "string" ? file : await new Response(file).text();
  // The template page's phone needs the opener for tap-to-open; the full-screen preview gets the WhatsApp button.
  // Both are added here so no template file has to change.
  const body = embed ? withOpener(html) : withContactButton(html, template.title);
  return new Response(body, { headers: {
    ...(embed ? { "Cache-Control": "public, max-age=300" } : {}),
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals; base-uri 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, follow",
    Link: `<${new URL(templatePath(template), request.url)}>; rel="canonical"`,
  } });
}

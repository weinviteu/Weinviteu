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
 * A floating WhatsApp button for visitors who want the design, always showing its label. It is pinned to the
 * top-left corner of the invitation: the screen's corner on phones and full-width designs, and the corner of the
 * invitation's centred column on desktop. It is placed once when the page loads and checked once more when the
 * guest opens the invitation (a few designs change layout then), so it never wanders while the invitation plays.
 * A shadow root keeps the template's styles from reaching it.
 */
function withContactButton(html: string, title: string) {
  const href = `/api/whatsapp?template=${encodeURIComponent(title)}`;
  const script = `<script>(() => {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;z-index:2147483647;top:calc(12px + env(safe-area-inset-top,0px));left:calc(12px + env(safe-area-inset-left,0px));";
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
  // The invitation's own frame: on desktop many designs are a centred column; full-width designs use the whole screen.
  const frameLeft = () => {
    for (const el of document.elementsFromPoint(innerWidth / 2, innerHeight / 2).reverse()) {
      const r = el.getBoundingClientRect();
      if (r.width >= 280 && r.width < innerWidth * 0.8 && r.height >= innerHeight * 0.9 && Math.abs(r.left + r.right - innerWidth) < 80) return Math.max(0, Math.round(r.left));
    }
    return 0;
  };
  const pin = () => { host.style.left = "calc(" + (frameLeft() + 12) + "px + env(safe-area-inset-left,0px))"; host.dataset.spot = "pinned"; };
  const add = () => {
    document.body.appendChild(host);
    setTimeout(pin, 500);
    addEventListener("pointerdown", () => setTimeout(pin, 4000), { once: true, capture: true }); // after the opening animation
    addEventListener("resize", pin);
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
  const fixLink = a => {
    const href = a.getAttribute("href");
    if (!href || href.startsWith("/api/whatsapp")) return;
    const reply = /^mailto:/i.test(href) && (a.id === "rsvp" || /join us/i.test(a.textContent));
    const to = reply ? toWhatsApp() : rewrite(a.href);
    if (!to || href === to) return;
    a.setAttribute("href", to);
    a.target = "_blank";
    a.rel = "noopener";
  };
  const fixWithin = node => {
    if (node.nodeType !== 1) return;
    if (node.matches("a[href]")) fixLink(node);
    if (node.firstElementChild) for (const a of node.querySelectorAll("a[href]")) fixLink(a);
  };
  // Only links that were added or changed are checked, so busy animated designs stay smooth.
  new MutationObserver(records => {
    for (const r of records) {
      if (r.type === "attributes") { if (r.target.matches && r.target.matches("a[href]")) fixLink(r.target); }
      else r.addedNodes.forEach(fixWithin);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["href"] });
  fixWithin(document.body);
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

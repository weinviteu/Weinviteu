import { supabase } from "@/lib/supabase";
import { findTemplate, loadVisibleTemplates } from "@/lib/template-catalogue";
import { readRegisteredTemplate } from "@/lib/template-source";
import { getTemplateUrl, templatePath, templatePreviewPath } from "@/lib/template-url";

function withOpener(html: string) {
  if (/<script[^>]+autoscroll\.js/i.test(html)) return html;
  return html.replace(/<head\b[^>]*>/i, '$&<script src="/templates/autoscroll.js"></script>');
}

/** The full-screen invitation at a readable address. Search engines are sent to the template page instead. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const template = findTemplate(await loadVisibleTemplates(), id);
  if (!template) return new Response("Template not found", { status: 404 });
  if (template.slug !== id) return Response.redirect(new URL(templatePreviewPath(template), request.url), 308);
  const embed = new URL(request.url).searchParams.has("embed");
  // Bundled files are large static assets, so they are streamed rather than packaged with this function.
  const file = template.filename.startsWith("http")
    ? await readRegisteredTemplate(supabase, template.filename).catch(() => null)
    : await fetch(new URL(getTemplateUrl(template.filename), request.url)).then(res => res.ok ? res.body : null).catch(() => null);
  if (!file) return new Response("Template not found", { status: 404 });
  // The template page's phone needs the opener for tap-to-open. Added here so no template file has to change.
  const body = embed ? withOpener(typeof file === "string" ? file : await new Response(file).text()) : file;
  return new Response(body, { headers: {
    ...(embed ? { "Cache-Control": "public, max-age=300" } : {}),
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-popups allow-modals; base-uri 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, follow",
    Link: `<${new URL(templatePath(template), request.url)}>; rel="canonical"`,
  } });
}

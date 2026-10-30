const posters = new Set([
  "wedding-premium-cinematic.html",
  "wedding-luxury-south-indian.html",
  "grand-opening-premium.html",
  "gruhapravesham-premium.html",

  "baby-naming-little-star.html",
  "wedding-golden-vows.html",
  "birthday-golden-wish.html",
  "baby-shower-moonlit-wishes.html",
  "traditional-sacred-beginnings.html",
  "corporate-the-next-chapter.html",
  "anniversary-still-us.html",
  "opening-ceremony-the-grand-reveal.html",

  "7000976f-027a-42b7-a947-4e4040a62f0b.html",
  "2e1171ae-aab1-4889-904d-8b5190d39f10.html",
  "516de1c5-0060-4e76-8223-0c3f4ef239d1.html",
  "ff132fd0-358a-4d33-a4b1-a36a97296ec1.html",
  "c0c8e07c-38f0-450d-8a24-c77e494b20bc.html",
  "6513baff-07a1-4ce1-a3cf-fc0ea704e8bf.html",
  "anniversary-invitation (1).html",
  "baby-shower-invitation.html",
  "birthday-invitation.html",
  "birthday-red-gold.html",
  "griha-pravesh-invitation.html",
  "invitation (2).html",
  "pooja-invitation.html",
  "summit-invitation.html",
  "temple-invitation.html",
  "grand-opening-maroon-curtains-fixed 2.html",
  "housewarming-invitation-bundled.html"
]);

const UPLOADED = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.html$/;

/** Storage object, next to the uploaded HTML in the base-templates bucket, holding its cover image. */
export function posterObjectName(id: string) {
  return `posters/${id}`;
}

/**
 * Bundled templates use a poster from public/template-posters. Templates uploaded from the admin
 * panel point at the cover stored with them, which may not exist; callers fall back to the live page.
 */
export function getTemplatePoster(filename: string): string | null {
  let name: string;
  try { name = decodeURIComponent(filename.split("/").pop()!.split("?")[0]); } catch { return null; }
  if (posters.has(name)) return `/template-posters/${encodeURIComponent(name.replace(/\.html$/, ""))}.webp`;
  const uploaded = UPLOADED.exec(name);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return uploaded && base ? `${base.replace(/\/$/, "")}/storage/v1/object/public/base-templates/${posterObjectName(uploaded[1])}` : null;
}

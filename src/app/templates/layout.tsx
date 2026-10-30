import { SITE_NAME, pageOpenGraph } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  // Restate the site template so template pages below this layout keep the "| WeInviteU" suffix.
  title: {
    absolute: `3D Digital Invitation Templates – Wedding, Birthday, Griha Pravesh & More | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Browse WeInviteU's collection of premium 3D digital invitation templates in Simple, Premium and Luxury collections — weddings, engagements, birthdays, baby showers, naming ceremonies, griha pravesh, poojas, anniversaries and grand openings. Preview every design live; prices start from ₹1,999.",
  keywords: ["digital invitation templates", "3D e-invite designs", "wedding invitation templates", "birthday invitation templates", "griha pravesh invitation design", "naming ceremony invitation template", "luxury wedding e-invite", "WhatsApp invitation templates"],
  alternates: { canonical: "/templates" },
  openGraph: pageOpenGraph({
    url: "/templates",
    title: "3D Digital Invitation Templates | WeInviteU",
    description: "Simple, Premium and Luxury 3D digital invitations for every Indian celebration. Preview live — from ₹1,999.",
  }),
};

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

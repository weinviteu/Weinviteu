import { pageOpenGraph } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us – Order or Customise Your 3D Digital Invitation",
  description:
    "Talk to the WeInviteU studio on WhatsApp or send an inquiry to order a 3D digital invitation, request a custom design, or ask about pricing and delivery. Most invitations are ready within 24–48 hours.",
  alternates: { canonical: "/contact" },
  openGraph: pageOpenGraph({ url: "/contact", title: "Contact WeInviteU – Order Your 3D Digital Invitation" }),
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

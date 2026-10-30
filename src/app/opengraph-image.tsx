import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "WeInviteU – premium 3D digital invitations for weddings, birthdays and every celebration";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card shown when any page without its own image is posted on WhatsApp, Facebook or X. */
export default async function OpengraphImage() {
  const logo = `data:image/png;base64,${(await readFile(join(process.cwd(), "public/images/logo.png"))).toString("base64")}`;
  const occasions = ["Weddings", "Birthdays", "Baby Showers", "Naming Ceremonies", "Griha Pravesh", "Grand Openings"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", color: "#fbf3e3", background: "radial-gradient(ellipse at 85% 15%, #6e3a1a 0%, #24150f 45%, #0d0907 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <img src={logo} width={96} height={96} alt="" style={{ borderRadius: 18 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 46, fontWeight: 700 }}>WeInviteU</span>
            <span style={{ fontSize: 18, letterSpacing: 6, color: "#e8c277" }}>A LITTLE MORE PERSONAL</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>Premium 3D digital invitations</span>
          <span style={{ fontSize: 30, color: "#d9c3a0" }}>Preview live · Personalised for you · One link for unlimited guests</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", maxWidth: 820 }}>
            {occasions.map(o => (
              <span key={o} style={{ fontSize: 20, padding: "8px 18px", borderRadius: 999, border: "1px solid #d9a96788", color: "#f4d49d" }}>{o}</span>
            ))}
          </div>
          <span style={{ fontSize: 30, fontWeight: 700, padding: "14px 28px", borderRadius: 999, background: "linear-gradient(110deg, #dfad65, #f3d4a3)", color: "#241a12" }}>From ₹1,999</span>
        </div>
      </div>
    ),
    size,
  );
}

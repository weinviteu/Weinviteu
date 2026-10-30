import ScrollToTop from "@/components/ScrollToTop";

export default function Loading() {
  // Full-height so the footer stays below the fold until the page arrives (no layout jump).
  return (
    <main className="page-loading" aria-busy="true">
      <ScrollToTop />
      <span className="page-loading-mark" aria-hidden="true" />
      <p>Preparing something beautiful…</p>
    </main>
  );
}

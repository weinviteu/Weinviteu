import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty">
      <p className="eyebrow">404 / A LITTLE LOST</p>
      <h1>This invitation hasn’t arrived.</h1>
      <p>The page you’re looking for could not be found.</p>
      <Link className="button" href="/designs">
        Explore designs ↗
      </Link>
    </main>
  );
}

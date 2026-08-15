import Link from "next/link";

export default function NotFound() {
  return (
    <main className="error-page">
      <div className="empty-orbit">404</div>
      <h1>Nothing is orbiting here</h1>
      <p>The page may have moved, or the link no longer exists.</p>
      <Link className="button primary" href="/acme/issues">Return to issues</Link>
    </main>
  );
}

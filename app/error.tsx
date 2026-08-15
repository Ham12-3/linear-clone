"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page">
      <div className="empty-orbit">!</div>
      <h1>This view could not be loaded</h1>
      <p>The workspace is intact. Retry the request or return to issues.</p>
      <button className="button primary" onClick={reset}>Try again</button>
    </main>
  );
}

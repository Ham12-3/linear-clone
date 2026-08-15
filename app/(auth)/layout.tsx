import Link from "next/link";
import { ArrowLeft, Command, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link href="/login" className="auth-brand"><span>O</span><strong>Orbit</strong></Link>
        <div className="auth-story-content">
          <p className="eyebrow">Product work, in motion</p>
          <h1>Keep the team close to the work that matters.</h1>
          <p>Plan projects, move issues, and make decisions in one focused workspace built for speed.</p>
          <div className="auth-proof">
            <span><Command size={15} />Keyboard-first navigation</span>
            <span><ShieldCheck size={15} />Protected team workspaces</span>
          </div>
        </div>
        <p className="auth-story-footer">Original productivity software for modern product teams.</p>
      </section>
      <section className="auth-form-side">
        <Link href="/login" className="auth-back"><ArrowLeft size={14} />Back to sign in</Link>
        {children}
      </section>
    </main>
  );
}

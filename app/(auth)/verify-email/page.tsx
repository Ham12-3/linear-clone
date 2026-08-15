import Link from "next/link";
import { CheckCircle2, CircleX } from "lucide-react";
import { verifyEmailToken } from "@/lib/auth/actions";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const verified = token ? await verifyEmailToken(token) : false;
  return (
    <div className="auth-card auth-result">
      <span className={verified ? "result-icon success" : "result-icon error"}>{verified ? <CheckCircle2 size={23} /> : <CircleX size={23} />}</span>
      <p className="eyebrow">Email verification</p>
      <h2>{verified ? "Your email is verified" : "This link is no longer valid"}</h2>
      <p>{verified ? "Your Orbit account is ready. Sign in to create or join a workspace." : "Verification links expire after 24 hours and can only be used once."}</p>
      <Link className="button primary auth-submit" href="/login">Continue to sign in</Link>
    </div>
  );
}

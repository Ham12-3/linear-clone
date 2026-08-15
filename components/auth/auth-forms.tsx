"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, CheckCircle2, GitBranch, KeyRound, LockKeyhole, Mail, UserRound } from "lucide-react";
import { forgotPasswordAction, loginAction, oauthSignInAction, resetPasswordAction, signupAction } from "@/lib/auth/actions";
import { initialAuthState, type AuthActionState } from "@/lib/auth/action-state";

export function LoginForm({ googleEnabled, githubEnabled }: { googleEnabled: boolean; githubEnabled: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initialAuthState);
  return <AuthCard eyebrow="Welcome back" title="Sign in to Orbit" detail="Use your work email to continue to your workspace.">
    <SocialButtons googleEnabled={googleEnabled} githubEnabled={githubEnabled} />
    {(googleEnabled || githubEnabled) && <div className="auth-divider"><span>or continue with email</span></div>}
    <form action={action} className="auth-form">
      <AuthField name="email" label="Work email" type="email" autoComplete="email" icon={<Mail size={15} />} error={firstError(state, "email")} />
      <AuthField name="password" label="Password" type="password" autoComplete="current-password" icon={<LockKeyhole size={15} />} error={firstError(state, "password")} />
      <div className="auth-form-meta"><label><input type="checkbox" name="remember" />Keep me signed in</label><Link href="/forgot-password">Forgot password?</Link></div>
      <ActionNotice state={state} />
      <button className="button primary auth-submit" disabled={pending}>{pending ? "Signing in…" : <>Sign in <ArrowRight size={15} /></>}</button>
    </form>
    <p className="auth-switch">New to Orbit? <Link href="/signup">Create an account</Link></p>
  </AuthCard>;
}

export function SignupForm({ googleEnabled, githubEnabled }: { googleEnabled: boolean; githubEnabled: boolean }) {
  const [state, action, pending] = useActionState(signupAction, initialAuthState);
  return <AuthCard eyebrow="Start focused" title="Create your account" detail="Set up your identity, then create your first workspace.">
    <SocialButtons googleEnabled={googleEnabled} githubEnabled={githubEnabled} />
    {(googleEnabled || githubEnabled) && <div className="auth-divider"><span>or use your work email</span></div>}
    <form action={action} className="auth-form">
      <AuthField name="name" label="Full name" type="text" autoComplete="name" icon={<UserRound size={15} />} error={firstError(state, "name")} />
      <AuthField name="email" label="Work email" type="email" autoComplete="email" icon={<Mail size={15} />} error={firstError(state, "email")} />
      <AuthField name="password" label="Password" type="password" autoComplete="new-password" icon={<LockKeyhole size={15} />} error={firstError(state, "password")} hint="10+ characters with upper, lower, and a number" />
      <ActionNotice state={state} />
      <button className="button primary auth-submit" disabled={pending || state.status === "success"}>{pending ? "Creating account…" : state.status === "success" ? "Check your email" : <>Create account <ArrowRight size={15} /></>}</button>
    </form>
    <p className="auth-legal">By continuing, you agree to keep workspace data secure and follow your organisation’s policies.</p>
    <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
  </AuthCard>;
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialAuthState);
  return <AuthCard eyebrow="Account recovery" title="Reset your password" detail="Enter your account email. Reset links remain valid for one hour.">
    <form action={action} className="auth-form">
      <AuthField name="email" label="Work email" type="email" autoComplete="email" icon={<Mail size={15} />} error={firstError(state, "email")} />
      <ActionNotice state={state} />
      <button className="button primary auth-submit" disabled={pending}>{pending ? "Sending link…" : <>Send reset link <ArrowRight size={15} /></>}</button>
    </form>
    <p className="auth-switch"><Link href="/login">Return to sign in</Link></p>
  </AuthCard>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialAuthState);
  return <AuthCard eyebrow="Secure reset" title="Choose a new password" detail="Use a password you have not used for this account before.">
    <form action={action} className="auth-form">
      <input type="hidden" name="token" value={token} />
      <AuthField name="password" label="New password" type="password" autoComplete="new-password" icon={<KeyRound size={15} />} error={firstError(state, "password")} hint="10+ characters with upper, lower, and a number" />
      <ActionNotice state={state} />
      <button className="button primary auth-submit" disabled={pending || !token}>{pending ? "Updating password…" : <>Update password <ArrowRight size={15} /></>}</button>
    </form>
    {!token && <p className="auth-inline-error">Open the complete reset link from your email.</p>}
    {state.status === "success" && <p className="auth-switch"><Link href="/login">Continue to sign in</Link></p>}
  </AuthCard>;
}

function AuthCard({ eyebrow, title, detail, children }: { eyebrow: string; title: string; detail: string; children: React.ReactNode }) {
  return <div className="auth-card"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p className="auth-detail">{detail}</p>{children}</div>;
}

function SocialButtons({ googleEnabled, githubEnabled }: { googleEnabled: boolean; githubEnabled: boolean }) {
  if (!googleEnabled && !githubEnabled) return null;
  return <div className="social-auth-buttons">
    {googleEnabled && <form action={oauthSignInAction}><input type="hidden" name="provider" value="google" /><button className="button"><span className="google-g">G</span>Google</button></form>}
    {githubEnabled && <form action={oauthSignInAction}><input type="hidden" name="provider" value="github" /><button className="button"><GitBranch size={15} />GitHub</button></form>}
  </div>;
}

function AuthField({ name, label, type, autoComplete, icon, error, hint }: { name: string; label: string; type: string; autoComplete: string; icon: React.ReactNode; error?: string; hint?: string }) {
  return <label className="auth-field"><span>{label}</span><div className={error ? "has-error" : ""}>{icon}<input name={name} type={type} autoComplete={autoComplete} required /></div>{error ? <small className="field-error">{error}</small> : hint ? <small>{hint}</small> : null}</label>;
}

function ActionNotice({ state }: { state: AuthActionState }) {
  if (!state.message) return null;
  return <p className={state.status === "success" ? "auth-notice success" : "auth-notice error"}>{state.status === "success" && <CheckCircle2 size={14} />}{state.message}</p>;
}

function firstError(state: AuthActionState, field: string): string | undefined {
  return state.fieldErrors?.[field]?.[0];
}

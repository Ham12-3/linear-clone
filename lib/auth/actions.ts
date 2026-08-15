"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { deliverAuthEmail } from "@/lib/email/service";
import { hashPassword } from "@/lib/auth/password";
import { createOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { emailSchema, loginSchema, resetPasswordSchema, signupSchema } from "@/lib/auth/validation";
import { consumeRateLimit } from "@/lib/rate-limit";
import type { AuthActionState } from "@/lib/auth/action-state";

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return validationState(parsed.error.flatten().fieldErrors);

  try {
    const allowed = await consumeRateLimit({ namespace: "login", identifier: parsed.data.email, limit: 8, windowMs: 15 * 60_000 });
    if (!allowed) return { status: "error", message: "Too many sign-in attempts. Try again in 15 minutes." };
    await signIn("credentials", { ...parsed.data, redirectTo: "/onboarding" });
  } catch (error) {
    if (error instanceof AuthError) return { status: "error", message: "Email or password is incorrect, or the email has not been verified." };
    throw error;
  }
  return { status: "success" };
}

export async function signupAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({ name: formData.get("name"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return validationState(parsed.error.flatten().fieldErrors);

  const allowed = await consumeRateLimit({ namespace: "signup", identifier: parsed.data.email, limit: 4, windowMs: 60 * 60_000 });
  if (!allowed) return { status: "error", message: "Too many accounts were requested for this email. Try again later." };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { status: "error", message: "An account already exists for this email." };

  const passwordHash = await hashPassword(parsed.data.password);
  const token = createOpaqueToken();
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      verificationTokens: { create: { tokenHash: token.hash, expiresAt: new Date(Date.now() + 24 * 60 * 60_000) } },
    },
  });
  await deliverAuthEmail({ to: parsed.data.email, subject: "Verify your Orbit account", preview: "Verify your email to start using Orbit.", actionUrl: appUrl(`/verify-email?token=${encodeURIComponent(token.raw)}`) });
  return { status: "success", message: "Account created. Check your email to verify it before signing in." };
}

export async function forgotPasswordAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { status: "error", fieldErrors: { email: parsed.error.issues.map((issue) => issue.message) } };
  const allowed = await consumeRateLimit({ namespace: "password-reset", identifier: parsed.data, limit: 4, windowMs: 60 * 60_000 });
  if (!allowed) return { status: "success", message: "If the account exists, a reset link will arrive shortly." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data } });
  if (user) {
    const token = createOpaqueToken();
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: token.hash, expiresAt: new Date(Date.now() + 60 * 60_000) } }),
    ]);
    await deliverAuthEmail({ to: user.email, subject: "Reset your Orbit password", preview: "Use this secure link within one hour.", actionUrl: appUrl(`/reset-password?token=${encodeURIComponent(token.raw)}`) });
  }
  return { status: "success", message: "If the account exists, a reset link will arrive shortly." };
}

export async function resetPasswordAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({ token: formData.get("token"), password: formData.get("password") });
  if (!parsed.success) return validationState(parsed.error.flatten().fieldErrors);
  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return { status: "error", message: "This reset link is invalid or has expired." };
  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return { status: "success", message: "Password updated. You can now sign in." };
}

export async function verifyEmailToken(rawToken: string): Promise<boolean> {
  if (rawToken.length < 32) return false;
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return false;
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return true;
}

export async function oauthSignInAction(formData: FormData): Promise<void> {
  const provider = formData.get("provider");
  if (provider !== "google" && provider !== "github") return;
  await signIn(provider, { redirectTo: "/onboarding" });
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

function validationState(fieldErrors: Record<string, string[] | undefined>): AuthActionState {
  return { status: "error", fieldErrors: Object.fromEntries(Object.entries(fieldErrors).filter((entry): entry is [string, string[]] => Boolean(entry[1]))) };
}

function appUrl(path: string): string {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString();
}

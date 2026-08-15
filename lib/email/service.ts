interface AuthEmail {
  to: string;
  subject: string;
  actionUrl: string;
  preview: string;
}

export async function deliverAuthEmail(email: AuthEmail): Promise<void> {
  if (process.env.EMAIL_DELIVERY === "console" || process.env.NODE_ENV !== "production") {
    console.info(`[auth-email] ${email.subject} -> ${email.to}: ${email.actionUrl}`);
    return;
  }

  throw new Error("Configure a transactional email provider before enabling production email delivery.");
}

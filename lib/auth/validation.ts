import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

export const passwordSchema = z.string()
  .min(10, "Use at least 10 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number");

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password") });

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const resetPasswordSchema = z.object({ token: z.string().min(32), password: passwordSchema });

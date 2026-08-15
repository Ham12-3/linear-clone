import { SignupForm } from "@/components/auth/auth-forms";

export default function SignupPage() {
  return <SignupForm googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID)} githubEnabled={Boolean(process.env.AUTH_GITHUB_ID)} />;
}

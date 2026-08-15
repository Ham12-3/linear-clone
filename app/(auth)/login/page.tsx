import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/auth-forms";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/acme/issues");
  return <LoginForm googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID)} githubEnabled={Boolean(process.env.AUTH_GITHUB_ID)} />;
}

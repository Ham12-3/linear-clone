import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listUserWorkspaces } from "@/lib/db/workspaces";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user.id) redirect("/login");
  const memberships = await listUserWorkspaces(session.user.id);
  if (memberships[0]) redirect(`/${memberships[0].workspace.slug}/issues`);
  return <OnboardingForm name={session.user.name ?? "there"} />;
}

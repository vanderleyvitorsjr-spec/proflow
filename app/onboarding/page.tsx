import { redirect } from "next/navigation";
import { getCurrentUserContext, requireAuthenticatedUser } from "@/lib/auth/context";
import { OnboardingForm } from "./onboarding-form";
export default async function OnboardingPage() {
  const auth = await requireAuthenticatedUser();
  if (await getCurrentUserContext()) redirect("/dashboard");
  return <main className="min-h-screen bg-background p-4 py-10 sm:p-8"><OnboardingForm email={auth.email ?? ""} /></main>;
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/**
 * Public invite landing page.
 * URL: /invite/AB12CD34
 *
 * If the user is already authenticated and has completed onboarding,
 * redirect them directly to the team join page with the code.
 * If not authenticated, redirect to signup with the invite code preserved.
 * If authenticated but not onboarded, redirect to onboarding with the invite.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upperCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

  if (upperCode.length !== 8) {
    redirect("/login");
  }

  const session = await getSession();

  if (!session?.user?.id) {
    // Not authenticated — send to signup, with callbackUrl pointing to team join
    redirect(`/signup?callbackUrl=${encodeURIComponent(`/teams/join?code=${upperCode}`)}`);
  }

  if (!session.user.onboardingComplete) {
    // Authenticated but not onboarded — send to onboarding with invite
    redirect(`/onboarding?invite=${upperCode}`);
  }

  // Fully onboarded — send to join page directly
  redirect(`/teams/join?code=${upperCode}`);
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/DashboardNav";
import GuestBanner from "@/components/GuestBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [dbUser, membership] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { role: true, onboardingDone: true, isAlsoLearning: true, isGuest: true },
    }),
    prisma.orgMembership.findFirst({
      where: { userId: session.user.id! },
      select: { role: true },
    }),
  ]);

  // Stale JWT pointing to a deleted user — boot back to login
  if (!dbUser) redirect("/login");

  // Force onboarding if not completed
  if (!dbUser.onboardingDone) redirect("/onboarding");

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex" }}>
      {dbUser.isGuest && <GuestBanner />}
      {/* Push layout down when guest banner is visible */}
      <div style={{ display: "flex", flex: 1, paddingTop: dbUser.isGuest ? "37px" : 0, width: "100%" }}>
        <DashboardNav user={session.user} userRole={dbUser.role} orgRole={membership?.role ?? null} isAlsoLearning={dbUser.isAlsoLearning} />
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
}

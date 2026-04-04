import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, timezone: true, tier: true, integrityScore: true, createdAt: true },
  });

  if (!user) return null;

  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", marginBottom: "0.5rem" }}>Settings</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>Manage your account and preferences.</p>

      <SettingsForm user={{ ...user, createdAt: user.createdAt.toISOString() }} userId={userId} />
    </div>
  );
}

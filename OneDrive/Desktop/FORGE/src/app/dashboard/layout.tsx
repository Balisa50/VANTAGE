import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex" }}>
      <DashboardNav user={session.user} />
      <main style={{ flex: 1, marginLeft: "240px", padding: "2rem", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}

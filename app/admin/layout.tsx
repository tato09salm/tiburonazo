import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/dashboard/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "ADMIN" && role !== "VENDEDOR")) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar role={role} userName={session.user?.name ?? ""} />
      <main className="flex-1 p-6 pt-20 sm:pt-6 bg-gray-50 h-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { getMyOrders } from "@/actions/order.actions";
import { getMyAddresses } from "@/actions/address.actions"; // Importamos la nueva acción
import { redirect } from "next/navigation";
import { AccountTabs } from "@/components/store/cuenta/AccountTabs";
import { WelcomeHeader } from "@/components/store/cuenta/WelcomeHeader";

interface Props {
  searchParams: Promise<{ success?: string; tab?: string; subtab?: string }>;
}

export default async function AccountPage({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const orders = await getMyOrders();
  const initialAddresses = await getMyAddresses(); // Traemos las direcciones de la BD

  const activeTab = sp.tab || "cuenta";
  const activeSubtab = sp.subtab || "datos";

  const initialUserData = {
    firstName: session.user?.firstName || "",
    lastName: session.user?.lastName || "",
    email: session.user?.email || "",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-[70vh]">
      <WelcomeHeader initialUserData={initialUserData} />

      <AccountTabs
        activeTab={activeTab}
        activeSubtab={activeSubtab}
        userData={initialUserData}
        orders={orders}
        initialAddresses={initialAddresses} // Se lo inyectamos a los Tabs
      />
    </div>
  );
}
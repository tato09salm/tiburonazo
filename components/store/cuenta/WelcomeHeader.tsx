"use client";

import { useSession } from "next-auth/react";

interface Props {
    initialUserData: { firstName: string; lastName: string; email: string };
}

export function WelcomeHeader({ initialUserData }: Props) {
    const { data: session } = useSession();

    const firstName = session?.user?.firstName ?? initialUserData.firstName;
    const lastName = session?.user?.lastName ?? initialUserData.lastName;

    const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Cliente";

    return (
        <div className="text-center mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-gray-950 tracking-tight">
                Hola, <span className="text-[#11ABC4]">{displayName}</span>
            </h1>
        </div>
    );
}
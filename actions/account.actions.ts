"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: { firstName: string; lastName: string; email: string }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autorizado");

    const normalizedEmail = data.email.toLowerCase().trim();

    // Verificar duplicados si cambia de correo
    if (normalizedEmail !== session.user.email) {
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) throw new Error("El correo ya está registrado por otro usuario.");
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            firstName: data.firstName || null,
            lastName: data.lastName || null,
            email: normalizedEmail,
        },
    });

    revalidatePath("/cuenta");
}
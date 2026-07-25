"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Obtener todas las direcciones del usuario autenticado
export async function getMyAddresses() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await prisma.address.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });
}

// Crear o Actualizar dirección
export async function saveAddress(data: {
    id?: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    reference?: string;
    ubigeo: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autorizado");

    // Si es la primera dirección o viene marcada como principal, manejamos el default
    const existingAddresses = await prisma.address.count({ where: { userId: session.user.id } });
    const isFirst = existingAddresses === 0;

    if (data.id) {
        // Actualizar existente
        await prisma.address.update({
            where: { id: data.id, userId: session.user.id },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                address: data.address,
                reference: data.reference || null,
                ubigeo: data.ubigeo,
            },
        });
    } else {
        // Crear nueva dirección en la Base de Datos
        await prisma.address.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                address: data.address,
                reference: data.reference || null,
                ubigeo: data.ubigeo,
                isDefault: isFirst, // Si es la primera, es predeterminada
                userId: session.user.id,
            },
        });
    }

    revalidatePath("/cuenta");
}

// Cambiar dirección predeterminada
export async function setDefaultAddress(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autorizado");

    // Quitamos el default a todas las del usuario
    await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
    });

    // Asignamos la nueva principal
    await prisma.address.update({
        where: { id, userId: session.user.id },
        data: { isDefault: true },
    });

    revalidatePath("/cuenta");
}

export async function deleteAddress(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("No autorizado");

    await prisma.address.delete({
        where: { id, userId: session.user.id }
    });

    revalidatePath("/cuenta");
}
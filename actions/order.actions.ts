"use server";

import { prisma } from "@/lib/prisma";
import { generateOrderCode } from "@/lib/utils";
import { PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

export async function createOrder(data: {
  paymentMethod: PaymentMethod;
  address?: string;
  notes?: string;
  culqiChargeId?: string;
  items: Array<{ variantId: string; quantity: number; price: number }>;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const shippingCost = 0;
  const total = data.items.reduce((s, i) => s + i.price * i.quantity, 0) + shippingCost;
  const code = generateOrderCode();

  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        code,
        userId: session.user!.id!,
        paymentMethod: data.paymentMethod,
        address: data.address,
        notes: data.notes,
        culqiChargeId: data.culqiChargeId,
        total,
        shippingCost,
        status: data.culqiChargeId ? "PAGADO" : "PENDIENTE",
        items: { create: data.items },
      },
    });

    for (const item of data.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return o;
  });

  revalidatePath("/admin/orders");
  return order;
}

export async function getMyOrders() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          variant: { include: { product: { select: { title: true, images: { take: 1 } } } } },
        },
      },
    },
  });
}

export async function getAdminOrders(page = 1) {
  const limit = 20;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { variant: { include: { product: { select: { title: true } } } } } },
      },
    }),
    prisma.order.count(),
  ]);

  return { orders, total, pages: Math.ceil(total / limit) };
}

export async function updateOrderStatus(id: string, status: "PENDIENTE" | "PAGADO" | "ENVIADO" | "ENTREGADO" | "CANCELADO") {
  const order = await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/orders");
  return order;
}

"use server";

import { prisma } from "@/lib/prisma";
import { generateOrderCode } from "@/lib/utils";
import { MoveType, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [totalProducts, totalOrders, revenue, lowStock, recentSales] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELADO" } } }),
    prisma.productVariant.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD }, isActive: true } }),
    prisma.sale.findMany({
      take: 10,
      orderBy: { date: "desc" },
      include: { store: true, vendedor: { select: { name: true } }, items: { include: { variant: { include: { product: { select: { title: true } } } } } } },
    }),
  ]);

  return {
    totalProducts,
    totalOrders,
    totalRevenue: revenue._sum.total ?? 0,
    lowStockCount: lowStock,
    recentSales,
  };
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export async function createInventoryMove(data: {
  variantId: string;
  storeId: string;
  type: MoveType;
  quantity: number;
  reason?: string;
  note?: string;
}) {
  const code = `INV-${Date.now()}`;

  const [move] = await prisma.$transaction([
    prisma.inventoryMove.create({ data: { ...data, code } }),
    prisma.productVariant.update({
      where: { id: data.variantId },
      data: {
        stock: data.type === "ENTRADA"
          ? { increment: data.quantity }
          : { decrement: data.quantity },
      },
    }),
  ]);

  revalidatePath("/admin/inventory");
  return move;
}

export async function getInventoryMoves(variantId?: string, storeId?: string) {
  return prisma.inventoryMove.findMany({
    where: { ...(variantId && { variantId }), ...(storeId && { storeId }) },
    orderBy: { date: "desc" },
    take: 100,
    include: {
      variant: { include: { product: { select: { title: true, code: true } } } },
      store: { select: { name: true } },
    },
  });
}

export async function getLowStockProducts() {
  return prisma.productVariant.findMany({
    where: { stock: { lte: LOW_STOCK_THRESHOLD }, isActive: true },
    include: { product: { select: { title: true, code: true, category: { select: { name: true } } } } },
    orderBy: { stock: "asc" },
  });
}

// ─── Sales (POS) ──────────────────────────────────────────────────────────────

export async function createSale(data: {
  storeId: string;
  vendedorId?: string;
  paymentMethod: PaymentMethod;
  destination?: string;
  notes?: string;
  items: Array<{ variantId: string; quantity: number; price: number }>;
}) {
  const total = data.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const code = generateOrderCode().replace("TIB", "VTA");

  const sale = await prisma.$transaction(async (tx) => {
    const s = await tx.sale.create({
      data: {
        code,
        storeId: data.storeId,
        vendedorId: data.vendedorId,
        paymentMethod: data.paymentMethod,
        destination: data.destination,
        notes: data.notes,
        total,
        items: { create: data.items },
      },
      include: { items: true },
    });

    // Decrease stock
    for (const item of data.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return s;
  });

  revalidatePath("/admin/sales");
  return sale;
}

export async function getSales(storeId?: string, from?: Date, to?: Date) {
  return prisma.sale.findMany({
    where: {
      ...(storeId && { storeId }),
      ...(from && to && { date: { gte: from, lte: to } }),
    },
    orderBy: { date: "desc" },
    take: 200,
    include: {
      store: { select: { name: true } },
      vendedor: { select: { name: true } },
      items: {
        include: {
          variant: {
            include: { product: { select: { title: true, code: true } } },
          },
        },
      },
    },
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createUser(data: { name: string; email: string; password: string; role?: "ADMIN" | "VENDEDOR" | "CLIENTE" }) {
  const hashed = await bcrypt.hash(data.password, 10);
  return prisma.user.create({ data: { ...data, password: hashed } });
}

export async function getUsers() {
  return prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: "desc" } });
}

// ─── Stores ───────────────────────────────────────────────────────────────────

export async function getStores() {
  return prisma.store.findMany({ orderBy: { name: "asc" } });
}

export async function createStore(data: { name: string; address?: string }) {
  return prisma.store.create({ data });
}

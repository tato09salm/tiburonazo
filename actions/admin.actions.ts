"use server";

import { prisma } from "@/lib/prisma";
import { generateOrderCode } from "@/lib/utils";
import { MoveType, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { userSchema } from "@/lib/validations/user";

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
      include: { vendedor: { select: { name: true } }, items: { include: { variant: { include: { product: { select: { title: true } } } } } } },
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
  type: MoveType;
  reason: string;
  note?: string;
  items: { variantId: string; quantity: number }[];
}) {
  // Generamos un prefijo basado en el tiempo
  const timestamp = Date.now();

  return await prisma.$transaction(async (tx) => {
    const results = [];

    // Usamos el índice (i) para garantizar que el código sea único por cada ítem
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      
      const variant = await tx.productVariant.findUnique({ 
        where: { id: item.variantId } 
      });
      
      if (!variant) throw new Error(`Producto no encontrado`);

      const newStock = data.type === "ENTRADA" 
        ? variant.stock + item.quantity 
        : variant.stock - item.quantity;

      if (newStock < 0) {
        throw new Error(`Stock insuficiente para: ${variant.sku || variant.model}`);
      }

      // --- LA SOLUCIÓN AQUÍ ---
      // Agregamos el índice al final del código: INV-1712345678-0, INV-1712345678-1...
      const uniqueCode = `INV-${timestamp}-${i}`;

      const move = await tx.inventoryMove.create({
        data: {
          variantId: item.variantId,
          type: data.type,
          quantity: item.quantity,
          reason: data.reason,
          note: data.note,
          code: uniqueCode, // Ahora sí es único
          stockAfter: newStock
        },
      });

      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: newStock },
      });

      results.push(move);
    }

    return results;
  });
}

export async function getInventoryMoves(variantId?: string) {
  return prisma.inventoryMove.findMany({
    where: { ...(variantId && { variantId }) },
    orderBy: { date: "desc" },
    take: 100,
    include: {
      variant: { 
        include: { 
          product: { select: { title: true, code: true } } 
        } 
      },
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

export async function searchVariants(query: string) {
  return await prisma.productVariant.findMany({
    where: {
      OR: [
        { sku: { contains: query, mode: "insensitive" } },
        { product: { title: { contains: query, mode: "insensitive" } } },
      ],
      isActive: true,
    },
    include: {
      product: { select: { title: true } },
      color: { select: { name: true } },
      size: { select: { label: true } },
    },
    take: 5, // Límite de resultados por búsqueda
  });
}

// Action para obtener los detalles de los KPIs
export async function getInventoryStats() {
  const [lowStock, outOfStock, noMovement] = await Promise.all([
    prisma.productVariant.findMany({
      where: { stock: { gt: 0, lte: 5 }, isActive: true },
      include: { product: true }
    }),
    prisma.productVariant.findMany({
      where: { stock: 0, isActive: true },
      include: { product: true }
    }),
    // Productos sin movimientos en los últimos 30 días
    prisma.productVariant.findMany({
      where: {
        inventoryMoves: {
          none: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
        }
      },
      include: { product: true }
    })
  ]);

  return { lowStock, outOfStock, noMovement };
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

export async function createUser(rawContent: unknown) {
  // Validamos los datos recibidos antes de procesar
  const result = userSchema.safeParse(rawContent);

  if (!result.success) {
    throw new Error("Datos de usuario inválidos");
  }

  const { name, email, password, role } = result.data;
  const normalizedEmail = email.toLowerCase().trim();
  
  const hashed = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({ 
    data: { name, email: normalizedEmail, password: hashed, role } 
  });

  revalidatePath("/admin/users");
  return user;
}

export async function toggleUserStatus(id: string, currentStatus: boolean) {
  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath("/admin/users");
  } catch (error) {
    throw new Error("No se pudo actualizar el estado del usuario");
  }
}

export async function getUsers(
  page: number = 1, 
  pageSize: number = 5,
  search?: string,
  role?: string,
  status?: string
) {
  const skip = (page - 1) * pageSize;
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role && role !== "ALL") where.role = role;
  if (status && status !== "ALL") where.isActive = status === "ACTIVE";

  const [users, filteredTotal, globalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      take: pageSize,
      skip: skip,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
    prisma.user.count(),         
  ]);

  return {
    users,
    totalPages: Math.ceil(filteredTotal / pageSize),
    totalFiltered: filteredTotal, 
    globalCount: globalCount     
  };
}

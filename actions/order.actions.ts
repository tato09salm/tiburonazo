"use server";

import { prisma } from "@/lib/prisma";
import { generateOrderCode } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { PaymentMethod, OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface CreateOrderInput {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  reference?: string;
  ubigeo: string; // 6 dígitos (INEI)
  document: string; // DNI o RUC
  paymentMethod: PaymentMethod;
  culqiChargeId?: string;
  shippingCost: number; // 0 si es recojo en tienda
  total: number; // Suma total de productos + envío
  items: Array<{
    variantId: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * Crea una nueva orden, gestiona la libreta de direcciones del usuario,
 * reduce el stock y valida la disponibilidad.
 */
export async function createOrder(data: CreateOrderInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Sesión no válida o expirada");

  const orderCode = generateOrderCode();

  return await prisma.$transaction(async (tx) => {
    // 1. Gestión de Libreta de Direcciones (Solo si NO es recojo en tienda)
    // Usamos el shippingCost como indicador de si hubo un servicio de entrega
    if (data.shippingCost > 0) {
      const existingAddress = await tx.address.findFirst({
        where: {
          userId: session.user.id,
          address: data.address,
          ubigeo: data.ubigeo,
        },
      });

      if (!existingAddress) {
        await tx.address.create({
          data: {
            userId: session.user.id!,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            address: data.address,
            reference: data.reference,
            ubigeo: data.ubigeo,
            isDefault: true,
          },
        });
      }
    }

    // 2. Creación de la Orden
    const order = await tx.order.create({
      data: {
        code: orderCode,
        userId: session.user.id!,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        reference: data.reference,
        ubigeo: data.ubigeo,
        document: data.document,
        paymentMethod: data.paymentMethod,
        shippingCost: data.shippingCost,
        total: data.total,
        culqiChargeId: data.culqiChargeId,
        // Si hay un ID de cargo de Culqi, la orden nace como PAGADA
        status: data.culqiChargeId ? OrderStatus.PAGADO : OrderStatus.PENDIENTE,
        items: {
          create: data.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    // 3. Actualización de Stock con validación de seguridad
    for (const item of data.items) {
      const variant = await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      if (variant.stock < 0) {
        throw new Error(
          `Lo sentimos, el producto con SKU ${variant.sku} se quedó sin stock suficiente.`
        );
      }
    }

    // Revalidación de rutas para mantener los datos frescos
    revalidatePath("/cuenta");
    revalidatePath("/admin/orders");

    return order;
  });
}

/**
 * Obtiene las órdenes del usuario autenticado
 */
export async function getMyOrders() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  title: true,
                  images: { take: 1 },
                },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * Obtiene todas las órdenes para el panel administrativo con paginación
 */
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
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { title: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.order.count(),
  ]);

  return { 
    orders, 
    total, 
    pages: Math.ceil(total / limit) 
  };
}

/**
 * Actualiza el estado de una orden desde el panel de administración
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
) {
  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });
  
  revalidatePath("/admin/orders");
  revalidatePath("/cuenta"); // Revalidar también la vista del cliente
  
  return order;
}
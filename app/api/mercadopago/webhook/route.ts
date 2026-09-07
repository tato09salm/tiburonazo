import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Webhook received:", JSON.stringify(body, null, 2));

    if (body.type === "order") {
      const orderId = body.data?.id;
      if (!orderId) {
        return NextResponse.json({ error: "Missing order id" }, { status: 400 });
      }

      const accessToken = process.env.MP_ACCESS_TOKEN!;
      const orderResponse = await fetch(`https://api.mercadopago.com/v1/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!orderResponse.ok) {
        console.error("Failed to fetch order from MercadoPago");
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
      }

      const orderData = await orderResponse.json();
      console.log("Order data from MercadoPago:", JSON.stringify(orderData, null, 2));

      const externalRef = orderData.external_reference;
      const orderStatus = orderData.status;

      if (externalRef) {
        let dbStatus: OrderStatus;

        switch (orderStatus) {
          case "processed":
            dbStatus = OrderStatus.PAGADO;
            break;
          case "cancelled":
          case "refunded":
            dbStatus = OrderStatus.CANCELADO;
            break;
          case "processing":
          default:
            dbStatus = OrderStatus.PENDIENTE;
            break;
        }

        await prisma.order.updateMany({
          where: { id: externalRef },
          data: { status: dbStatus },
        });

        console.log(`Order ${externalRef} updated to ${dbStatus}`);
      }
    }

    if (body.type === "payment") {
      const paymentId = body.data?.id;
      if (!paymentId) {
        return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
      }

      const accessToken = process.env.MP_ACCESS_TOKEN!;
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!paymentResponse.ok) {
        console.error("Failed to fetch payment from MercadoPago");
        return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
      }

      const paymentData = await paymentResponse.json();
      console.log("Payment data from MercadoPago:", JSON.stringify(paymentData, null, 2));

      if (paymentData.status === "approved") {
        await prisma.order.updateMany({
          where: { mercadopagoPaymentId: String(paymentId) },
          data: { status: OrderStatus.PAGADO },
        });
      } else if (paymentData.status === "cancelled" || paymentData.status === "refunded") {
        await prisma.order.updateMany({
          where: { mercadopagoPaymentId: String(paymentId) },
          data: { status: OrderStatus.CANCELADO },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mercado Pago webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}

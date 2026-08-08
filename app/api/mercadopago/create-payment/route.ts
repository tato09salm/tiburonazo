import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { token, transactionAmount, paymentMethodId, installments, description, payerEmail, orderId } =
      await req.json();

    console.log("=== MERCADOPAGO DEBUG ===");
    console.log("Token:", token);
    console.log("Amount:", transactionAmount);
    console.log("PaymentMethodId:", paymentMethodId);
    console.log("Installments:", installments);
    console.log("PayerEmail:", payerEmail);
    console.log("Session email:", session.user.email);

    const idempotencyKey = crypto.randomUUID();

    let payerEmailFinal = payerEmail || session.user.email || "TESTUSER3097077988872362706@testuser.com";
    if (!payerEmailFinal.includes("@")) {
      payerEmailFinal = "TESTUSER3097077988872362706@testuser.com";
    }

    const body = {
      type: "online",
      processing_mode: "automatic",
      total_amount: String(Number(transactionAmount).toFixed(2)),
      external_reference: orderId || `ORD-${Date.now()}`,
      payer: {
        email: payerEmailFinal,
      },
      transactions: {
        payments: [
          {
            amount: String(Number(transactionAmount).toFixed(2)),
            payment_method: {
              id: paymentMethodId,
              type: "credit_card",
              token,
              installments: Number(installments) || 1,
            },
          },
        ],
      },
    };

    console.log("Request body:", JSON.stringify(body, null, 2));

    const result = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const data = await result.json();

    console.log("Response status:", result.status);
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (!result.ok) {
      console.error("MercadoPago Orders API error:", data);
      return NextResponse.json(
        {
          error: data.errors?.[0]?.message || data.message || data.error || "Error al procesar el pago",
          details: data.errors,
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      transactions: data.transactions,
    });
  } catch (error: any) {
    console.error("Mercado Pago payment error:", error);

    const errorMessage =
      error?.cause?.message ||
      error?.message ||
      "Error al procesar el pago con Mercado Pago";

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const { token, amount, email, description } = await req.json();

    const culqiRes = await fetch("https://api.culqi.com/v2/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CULQI_PRIVATE_KEY}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Culqi maneja céntimos
        currency_code: "PEN",
        email,
        source_id: token,
        description,
        metadata: { userId: session.user.id },
      }),
    });

    const data = await culqiRes.json();
    if (!culqiRes.ok) {
      return NextResponse.json({ error: data.user_message ?? "Error en el pago" }, { status: 400 });
    }

    return NextResponse.json({ chargeId: data.id, outcome: data.outcome });
  } catch (error) {
    console.error("Culqi charge error:", error);
    return NextResponse.json({ error: "Error al procesar el pago" }, { status: 500 });
  }
}

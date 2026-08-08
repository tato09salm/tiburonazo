import { MercadoPagoConfig } from "mercadopago";

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error("Missing MP_ACCESS_TOKEN environment variable");
}

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

export const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? "";

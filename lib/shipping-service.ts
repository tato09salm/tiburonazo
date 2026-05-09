import { getUbigeoData } from "ubigeo-fns";

const ORIGIN_UBIGEO = "130101"; // Trujillo

export interface ShippingRates {
  totalWeight: number;
  destUbigeo: string;
}

export async function calculateShippingCost({ totalWeight, destUbigeo }: ShippingRates): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dest = getUbigeoData(destUbigeo);
      if (!dest) return resolve(20); 

      let basePrice = 0;
      if (destUbigeo === ORIGIN_UBIGEO) {
        basePrice = 10.0; 
      } else if (destUbigeo.startsWith("13")) {
        basePrice = 15.0; 
      } else {
        basePrice = 20.0; 
      }

      const weightExtra = totalWeight > 1 ? (totalWeight - 1) * 2.5 : 0;
      resolve(basePrice + weightExtra);
    }, 600);
  });
}
import shippingRates from "@/data/olva.json";

const DEFAULT_COST = 20.0;
const OVERWEIGHT_COST = 65.0;

type WeightTier = "0.5" | "1" | "2" | "3" | "5";
const WEIGHT_TIERS: { maxWeight: number; key: WeightTier }[] = [
  { maxWeight: 0.5, key: "0.5" },
  { maxWeight: 1, key: "1" },
  { maxWeight: 2, key: "2" },
  { maxWeight: 3, key: "3" },
  { maxWeight: 5, key: "5" },
];

function getWeightTierKey(weight: number): WeightTier | null {
  for (const tier of WEIGHT_TIERS) {
    if (weight <= tier.maxWeight) return tier.key;
  }
  return null;
}

export interface ShippingRates {
  totalWeight: number;
  destUbigeo: string;
}

export async function calculateShippingCost({ totalWeight, destUbigeo }: ShippingRates): Promise<number> {
  const entry = shippingRates[destUbigeo as keyof typeof shippingRates];
  if (!entry) return DEFAULT_COST;

  const tierKey = getWeightTierKey(totalWeight);
  if (!tierKey) return OVERWEIGHT_COST;

  return entry[tierKey] as number;
}
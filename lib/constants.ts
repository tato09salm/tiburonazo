export const SITE_NAME = "Tiburonazo";
export const SITE_DESCRIPTION = "Tu tienda de natación y accesorios acuáticos";
export const SITE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const BRAND_COLORS = {
  primary: "#11ABC4",
  secondary: "#00D4DD",
  light: "#CCECFB",
};

export const CATEGORIES = [
  "Ropa de baño",
  "Jammer",
  "Enterizos",
  "Polos",
  "Atletic",
  "Conjuntos",
  "Traje de agua",
  "Parkas",
  "Vinchas",
  "Lentes",
  "Gorros",
  "Aletas",
  "Personalizados",
  "Peluches",
  "Disfraces",
  "Ponchos",
  "Neceser",
  "Batas",
] as const;

export const GENDERS = [
  { value: "ADULTO", label: "Adulto" },
  { value: "NINO", label: "Niño" },
  { value: "BEBE", label: "Bebé" },
  { value: "UNISEX", label: "Unisex" },
] as const;

export const PAYMENT_METHODS = [
  { value: "CULQI", label: "Tarjeta (Culqi)" },
  { value: "YAPE", label: "Yape/Plin" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
] as const;

export const PRODUCTS_PER_PAGE = 12;
export const LOW_STOCK_THRESHOLD = 5;

export const NAV_LINKS = [
  { label: "Mujer", href: "/categoria/ropa-de-bano?gender=ADULTO" },
  { label: "Hombre", href: "/categoria/jammer" },
  { label: "Niño", href: "/productos?gender=NINO" },
  { label: "Bebé", href: "/productos?gender=BEBE" },
  { label: "Accesorios", href: "/categoria/lentes" },
  { label: "Outlet", href: "/productos?outlet=true" },
];

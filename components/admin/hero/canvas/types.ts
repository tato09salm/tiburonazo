export type CanvasElementType = "text" | "image" | "gif" | "button";

export interface CanvasElementBase {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
}

export interface CanvasTextElement extends CanvasElementBase {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: "" | "italic";
  textColor: string;
  textAlign: "left" | "center" | "right";
  letterSpacing: number;
  lineHeight: number;
}

export interface CanvasImageElement extends CanvasElementBase {
  type: "image" | "gif";
  src: string;
  fit: "cover" | "contain" | "fill";
}

export interface CanvasButtonElement extends CanvasElementBase {
  type: "button";
  text: string;
  url: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  paddingX: number;
  paddingY: number;
}

export type CanvasElement = CanvasTextElement | CanvasImageElement | CanvasButtonElement;

export interface CanvasBackground {
  type: "color" | "image" | "gradient" | "none";
  color?: string;
  imageUrl?: string;
  gradient?: string;
}

export interface CanvasSlideData {
  width: number;
  height: number;
  background: CanvasBackground;
  elements: CanvasElement[];
}

export const FONT_GROUPS: Record<string, string[]> = {
  "Modernas": ["Inter", "Manrope", "Outfit", "Plus Jakarta Sans"],
  "Geométricas": ["Montserrat", "Poppins", "Urbanist"],
  "Legibilidad": ["DM Sans", "Lexend", "Nunito Sans"],
  "Destacadas": ["Nunito", "Rajdhani"],
  "Sistema": ["Arial", "Helvetica", "Georgia", "Times New Roman", "Courier New", "Verdana", "Impact"],
};

export const DEFAULT_FONTS = Object.values(FONT_GROUPS).flat();

export const CANVAS_WIDTH = 1440;
export const CANVAS_HEIGHT = 720;

let counter = 0;
export function generateId(): string {
  counter++;
  return `el_${Date.now()}_${counter}`;
}

export function createDefaultText(): CanvasTextElement {
  return {
    id: generateId(),
    type: "text",
    x: 100,
    y: 100,
    width: 400,
    height: 60,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    visible: true,
    locked: false,
    text: "Texto",
    fontFamily: "Rajdhani",
    fontSize: 48,
    fontWeight: "700",
    fontStyle: "",
    textColor: "#FFFFFF",
    textAlign: "left",
    letterSpacing: 0,
    lineHeight: 1.2,
  };
}

export function createDefaultButton(): CanvasButtonElement {
  return {
    id: generateId(),
    type: "button",
    x: 100,
    y: 300,
    width: 200,
    height: 56,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    visible: true,
    locked: false,
    text: "Botón",
    url: "",
    backgroundColor: "#11ABC4",
    textColor: "#FFFFFF",
    borderRadius: 12,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Nunito",
    paddingX: 24,
    paddingY: 14,
  };
}

export function createDefaultImage(src: string, isGif = false): CanvasImageElement {
  return {
    id: generateId(),
    type: isGif ? "gif" : "image",
    x: 900,
    y: 100,
    width: 400,
    height: 500,
    rotation: 0,
    zIndex: 1,
    opacity: 1,
    visible: true,
    locked: false,
    src,
    fit: "contain",
  };
}

export const PAGE_URLS = [
  { label: "Inicio", url: "/" },
  { label: "Productos", url: "/productos" },
  { label: "Nosotros", url: "/nosotros" },
  { label: "Contacto", url: "/contacto" },
  { label: "Carrito", url: "/carrito" },
  { label: "Devoluciones", url: "/devoluciones" },
  { label: "Envíos", url: "/envios" },
  { label: "Términos", url: "/terminos" },
  { label: "Checkout", url: "/checkout" },
];

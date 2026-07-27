"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Upload, GalleryHorizontalEnd, Save, Loader2, Image as ImageIcon, Move, ZoomIn, ZoomOut, Check } from "lucide-react";
import Image from "next/image";
import { createColor, getColors } from "@/actions/color.actions";
import {
  loadImage,
  generateCircularSwatch,
  uploadSwatchBlob,
  uploadImageFile,
} from "@/lib/color-swatch";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ProductImage {
  id?: string;
  _key?: string;
  url: string;
  alt?: string | null;
}

interface Color {
  id: string;
  name: string;
  hex?: string | null;
  swatchUrl?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (color: Color) => void;
  productImages: ProductImage[];
  defaultNamePrefix?: string;
}

type Step = "source" | "pick-gallery" | "pick-file" | "crop";

export function CustomColorModal({
  isOpen,
  onClose,
  onCreated,
  productImages,
  defaultNamePrefix = "",
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("source");
  const [sourceImageUrl, setSourceImageUrl] = useState<string>("");
  const [sourceImageEl, setSourceImageEl] = useState<HTMLImageElement | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);
  const [radius, setRadius] = useState(40);

  const [colorName, setColorName] = useState("");
  const [previewSwatch, setPreviewSwatch] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"move" | "resize" | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; cx: number; cy: number; r: number }>({
    x: 0, y: 0, cx: 0, cy: 0, r: 0,
  });

  useEffect(() => {
    if (!isOpen) {
      setStep("source");
      setSourceImageUrl("");
      setSourceImageEl(null);
      setCenterX(0);
      setCenterY(0);
      setRadius(40);
      setColorName(defaultNamePrefix ? `${defaultNamePrefix}-` : "");
      setPreviewSwatch("");
      setSaving(false);
    }
  }, [isOpen, defaultNamePrefix]);

  const updatePreview = useCallback(async (imgEl: HTMLImageElement, cx: number, cy: number, r: number) => {
    if (!imgEl) return;
    try {
      const { swatchDataUrl } = generateCircularSwatch(imgEl, cx, cy, r, 200);
      setPreviewSwatch(swatchDataUrl);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (sourceImageEl && centerX >= 0 && centerY >= 0 && radius > 0) {
      updatePreview(sourceImageEl, centerX, centerY, radius);
    }
  }, [sourceImageEl, centerX, centerY, radius, updatePreview]);

  const handleGalleryPick = async (url: string) => {
    setSourceImageUrl(url);
    setStep("crop");
    try {
      const img = await loadImage(url);
      setSourceImageEl(img);
      const naturalR = Math.min(img.naturalWidth, img.naturalHeight) / 2;
      const initR = Math.min(naturalR * 0.35, 120);
      setCenterX(img.naturalWidth / 2);
      setCenterY(img.naturalHeight / 2);
      setRadius(initR);
    } catch (e) {
      alert("Error al cargar la imagen");
      setStep("source");
    }
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);

      const uploadedUrl = await uploadImageFile(file);

      setSourceImageUrl(uploadedUrl);
      setSourceImageEl(img);
      setStep("crop");

      const naturalR = Math.min(img.naturalWidth, img.naturalHeight) / 2;
      const initR = Math.min(naturalR * 0.35, 120);
      setCenterX(img.naturalWidth / 2);
      setCenterY(img.naturalHeight / 2);
      setRadius(initR);
    } catch (err) {
      console.error(err);
      alert("Error al procesar la imagen");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const imgLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    setDisplaySize({ w: rect.width, h: rect.height });
  };

  const displayToNatural = useCallback((dx: number, dy: number) => {
    if (!sourceImageEl || displaySize.w === 0) return { x: 0, y: 0 };
    const ratioX = sourceImageEl.naturalWidth / displaySize.w;
    const ratioY = sourceImageEl.naturalHeight / displaySize.h;
    return { x: dx * ratioX, y: dy * ratioY };
  }, [sourceImageEl, displaySize]);

  const naturalToDisplay = useCallback((nx: number, ny: number) => {
    if (!sourceImageEl) return { x: 0, y: 0 };
    const ratioX = displaySize.w / sourceImageEl.naturalWidth;
    const ratioY = displaySize.h / sourceImageEl.naturalHeight;
    return { x: nx * ratioX, y: ny * ratioY };
  }, [sourceImageEl, displaySize]);

  const radiusToDisplay = useCallback(() => {
    if (!sourceImageEl) return radius;
    const ratio = Math.min(displaySize.w / sourceImageEl.naturalWidth, displaySize.h / sourceImageEl.naturalHeight);
    return radius * ratio;
  }, [radius, sourceImageEl, displaySize]);

  const onMouseDownOnCircle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = "move";
    const pos = naturalToDisplay(centerX, centerY);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      cx: pos.x,
      cy: pos.y,
      r: radiusToDisplay(),
    };
  };

  const onMouseDownOnHandle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = "resize";
    const pos = naturalToDisplay(centerX, centerY);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      cx: pos.x,
      cy: pos.y,
      r: radiusToDisplay(),
    };
  };

  useEffect(() => {
    if (!isOpen) return;
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !imgContainerRef.current || !sourceImageEl) return;
      const rect = imgContainerRef.current.getBoundingClientRect();
      const imgEl = imgContainerRef.current.querySelector("img");
      if (!imgEl) return;
      const imgRect = imgEl.getBoundingClientRect();

      const start = dragStartRef.current;
      const ddx = e.clientX - start.x;
      const ddy = e.clientY - start.y;

      if (draggingRef.current === "move") {
        let ndx = start.cx + ddx;
        let ndy = start.cy + ddy;
        const minX = 0, minY = 0;
        const maxX = imgRect.width;
        const maxY = imgRect.height;
        ndx = Math.max(minX, Math.min(maxX, ndx));
        ndy = Math.max(minY, Math.min(maxY, ndy));
        const nat = displayToNatural(ndx - (imgRect.left - rect.left), ndy - (imgRect.top - rect.top));
        const r = radius;
        nat.x = Math.max(r, Math.min(sourceImageEl.naturalWidth - r, nat.x));
        nat.y = Math.max(r, Math.min(sourceImageEl.naturalHeight - r, nat.y));
        setCenterX(nat.x);
        setCenterY(nat.y);
      } else if (draggingRef.current === "resize") {
        const delta = (ddx + ddy) / 2;
        let newRDisplay = Math.max(10, start.r + delta);
        const ratio = Math.min(displaySize.w / sourceImageEl.naturalWidth, displaySize.h / sourceImageEl.naturalHeight);
        let newR = newRDisplay / ratio;
        newR = Math.max(5, newR);
        newR = Math.min(newR, centerX, sourceImageEl.naturalWidth - centerX, centerY, sourceImageEl.naturalHeight - centerY);
        setRadius(newR);
      }
    };
    const onUp = () => {
      draggingRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isOpen, centerX, centerY, radius, displaySize, sourceImageEl, displayToNatural, naturalToDisplay, radiusToDisplay]);

  const handleSave = async () => {
    if (!colorName.trim() || !sourceImageEl) return;
    setSaving(true);
    try {
      const { blob } = generateCircularSwatch(sourceImageEl, centerX, centerY, radius, 300);
      const swatchUrl = await uploadSwatchBlob(blob);
      const existing = await getColors();
      let finalName = colorName.trim();
      let counter = 2;
      while (existing.some((c) => c.name.toLowerCase() === finalName.toLowerCase())) {
        finalName = `${colorName.trim()} ${counter}`;
        counter++;
      }
      const created = await createColor({
        name: finalName,
        swatchUrl,
        sourceImageUrl: sourceImageUrl,
        cropX: centerX,
        cropY: centerY,
        cropRadius: radius,
      });
      onCreated(created);
      router.refresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al crear el color: " + (err instanceof Error ? err.message : ""));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const circlePos = sourceImageEl ? naturalToDisplay(centerX, centerY) : { x: 0, y: 0 };
  const dRadius = radiusToDisplay();

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-heading text-lg font-bold text-gray-900">
              {step === "source" && "Crear color personalizado"}
              {step === "pick-gallery" && "Seleccionar del banco de imágenes"}
              {step === "pick-file" && "Seleccionar nueva imagen"}
              {step === "crop" && "Capturar muestra de color"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {step === "source" && "Elige la fuente de la imagen que usarás como muestra de color."}
              {step === "pick-gallery" && "Haz clic en la imagen del producto para usarla."}
              {step === "crop" && "Mueve y ajusta el círculo sobre la parte de la imagen que representará al color."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {step === "source" && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => setStep("pick-gallery")}
                disabled={productImages.length === 0}
                className={cn(
                  "group relative border-2 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center transition-all",
                  productImages.length > 0
                    ? "border-gray-200 hover:border-[#11ABC4] hover:bg-[#CCECFB]/20"
                    : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#CCECFB]/50 flex items-center justify-center text-[#11ABC4] group-hover:scale-110 transition-transform">
                  <GalleryHorizontalEnd size={32} />
                </div>
                <div>
                  <div className="font-bold text-gray-800">Banco de imágenes del producto</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {productImages.length > 0
                      ? `Usar una de las ${productImages.length} fotos ya cargadas`
                      : "No hay imágenes cargadas en este producto"}
                  </div>
                </div>
              </button>

              <label
                className={cn(
                  "group relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all",
                  "border-gray-200 hover:border-[#11ABC4] hover:bg-[#CCECFB]/20"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChosen}
                />
                {uploadingImage ? (
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#CCECFB]/50 flex items-center justify-center text-[#11ABC4] group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                  </div>
                )}
                <div>
                  <div className="font-bold text-gray-800">Nueva imagen</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Seleccionar desde tu equipo (PNG, JPG, WEBP)
                  </div>
                </div>
              </label>
            </div>
          )}

          {step === "pick-gallery" && (
            <div className="p-6">
              {productImages.length === 0 ? (
                <div className="py-16 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                  <ImageIcon size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay imágenes en el banco de este producto.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {productImages.map((img, idx) => (
                    <button
                      key={img.id || img._key || idx}
                      type="button"
                      onClick={() => handleGalleryPick(img.url)}
                      className="relative group border-2 border-gray-100 hover:border-[#11ABC4] rounded-2xl overflow-hidden bg-gray-50 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="relative aspect-square w-full">
                        <Image
                          src={img.url}
                          alt={img.alt || `Imagen ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-[#11ABC4]/0 group-hover:bg-[#11ABC4]/10 flex items-center justify-center transition-colors">
                          <div className="opacity-0 group-hover:opacity-100 bg-[#11ABC4] text-white rounded-full p-3 shadow-lg transition-all">
                            <Check size={22} />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={() => setStep("source")}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  ← Volver
                </button>
              </div>
            </div>
          )}

          {step === "crop" && sourceImageUrl && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              <div className="space-y-3">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Move size={12} /> Arrastra el círculo para moverlo · Usa el control del borde para agrandar/achicar
                </div>
                <div
                  ref={imgContainerRef}
                  className="relative bg-gray-900 rounded-xl overflow-hidden select-none flex items-center justify-center"
                  style={{ minHeight: 300 }}
                >
                  <div className="relative inline-block max-h-[60vh]">
                    <img
                      src={sourceImageUrl}
                      alt="Fuente"
                      onLoad={imgLoaded}
                      className="max-w-full max-h-[60vh] block"
                      draggable={false}
                    />
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: 0, top: 0, right: 0, bottom: 0,
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                        borderRadius: "9999px",
                        clipPath: `circle(${dRadius}px at ${circlePos.x}px ${circlePos.y}px)`,
                      }}
                    />
                    <div
                      onMouseDown={onMouseDownOnCircle}
                      className="absolute rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)] cursor-move"
                      style={{
                        left: circlePos.x - dRadius,
                        top: circlePos.y - dRadius,
                        width: dRadius * 2,
                        height: dRadius * 2,
                      }}
                    >
                      <div className="absolute inset-0 rounded-full border border-white/40" />
                      <div
                        onMouseDown={onMouseDownOnHandle}
                        className="absolute -right-2 -bottom-2 w-5 h-5 bg-white border-2 border-[#11ABC4] rounded-full cursor-ew-resize shadow-md flex items-center justify-center"
                        title="Redimensionar"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#11ABC4]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRadius((r) => Math.max(5, r * 0.9))}
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1"
                    title="Reducir círculo"
                  >
                    <ZoomOut size={14} /> Achicar
                  </button>
                  <button
                    type="button"
                    onClick={() => setRadius((r) => {
                      if (!sourceImageEl) return r;
                      const maxR = Math.min(r * 1.1, centerX, sourceImageEl.naturalWidth - centerX, centerY, sourceImageEl.naturalHeight - centerY);
                      return maxR;
                    })}
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1"
                    title="Agrandar círculo"
                  >
                    <ZoomIn size={14} /> Agrandar
                  </button>
                  <div className="text-[11px] text-gray-500 font-mono ml-auto">
                    Centro: ({Math.round(centerX)}, {Math.round(centerY)}) · R: {Math.round(radius)}px
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vista previa</div>
                  <div className="flex items-center justify-center py-2">
                    {previewSwatch && (
                      <div
                        className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gray-200"
                        style={{
                          backgroundImage: `url(${previewSwatch})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 text-center">
                    Así se verá el color en las listas
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600">
                    Nombre del color *
                  </label>
                  <input
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    placeholder="Ej: P001-magneta rayas blancas, Cebra blanco-negro, Flores rosas fondo blanco..."
                    className="input h-10 text-sm"
                    autoFocus
                  />
                  <p className="text-[10px] text-gray-400">
                    Incluye el código del producto + descripción visual. El nombre debe ser único.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/60">
          {step === "crop" ? (
            <>
              <button
                type="button"
                onClick={() => setStep("source")}
                className="btn-secondary text-sm px-4 py-2"
              >
                ← Cambiar imagen
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !colorName.trim()}
                  className="btn-primary text-sm px-5 py-2 flex items-center gap-2 font-semibold"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar color
                    </>
                  )}
                </button>
              </div>
            </>
          ) : step === "source" ? (
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-sm px-4 py-2 ml-auto"
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep("source")}
              className="btn-secondary text-sm px-4 py-2 ml-auto"
            >
              ← Volver
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

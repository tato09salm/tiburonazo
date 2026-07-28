export interface CropResult {
  swatchDataUrl: string;
  blob: Blob;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function generateCircularSwatch(
  sourceImage: HTMLImageElement,
  centerX: number,
  centerY: number,
  radius: number,
  outputSize: number = 200
): CropResult {
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d")!;

  const scaleX = sourceImage.naturalWidth;
  const scaleY = sourceImage.naturalHeight;

  const sx = Math.max(0, centerX - radius);
  const sy = Math.max(0, centerY - radius);
  const sSize = radius * 2;
  const sWidth = Math.min(sSize, scaleX - sx);
  const sHeight = Math.min(sSize, scaleY - sy);

  ctx.save();
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const dx = (outputSize - sWidth * (outputSize / sSize)) / 2;
  const dy = (outputSize - sHeight * (outputSize / sSize)) / 2;
  const dWidth = sWidth * (outputSize / sSize);
  const dHeight = sHeight * (outputSize / sSize);

  ctx.drawImage(sourceImage, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  ctx.restore();

  const dataUrl = canvas.toDataURL("image/png");
  const byteString = atob(dataUrl.split(",")[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: "image/png" });

  return { swatchDataUrl: dataUrl, blob };
}

export async function uploadSwatchBlob(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, "color-swatch-" + Date.now() + ".png");
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Error al subir la muestra de color");
  const data = await res.json();
  return data.url as string;
}

export async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Error al subir imagen");
  const data = await res.json();
  return data.url as string;
}

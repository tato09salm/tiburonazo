"use client";

import { memo } from "react";
import type { CanvasElement, CanvasTextElement, CanvasImageElement, CanvasButtonElement } from "../types";
import { UrlPicker } from "./UrlPicker";
import { FontSelector } from "./FontSelector";

interface Props {
  element: CanvasElement | null;
  onChange: (id: string, attrs: Partial<CanvasElement>) => void;
}

export const PropertiesPanel = memo(function PropertiesPanel({ element, onChange }: Props) {
  if (!element) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        <p>Selecciona un elemento</p>
        <p className="text-xs mt-1">Click sobre un elemento del canvas para editarlo</p>
      </div>
    );
  }

  const update = (attrs: Partial<CanvasElement>) => onChange(element.id, attrs);

  return (
    <div className="p-4 space-y-5">
      <div>
        <h3 className="font-heading text-sm font-bold text-gray-800 mb-3">
          {element.type === "text" ? "Texto" : element.type === "button" ? "Botón" : "Imagen"}
        </h3>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">X</label>
          <input
            type="number"
            value={Math.round(element.x)}
            onChange={(e) => update({ x: Number(e.target.value) })}
            className="input text-sm py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Y</label>
          <input
            type="number"
            value={Math.round(element.y)}
            onChange={(e) => update({ y: Number(e.target.value) })}
            className="input text-sm py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ancho</label>
          <input
            type="number"
            value={Math.round(element.width)}
            onChange={(e) => update({ width: Number(e.target.value) })}
            className="input text-sm py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Alto</label>
          <input
            type="number"
            value={Math.round(element.height)}
            onChange={(e) => update({ height: Number(e.target.value) })}
            className="input text-sm py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Rotación</label>
          <input
            type="number"
            value={Math.round(element.rotation)}
            onChange={(e) => update({ rotation: Number(e.target.value) })}
            className="input text-sm py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Opacidad</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={element.opacity}
            onChange={(e) => update({ opacity: Number(e.target.value) })}
            className="w-full mt-1"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={element.visible}
              onChange={(e) => update({ visible: e.target.checked })}
              className="rounded border-slate-300 text-[#11ABC4] focus:ring-[#11ABC4]"
            />
            Visible
          </label>
        </div>
      </div>

      {/* Text specific */}
      {(element.type === "text" || element.type === "button") && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Contenido</label>
            <textarea
              value={(element as CanvasTextElement | CanvasButtonElement).text}
              onChange={(e) => update({ text: e.target.value } as any)}
              className="input text-sm py-1.5 min-h-[60px]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fuente</label>
            <FontSelector
              value={(element as any).fontFamily}
              onChange={(font) => update({ fontFamily: font } as any)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tamaño</label>
              <input
                type="number"
                value={(element as any).fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) } as any)}
                className="input text-sm py-1.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Peso</label>
              <select
                value={(element as any).fontWeight}
                onChange={(e) => update({ fontWeight: e.target.value } as any)}
                className="input text-sm py-1.5"
              >
                <option value="300">Light</option>
                <option value="400">Regular</option>
                <option value="600">SemiBold</option>
                <option value="700">Bold</option>
                <option value="800">ExtraBold</option>
              </select>
            </div>
          </div>
          {(element as any).fontStyle !== undefined && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={(element as CanvasTextElement).fontStyle === "italic"}
                  onChange={(e) => update({ fontStyle: e.target.checked ? "italic" : "" } as any)}
                  className="rounded"
                />
                Cursiva
              </label>
            </div>
          )}
          {element.type === "text" && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={(element as CanvasTextElement).textColor}
                    onChange={(e) => update({ textColor: e.target.value } as any)}
                    className="w-8 h-8 rounded cursor-pointer border border-slate-200 shrink-0"
                  />
                  <input
                    type="text"
                    value={(element as CanvasTextElement).textColor}
                    onChange={(e) => update({ textColor: e.target.value } as any)}
                    className="input text-sm py-1 flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Alineación</label>
                <div className="flex gap-1">
                  {(["left", "center", "right"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => update({ textAlign: a } as any)}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        (element as CanvasTextElement).textAlign === a
                          ? "border-[#11ABC4] bg-[#11ABC4]/10 text-[#11ABC4]"
                          : "border-slate-200 text-gray-500"
                      }`}
                    >
                      {a === "left" ? "Izq" : a === "center" ? "Centro" : "Der"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Espaciado</label>
                  <input
                    type="number"
                    value={(element as CanvasTextElement).letterSpacing}
                    onChange={(e) => update({ letterSpacing: Number(e.target.value) } as any)}
                    className="input text-sm py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Interlineado</label>
                  <input
                    type="number"
                    step={0.1}
                    value={(element as CanvasTextElement).lineHeight}
                    onChange={(e) => update({ lineHeight: Number(e.target.value) } as any)}
                    className="input text-sm py-1.5"
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Button specific */}
      {element.type === "button" && (
        <>
          <div>
            <UrlPicker
              value={(element as CanvasButtonElement).url}
              onChange={(url) => update({ url } as any)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Color botón</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={(element as CanvasButtonElement).backgroundColor}
                  onChange={(e) => update({ backgroundColor: e.target.value } as any)}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-200 shrink-0"
                />
                <input
                  type="text"
                  value={(element as CanvasButtonElement).backgroundColor}
                  onChange={(e) => update({ backgroundColor: e.target.value } as any)}
                  className="input text-sm py-1 flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Color texto</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={(element as CanvasButtonElement).textColor}
                  onChange={(e) => update({ textColor: e.target.value } as any)}
                  className="w-8 h-8 rounded cursor-pointer border border-slate-200 shrink-0"
                />
                <input
                  type="text"
                  value={(element as CanvasButtonElement).textColor}
                  onChange={(e) => update({ textColor: e.target.value } as any)}
                  className="input text-sm py-1 flex-1"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Alineación</label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => update({ textAlign: a } as any)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    (element as any).textAlign === a
                      ? "border-[#11ABC4] bg-[#11ABC4]/10 text-[#11ABC4]"
                      : "border-slate-200 text-gray-500"
                  }`}
                >
                  {a === "left" ? "Izq" : a === "center" ? "Centro" : "Der"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Borde redondeado</label>
              <input
                type="number"
                value={(element as CanvasButtonElement).borderRadius}
                onChange={(e) => update({ borderRadius: Number(e.target.value) } as any)}
                className="input text-sm py-1.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Padding X</label>
              <input
                type="number"
                value={(element as CanvasButtonElement).paddingX}
                onChange={(e) => update({ paddingX: Number(e.target.value) } as any)}
                className="input text-sm py-1.5"
              />
            </div>
          </div>
        </>
      )}

      {/* Image specific */}
      {(element.type === "image" || element.type === "gif") && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ajuste</label>
          <select
            value={(element as CanvasImageElement).fit}
            onChange={(e) => update({ fit: e.target.value as any } as any)}
            className="input text-sm py-1.5"
          >
            <option value="contain">Contener</option>
            <option value="cover">Cubrir</option>
            <option value="fill">Llenar</option>
          </select>
        </div>
      )}
    </div>
  );
});

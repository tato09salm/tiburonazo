"use client";

import { useState } from "react";
import { X, Printer, ShoppingBag, MapPin, User, Calendar, CreditCard, Ban, FileDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { cancelSale } from "@/actions/admin.actions";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import Image from "next/image";

interface Props {
  sale: any;
  onClose: () => void;
}

function generatePdfHtml(sale: any): string {
  const items = sale.items
    .map(
      (item: any) => `
      <tr>
        <td>
          <div class="product-name">${item.variant.product.title}</div>
          <div class="product-meta">${item.variant.sku} &nbsp;·&nbsp; ${item.variant.color?.name ?? "—"} &nbsp;·&nbsp; ${item.variant.size?.label ?? "—"}</div>
        </td>
        <td class="center">${item.quantity}</td>
        <td class="right muted">${formatPrice(item.price)}</td>
        <td class="right bold">${formatPrice(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const date = new Date(sale.date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Venta ${sale.code}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: #f5f4f0;
      display: flex;
      justify-content: center;
      padding: 40px 20px;
      color: #1a1a1a;
    }

    .document {
      background: #ffffff;
      width: 100%;
      max-width: 680px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 40px rgba(0,0,0,0.08);
    }

    /* Header */
    .header {
      padding: 36px 40px 28px;
      border-bottom: 1px solid #eeece6;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-left .eyebrow {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 6px;
    }
    .header-left .doc-number {
      font-size: 22px;
      font-weight: 600;
      color: #111;
      letter-spacing: -0.02em;
    }
    .badges {
      display: flex;
      gap: 6px;
      margin-top: 10px;
    }
    .badge {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .badge-success { background: #dcf5e7; color: #1a7a3f; }
    .badge-info    { background: #ddf0fb; color: #0d6ea0; }
    .badge-danger  { background: #fde8e8; color: #b02828; }

    .header-right { text-align: right; }
    .company-name {
      font-size: 15px;
      font-weight: 600;
      color: #111;
    }
    .company-sub {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }

    /* Meta grid */
    .meta-section {
      padding: 20px 40px;
      background: #fafaf8;
      border-bottom: 1px solid #eeece6;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px 12px;
    }
    .meta-item .meta-label {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #aaa;
      margin-bottom: 3px;
    }
    .meta-item .meta-value {
      font-size: 13px;
      font-weight: 500;
      color: #111;
    }

    /* Items */
    .items-section {
      padding: 28px 40px;
      border-bottom: 1px solid #eeece6;
    }
    .section-title {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #aaa;
      margin-bottom: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead tr {
      border-bottom: 1px solid #eeece6;
    }
    thead th {
      text-align: left;
      padding: 0 0 8px;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #bbb;
    }
    thead th.center { text-align: center; }
    thead th.right  { text-align: right; }
    tbody tr {
      border-bottom: 1px solid #f0ede6;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody td {
      padding: 12px 0;
      color: #333;
      vertical-align: top;
    }
    .product-name { font-weight: 500; color: #111; }
    .product-meta {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      color: #aaa;
      margin-top: 2px;
    }
    td.center { text-align: center; font-weight: 500; color: #111; }
    td.right  { text-align: right; }
    td.muted  { color: #888; }
    td.bold   { font-weight: 600; color: #111; }

    /* Totals */
    .totals-section {
      padding: 20px 40px;
      border-bottom: 1px solid #eeece6;
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      min-width: 200px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #666;
      padding: 3px 0;
    }
    .total-row.main {
      border-top: 1px solid #eeece6;
      margin-top: 8px;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 600;
      color: #111;
    }

    /* Notes */
    .notes-section {
      padding: 20px 40px;
      border-bottom: 1px solid #eeece6;
    }
    .notes-text {
      font-size: 13px;
      color: #888;
      font-style: italic;
      line-height: 1.6;
      margin-top: 8px;
    }

    /* Footer */
    .footer {
      padding: 20px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafaf8;
    }
    .footer-note {
      font-size: 11px;
      color: #bbb;
    }
    .footer-date {
      font-size: 11px;
      color: #bbb;
      font-family: 'DM Mono', monospace;
    }

    @media print {
      @page { margin: 0; }
      body { background: white; padding: 2cm; }
      .document { box-shadow: none; border-radius: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="document">

    <div class="header">
      <div class="header-left">
        <p class="eyebrow">Comprobante de venta</p>
        <p class="doc-number">${sale.code}</p>
        <div class="badges">
          <span class="badge ${sale.status === "ANULADA" ? "badge-danger" : "badge-success"}">${sale.status}</span>
          <span class="badge badge-info">${sale.paymentMethod}</span>
        </div>
      </div>
      <div class="header-right">
        <p class="company-name">Confecciones Landi Eirl | I.C.L.</p>
        <p class="company-sub">RUC 20195425729</p>
      </div>
    </div>

    <div class="meta-section">
      <div class="meta-item">
        <p class="meta-label">Fecha</p>
        <p class="meta-value">${date}</p>
      </div>
      <div class="meta-item">
        <p class="meta-label">Tienda</p>
        <p class="meta-value">${sale.store.name}</p>
      </div>
      <div class="meta-item">
        <p class="meta-label">Vendedor</p>
        <p class="meta-value">${sale.vendedor?.name ?? "—"}</p>
      </div>
      <div class="meta-item">
        <p class="meta-label">Nro. Venta</p>
        <p class="meta-value">${sale.nroVenta ? String(sale.nroVenta).padStart(2, "0") : "—"}</p>
      </div>
      <div class="meta-item">
        <p class="meta-label">Destino</p>
        <p class="meta-value">${sale.destination ?? "—"}</p>
      </div>
    </div>

    <div class="items-section">
      <p class="section-title">Productos vendidos</p>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th class="center">Cant.</th>
            <th class="right">Precio unit.</th>
            <th class="right">Importe</th>
          </tr>
        </thead>
        <tbody>
          ${items}
        </tbody>
      </table>
    </div>

    <div class="totals-section">
      <div class="totals-box">
        <div class="total-row main">
          <span>Total</span>
          <span>${formatPrice(sale.total)}</span>
        </div>
      </div>
    </div>

    ${
      sale.notes
        ? `<div class="notes-section" style="border-bottom: none;">
        <p class="section-title">Observaciones</p>
        <p class="notes-text">${sale.notes}</p>
      </div>`
        : ""
    }

  </div>
</body>
</html>`;
}

function exportToPdf(sale: any) {
  const html = generatePdfHtml(sale);
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  // Cambiar el título del documento para que no aparezca "about:blank" al imprimir
  const oldTitle = document.title;
  document.title = `Venta_${sale.code}`;

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    document.title = oldTitle;
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
}

export function SaleDetailsModal({ sale, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await cancelSale(sale.id);
      if (res.error) {
        alert(res.error);
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
      setConfirmCancel(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100">

        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1">
              Comprobante de venta
            </p>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              {sale.code}
            </h2>
            <div className="flex gap-2 mt-2.5">
              <span className={cn(
                "text-[10px] font-semibold tracking-wide uppercase px-3 py-0.5 rounded-full",
                sale.status === "ANULADA"
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-700"
              )}>
                {sale.status}
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-3 py-0.5 rounded-full bg-sky-50 text-sky-700">
                {sale.paymentMethod}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-8 py-4 bg-gray-50 border-b border-gray-100 grid grid-cols-3 gap-4 text-sm">
          {[
            { label: "Fecha", value: new Date(sale.date).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }) },
            { label: "Tienda", value: sale.store.name },
            { label: "Vendedor", value: sale.vendedor?.name ?? "—" },
            { label: "Nro. Venta", value: sale.nroVenta ? String(sale.nroVenta).padStart(2, "0") : "—" },
            { label: "Destino", value: sale.destination ?? "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase mb-0.5">{label}</p>
              <p className="font-medium text-gray-800 text-[13px]">{value}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

          {/* Items */}
          <div>
            <p className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase mb-3">
              Productos vendidos
            </p>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2.5 text-[9px] font-semibold tracking-widest text-gray-400 uppercase">Producto</th>
                  <th className="text-center pb-2.5 text-[9px] font-semibold tracking-widest text-gray-400 uppercase">Cant.</th>
                  <th className="text-right pb-2.5 text-[9px] font-semibold tracking-widest text-gray-400 uppercase">Precio</th>
                  <th className="text-right pb-2.5 text-[9px] font-semibold tracking-widest text-gray-400 uppercase">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sale.items.map((item: any) => {
                  const imageUrl = item.variant.product.images?.[0]?.url;
                  return (
                    <tr key={item.id}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {imageUrl ? (
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                              <Image src={imageUrl} alt={item.variant.product.title} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0">
                              <ShoppingBag size={14} />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{item.variant.product.title}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {item.variant.sku} · {item.variant.color?.name} · {item.variant.size?.label}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center font-medium text-gray-800">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-400">{formatPrice(item.price)}</td>
                      <td className="py-3 text-right font-semibold text-gray-800">{formatPrice(item.price * item.quantity)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total + Notes */}
          <div className="flex gap-6 items-start">
            {sale.notes && (
              <div className="flex-1">
                <p className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase mb-2">Observaciones</p>
                <p className="text-[13px] text-gray-500 italic leading-relaxed">{sale.notes}</p>
              </div>
            )}
            <div className="ml-auto text-right">
              <p className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase mb-1">Total</p>
              <p className="text-2xl font-semibold text-gray-900 tracking-tight">{formatPrice(sale.total)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <button
            onClick={() => exportToPdf(sale)}
            className="flex items-center gap-2 text-[13px] font-medium text-[#11ABC4] hover:text-[#0e8da2] px-5 py-2.5 rounded-xl border border-[#CCECFB] bg-[#CCECFB]/30 hover:bg-[#CCECFB]/50 transition-all shadow-sm"
          >
            <FileDown size={16} /> Descargar comprobante
          </button>

          <div className="flex items-center gap-2">
            {sale.status !== "ANULADA" && (
              <button
                onClick={() => setConfirmCancel(true)}
                className="flex items-center gap-2 text-[13px] font-medium text-red-500 hover:text-red-700 px-4 py-2 rounded-lg border border-red-100 bg-white hover:bg-red-50 transition-all"
              >
                <Ban size={15} /> Anular venta
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        title="Anular venta"
        message={`¿Estás seguro de anular la venta ${sale.code}? Esto devolverá el stock a los productos.`}
        confirmText="Sí, anular"
        cancelText="Mantener"
        type="danger"
        loading={loading}
      />
    </div>
  );
}
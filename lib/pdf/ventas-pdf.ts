import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type SaleLike = {
  code: string;
  date: string | Date;
  total: number;
  paymentMethod?: string;
  status?: string;
  vendedor?: { name?: string | null } | null;
  store?: { name?: string | null } | null;
};

type SalesFiltersLike = {
  from?: string;
  to?: string;
  vendedorId?: string;
  paymentMethod?: string;
  status?: string;
  client?: string;
};

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value ?? 0);

const addHeader = (doc: jsPDF, title: string, subtitle: string, filters?: SalesFiltersLike) => {
  doc.setFontSize(17);
  doc.setTextColor(17, 171, 196);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 20);

  const width = doc.getTextWidth(title);
  doc.setDrawColor(17, 171, 196);
  doc.setLineWidth(0.5);
  doc.line(14, 22, 14 + width, 22);

  doc.setFontSize(9);
  doc.setTextColor(110);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado: ${new Date().toLocaleString("es-PE")}`, 14, 29);
  
  // Mostrar filtros activos de forma elegante
  let y = 34;
  doc.text(subtitle, 14, y);
  
  if (filters) {
    const activeFilters = [];
    if (filters.vendedorId) activeFilters.push(`Vendedor: ID ${filters.vendedorId}`);
    if (filters.paymentMethod) activeFilters.push(`Metodo: ${filters.paymentMethod}`);
    if (filters.status) activeFilters.push(`Estado: ${filters.status}`);
    if (filters.client) activeFilters.push(`Busqueda: "${filters.client}"`);

    if (activeFilters.length > 0) {
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Filtros activos:", 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(activeFilters.join(" | "), 38, y);
    }
  }
};

const addFooter = (doc: jsPDF) => {
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Pagina ${i} de ${totalPages} - Tiburonazo Ventas`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 8,
      { align: "center" }
    );
  }
};

export function generateSalesPDFByDay(sales: SaleLike[]) {
  const groups = new Map<string, { count: number; total: number }>();
  sales.forEach((sale) => {
    const key = formatDate(sale.date);
    const current = groups.get(key) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += Number(sale.total ?? 0);
    groups.set(key, current);
  });

  const rows = [...groups.entries()].map(([day, data]) => [
    day,
    String(data.count),
    formatMoney(data.total),
  ]);

  const doc = new jsPDF();
  addHeader(doc, "REPORTE DE VENTAS POR DIA", `Registros analizados: ${sales.length}`);
  autoTable(doc, {
    head: [["Fecha", "Ventas", "Total"]],
    body: rows,
    startY: 40,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [26, 26, 46], textColor: 255 },
  });
  addFooter(doc);
  doc.save(`ventas-por-dia-${Date.now()}.pdf`);
}

export function generateSalesPDFByRange(sales: SaleLike[], filters: SalesFiltersLike) {
  const subtitle = `Rango: ${filters.from || "Inicio"} - ${filters.to || "Hoy"} | Total Ventas: ${sales.length}`;
  
  // Título dinámico basado en filtros
  let title = "REPORTE DETALLADO DE VENTAS";
  if (filters.status === "ANULADA") title = "REPORTE DE VENTAS ANULADAS";
  else if (filters.status === "COMPLETADA") title = "REPORTE DE VENTAS COMPLETADAS";
  
  const rows = sales.map((sale) => [
    sale.code || "-",
    formatDate(sale.date),
    sale.vendedor?.name || "-",
    sale.paymentMethod || "-",
    sale.status || "-",
    formatMoney(Number(sale.total ?? 0)),
  ]);

  const totalMonto = sales.reduce((acc, sale) => acc + Number(sale.total ?? 0), 0);

  const doc = new jsPDF("landscape");
  addHeader(doc, title, subtitle, filters);
  
  autoTable(doc, {
    head: [["Codigo", "Fecha", "Vendedor", "Metodo", "Estado", "Total"]],
    body: rows,
    startY: filters && (filters.vendedorId || filters.paymentMethod || filters.status || filters.client) ? 45 : 40,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [26, 26, 46], textColor: 255 },
    foot: [["", "", "", "", "TOTAL ACUMULADO", formatMoney(totalMonto)]],
    footStyles: { fillColor: [240, 240, 240], textColor: [26, 26, 46], fontStyle: "bold" },
  });
  
  addFooter(doc);
  doc.save(`reporte-ventas-${Date.now()}.pdf`);
}

export function generateSalesPDFBySeller(sales: SaleLike[]) {
  const groups = new Map<string, { count: number; total: number }>();
  sales.forEach((sale) => {
    const key = sale.vendedor?.name || "Sin vendedor";
    const current = groups.get(key) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += Number(sale.total ?? 0);
    groups.set(key, current);
  });

  const rows = [...groups.entries()].map(([seller, data]) => [
    seller,
    String(data.count),
    formatMoney(data.total),
  ]);

  const doc = new jsPDF();
  addHeader(doc, "REPORTE DE VENTAS POR VENDEDOR", `Registros analizados: ${sales.length}`);
  autoTable(doc, {
    head: [["Vendedor", "Ventas", "Total"]],
    body: rows,
    startY: 40,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [26, 26, 46], textColor: 255 },
  });
  addFooter(doc);
  doc.save(`ventas-por-vendedor-${Date.now()}.pdf`);
}

export function generateSalesPDFByPaymentMethod(sales: SaleLike[]) {
  const groups = new Map<string, { count: number; total: number }>();
  sales.forEach((sale) => {
    const key = sale.paymentMethod || "Sin metodo";
    const current = groups.get(key) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += Number(sale.total ?? 0);
    groups.set(key, current);
  });

  const rows = [...groups.entries()].map(([method, data]) => [
    method,
    String(data.count),
    formatMoney(data.total),
  ]);

  const doc = new jsPDF();
  addHeader(doc, "REPORTE DE VENTAS POR METODO DE PAGO", `Registros analizados: ${sales.length}`);
  autoTable(doc, {
    head: [["Metodo", "Ventas", "Total"]],
    body: rows,
    startY: 40,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [26, 26, 46], textColor: 255 },
  });
  addFooter(doc);
  doc.save(`ventas-por-metodo-${Date.now()}.pdf`);
}

export function generateSalesPDFByStatus(sales: SaleLike[]) {
  const groups = new Map<string, { count: number; total: number }>();
  sales.forEach((sale) => {
    const key = sale.status || "Sin estado";
    const current = groups.get(key) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += Number(sale.total ?? 0);
    groups.set(key, current);
  });

  const rows = [...groups.entries()].map(([status, data]) => [
    status,
    String(data.count),
    formatMoney(data.total),
  ]);

  const doc = new jsPDF();
  addHeader(doc, "REPORTE DE VENTAS POR ESTADO", `Registros analizados: ${sales.length}`);
  autoTable(doc, {
    head: [["Estado", "Ventas", "Total"]],
    body: rows,
    startY: 40,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [26, 26, 46], textColor: 255 },
  });
  addFooter(doc);
  doc.save(`ventas-por-estado-${Date.now()}.pdf`);
}

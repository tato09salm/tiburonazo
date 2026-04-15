import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInventoryPDF = (
  data: any[], 
  filters: { searchTerm: string, type: string, start: string, end: string }
) => {
  const doc = new jsPDF();
  const title = "REPORTE DE MOVIMIENTOS DE INVENTARIO";

  // --- CONFIGURACIÓN DE CABECERA ---
  doc.setFontSize(18);
  doc.setTextColor(17, 171, 196); // Color principal #11ABC4
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 22);

  // --- LÍNEA DECORATIVA DINÁMICA ---
  // Calculamos el ancho exacto del texto del título para la línea
  const titleWidth = doc.getTextWidth(title);
  doc.setDrawColor(17, 171, 196);
  doc.setLineWidth(0.5);
  doc.line(14, 24, 14 + titleWidth, 24); // La línea ahora mide lo mismo que el título

  // --- INFORMACIÓN DE FILTROS ---
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  
  const fechaGen = new Date().toLocaleString("es-PE");
  doc.text(`Fecha de generación: ${fechaGen}`, 14, 32);
  
  const textoFiltros = `Filtros: Tipo: ${filters.type} | Rango: ${filters.start || 'Inicio'} - ${filters.end || 'Hoy'}`;
  doc.text(textoFiltros, 14, 37);

  if (filters.searchTerm) {
    doc.text(`Búsqueda: "${filters.searchTerm}"`, 14, 42);
  }

  // --- PREPARAR DATOS PARA LA TABLA ---
  const tableRows = data.map((move) => [
    `${new Date(move.date).toLocaleDateString("es-PE")}\n${new Date(move.date).toLocaleTimeString("es-PE", { hour: '2-digit', minute: '2-digit' })}`,
    { content: `${move.variant.product.title}\nSKU: ${move.variant.sku}`, styles: { fontStyle: 'normal' } },
    move.type,
    move.type === "SALIDA" ? `-${move.quantity}` : `+${move.quantity}`,
    move.stockAfter ?? "—",
    move.reason || "—",
  ]);

  // --- GENERAR TABLA CON AUTOTABLE ---
  autoTable(doc, {
    head: [["Fecha", "Producto / SKU", "Tipo", "Cant.", "Final", "Motivo"]],
    body: tableRows,
    startY: filters.searchTerm ? 48 : 43,
    margin: { left: 14, right: 14 },
    styles: { 
      fontSize: 8, 
      cellPadding: 3, 
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [26, 26, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' }, // Reducido un poco
      1: { cellWidth: 'auto' },               // El producto toma lo que sobra
      2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 45 },                   // Aumentado el espacio para Motivo significativamente
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 2 || data.column.index === 3) {
          const rowData = data.row.raw as any[];
          const type = rowData[2]; 

          if (type === 'ENTRADA') {
            data.cell.styles.textColor = [34, 197, 94]; 
          } else if (type === 'SALIDA') {
            data.cell.styles.textColor = [239, 68, 68]; 
          }
        }
      }
    },
    alternateRowStyles: {
      fillColor: [250, 252, 255]
    }
  });

  // --- PIE DE PÁGINA ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(
      `Página ${i} de ${totalPages} - Tiburonazo Inventarios`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  const fileName = `Reporte_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};
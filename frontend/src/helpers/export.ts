/**
 * Utility to export data to CSV format and trigger a browser download.
 */

/**
 * Converts an array of objects or arrays into a CSV string.
 * @param headers Column headers for the CSV
 * @param rows Data rows to be exported
 * @returns A formatted CSV string
 */
export function generateCSV(headers: string[], rows: (string | number)[][]): string {
  const csvRows = [
    headers.join(","),
    ...rows.map(row => 
      row.map(value => {
        const strValue = String(value).replace(/"/g, '""'); // Escape double quotes
        return strValue.includes(",") || strValue.includes("\n") || strValue.includes('"') 
          ? `"${strValue}"` 
          : strValue;
      }).join(",")
    )
  ];
  return csvRows.join("\n");
}

/**
 * Triggers a file download in the browser.
 * @param content The string content of the file
 * @param filename The name of the file to be saved
 * @param contentType The MIME type of the content
 */
export function downloadFile(content: string, filename: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object to free memory
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Specialized helper to export Dashboard KPI data to CSV.
 * @param data Array of KPI records from the Gold layer
 */
export function exportKpiToCSV(data: any[]): void {
  const headers = [
    "Ano/Mes", 
    "Total Pedidos", 
    "Pedidos Aprovados", 
    "Receita Bruta (R$)", 
    "Ticket Médio (R$)", 
    "Clientes Únicos", 
    "Taxa Aprovação (%)",
    "Categoria Top"
  ];

  const rows = data.map(m => [
    m.ano_mes,
    m.qtd_pedidos,
    m.qtd_pedidos_aprovados,
    m.receita_bruta.toFixed(2),
    m.ticket_medio.toFixed(2),
    m.qtd_clientes_unicos,
    m.taxa_aprovacao.toFixed(2),
    m.categoria_mais_vendida
  ]);

  const csvContent = generateCSV(headers, rows);
  const filename = `vcommerce_dashboard_kpi_${new Date().toISOString().slice(0, 10)}.csv`;
  
  downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
}

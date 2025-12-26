import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { Tariff } from "@/hooks/useTariffs";
import { toast } from "sonner";
import XLSX from "xlsx-js-style";

interface ExportActionsProps {
  tariffs: Tariff[];
  selectedTariffs: string[];
}

const headerStyle = {
  font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
  fill: { fgColor: { rgb: "0066CC" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  },
};

const cellStyle = {
  font: { sz: 10 },
  alignment: { vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: "CCCCCC" } },
    bottom: { style: "thin", color: { rgb: "CCCCCC" } },
    left: { style: "thin", color: { rgb: "CCCCCC" } },
    right: { style: "thin", color: { rgb: "CCCCCC" } },
  },
};

const currencyStyle = {
  ...cellStyle,
  alignment: { horizontal: "right", vertical: "center" },
  numFmt: '"USD "#,##0.00',
};

const centerStyle = {
  ...cellStyle,
  alignment: { horizontal: "center", vertical: "center" },
};

function exportToXLSX(tariffs: Tariff[], filename: string) {
  const headers = [
    "Armador",
    "POL",
    "POD",
    "Commodity",
    "20'DC (USD)",
    "40'HC (USD)",
    "40'Reefer (USD)",
    "FT Origem",
    "FT Destino",
    "Transit Time",
    "ENS/AMS",
    "Validade",
    "Observações",
  ];

  // Create header row with styles
  const headerRow = headers.map((h) => ({
    v: h,
    t: "s",
    s: headerStyle,
  }));

  // Create data rows with styles
  const dataRows = tariffs.map((t) => [
    { v: t.carrier || "-", t: "s", s: cellStyle },
    { v: t.pol || "-", t: "s", s: cellStyle },
    { v: t.pod || "-", t: "s", s: cellStyle },
    { v: t.commodity || "-", t: "s", s: cellStyle },
    t.price_20dc
      ? { v: t.price_20dc, t: "n", s: currencyStyle }
      : { v: "-", t: "s", s: centerStyle },
    t.price_40hc
      ? { v: t.price_40hc, t: "n", s: currencyStyle }
      : { v: "-", t: "s", s: centerStyle },
    t.price_40reefer
      ? { v: t.price_40reefer, t: "n", s: currencyStyle }
      : { v: "-", t: "s", s: centerStyle },
    { v: t.free_time_origin || "-", t: "s", s: centerStyle },
    { v: t.free_time_destination || "-", t: "s", s: centerStyle },
    { v: t.transit_time || "-", t: "s", s: centerStyle },
    { v: t.ens_ams || "-", t: "s", s: centerStyle },
    { v: t.validity || "-", t: "s", s: centerStyle },
    { v: t.subject_to || "-", t: "s", s: cellStyle },
  ]);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

  // Set column widths
  ws["!cols"] = [
    { wch: 12 }, // Armador
    { wch: 25 }, // POL
    { wch: 25 }, // POD
    { wch: 15 }, // Commodity
    { wch: 14 }, // 20'DC
    { wch: 14 }, // 40'HC
    { wch: 14 }, // 40'Reefer
    { wch: 12 }, // FT Origem
    { wch: 12 }, // FT Destino
    { wch: 12 }, // Transit Time
    { wch: 12 }, // ENS/AMS
    { wch: 12 }, // Validade
    { wch: 35 }, // Observações
  ];

  // Set row height for header
  ws["!rows"] = [{ hpt: 30 }];

  // Enable auto-filter
  ws["!autofilter"] = { ref: `A1:M${tariffs.length + 1}` };

  // Freeze first row
  ws["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", state: "frozen" };

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tarifas");

  // Save file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function generatePDFContent(tariffs: Tariff[]): string {
  const date = new Date().toLocaleDateString("pt-BR");

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Cotação de Frete Marítimo</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        h1 { color: #0066cc; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
        .date { color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #0066cc; color: white; padding: 12px 8px; text-align: left; }
        td { padding: 10px 8px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
        .price { text-align: right; font-family: monospace; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
      </style>
    </head>
    <body>
      <h1>Cotação de Frete Marítimo</h1>
      <p class="date">Data: ${date}</p>
      <table>
        <tr>
          <th>Armador</th>
          <th>POL</th>
          <th>POD</th>
          <th>20'DC</th>
          <th>40'HC</th>
          <th>40'Reefer</th>
          <th>TT</th>
          <th>FT</th>
          <th>Validade</th>
        </tr>
  `;

  tariffs.forEach((t) => {
    html += `
      <tr>
        <td>${t.carrier}</td>
        <td>${t.pol}</td>
        <td>${t.pod}</td>
        <td class="price">${t.price_20dc ? `USD ${t.price_20dc.toLocaleString("pt-BR")}` : "-"}</td>
        <td class="price">${t.price_40hc ? `USD ${t.price_40hc.toLocaleString("pt-BR")}` : "-"}</td>
        <td class="price">${t.price_40reefer ? `USD ${t.price_40reefer.toLocaleString("pt-BR")}` : "-"}</td>
        <td>${t.transit_time || "-"}</td>
        <td>${t.free_time || "-"}</td>
        <td>${t.validity || "-"}</td>
      </tr>
    `;
  });

  html += `
      </table>
      <div class="footer">
        <p>Cotação gerada automaticamente pelo Sistema de Tarifário.</p>
        <p>Valores sujeitos a alteração sem aviso prévio. Consulte condições específicas (Subject to) de cada tarifa.</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

function exportToPDF(tariffs: Tariff[], filename: string) {
  const html = generatePDFContent(tariffs);
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

export function ExportActions({ tariffs, selectedTariffs }: ExportActionsProps) {
  const dataToExport = selectedTariffs.length > 0 ? tariffs.filter((t) => selectedTariffs.includes(t.id)) : tariffs;

  const handleExportXLSX = () => {
    if (dataToExport.length === 0) {
      toast.error("Nenhuma tarifa para exportar");
      return;
    }
    exportToXLSX(dataToExport, `tarifas_${new Date().toISOString().split("T")[0]}`);
    toast.success(`${dataToExport.length} tarifa(s) exportada(s) para Excel`);
  };

  const handleExportPDF = () => {
    if (dataToExport.length === 0) {
      toast.error("Nenhuma tarifa para exportar");
      return;
    }
    exportToPDF(dataToExport, `cotacao_${new Date().toISOString().split("T")[0]}`);
    toast.success("Abrindo janela de impressão...");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar {selectedTariffs.length > 0 ? `(${selectedTariffs.length})` : ""}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover z-50">
        <DropdownMenuItem onClick={handleExportXLSX} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar para Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          Exportar Cotação (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

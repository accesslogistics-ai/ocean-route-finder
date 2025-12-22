import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { Tariff } from "@/hooks/useTariffs";
import { toast } from "sonner";

interface ExportActionsProps {
  tariffs: Tariff[];
  selectedTariffs: string[];
}

function exportToCSV(tariffs: Tariff[], filename: string) {
  const headers = [
    "Armador",
    "POL",
    "POD",
    "20'DC (USD)",
    "40'HC (USD)",
    "40'Reefer (USD)",
    "Free Time",
    "Transit Time",
    "ENS/AMS",
    "Validade",
    "Subject to",
  ];

  const rows = tariffs.map((t) => [
    t.carrier,
    t.pol,
    t.pod,
    t.price_20dc?.toString() || "",
    t.price_40hc?.toString() || "",
    t.price_40reefer?.toString() || "",
    t.free_time || "",
    t.transit_time || "",
    t.ens_ams || "",
    t.validity || "",
    t.subject_to || "",
  ]);

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
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

  const handleExportCSV = () => {
    if (dataToExport.length === 0) {
      toast.error("Nenhuma tarifa para exportar");
      return;
    }
    exportToCSV(dataToExport, `tarifas_${new Date().toISOString().split("T")[0]}`);
    toast.success(`${dataToExport.length} tarifa(s) exportada(s) para CSV`);
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
        <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar para Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          Exportar Cotação (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { Tariff } from "@/hooks/useTariffs";
import { toast } from "sonner";
import XLSX from "xlsx-js-style";
import { LOCALE_MAP, type SupportedLanguage } from "@/i18n";
import { escapeHtml } from "@/lib/security";

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

function exportToXLSX(tariffs: Tariff[], filename: string, t: (key: string) => string) {
  const headers = [
    t("tariffs.carrier"),
    "POL",
    "POD",
    "Commodity",
    "20'DC (USD)",
    "40'HC (USD)",
    "40'Reefer (USD)",
    "FT Origin",
    "FT Destination",
    "Transit Time",
    "ENS/AMS",
    t("tariffs.validity"),
    "Subject to",
  ];

  // Create header row with styles
  const headerRow = headers.map((h) => ({
    v: h,
    t: "s",
    s: headerStyle,
  }));

  // Create data rows with styles
  const dataRows = tariffs.map((tariff) => [
    { v: tariff.carrier || "-", t: "s", s: cellStyle },
    { v: tariff.pol || "-", t: "s", s: cellStyle },
    { v: tariff.pod || "-", t: "s", s: cellStyle },
    { v: tariff.commodity || "-", t: "s", s: cellStyle },
    tariff.price_20dc
      ? { v: tariff.price_20dc, t: "n", s: currencyStyle }
      : { v: "-", t: "s", s: centerStyle },
    tariff.price_40hc
      ? { v: tariff.price_40hc, t: "n", s: currencyStyle }
      : { v: "-", t: "s", s: centerStyle },
    tariff.price_40reefer
      ? { v: tariff.price_40reefer, t: "n", s: currencyStyle }
      : { v: "-", t: "s", s: centerStyle },
    { v: tariff.free_time_origin || "-", t: "s", s: centerStyle },
    { v: tariff.free_time_destination || "-", t: "s", s: centerStyle },
    { v: tariff.transit_time || "-", t: "s", s: centerStyle },
    { v: tariff.ens_ams || "-", t: "s", s: centerStyle },
    { v: tariff.validity || "-", t: "s", s: centerStyle },
    { v: tariff.subject_to || "-", t: "s", s: cellStyle },
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
  XLSX.utils.book_append_sheet(wb, ws, "Tariffs");

  // Save file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

function generatePDFContent(tariffs: Tariff[], t: (key: string) => string, locale: string): string {
  const date = new Date().toLocaleDateString(locale);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
      <title>${escapeHtml(t("export.quoteTitle"))}</title>
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
      <h1>${escapeHtml(t("export.quoteTitle"))}</h1>
      <p class="date">${escapeHtml(t("export.date"))}: ${escapeHtml(date)}</p>
      <table>
        <tr>
          <th>${escapeHtml(t("tariffs.carrier"))}</th>
          <th>POL</th>
          <th>POD</th>
          <th>20'DC</th>
          <th>40'HC</th>
          <th>40'Reefer</th>
          <th>TT</th>
          <th>FT</th>
          <th>${escapeHtml(t("tariffs.validity"))}</th>
        </tr>
  `;

  tariffs.forEach((tariff) => {
    const formatPrice = (price: number | null) => {
      if (price === null) return "-";
      return new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(price);
    };

    html += `
      <tr>
        <td>${escapeHtml(tariff.carrier)}</td>
        <td>${escapeHtml(tariff.pol)}</td>
        <td>${escapeHtml(tariff.pod)}</td>
        <td class="price">${escapeHtml(formatPrice(tariff.price_20dc))}</td>
        <td class="price">${escapeHtml(formatPrice(tariff.price_40hc))}</td>
        <td class="price">${escapeHtml(formatPrice(tariff.price_40reefer))}</td>
        <td>${escapeHtml(tariff.transit_time)}</td>
        <td>${escapeHtml(tariff.free_time)}</td>
        <td>${escapeHtml(tariff.validity)}</td>
      </tr>
    `;
  });

  html += `
      </table>
      <div class="footer">
        <p>${escapeHtml(t("export.quoteFooter"))}</p>
        <p>${escapeHtml(t("export.quoteDisclaimer"))}</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

function exportToPDF(tariffs: Tariff[], filename: string, t: (key: string) => string, locale: string) {
  const html = generatePDFContent(tariffs, t, locale);
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
  const { t, i18n } = useTranslation();
  const locale = LOCALE_MAP[i18n.language as SupportedLanguage] || "pt-BR";
  const dataToExport = selectedTariffs.length > 0 ? tariffs.filter((tariff) => selectedTariffs.includes(tariff.id)) : tariffs;

  const handleExportXLSX = () => {
    if (dataToExport.length === 0) {
      toast.error(t("export.noTariffsToExport"));
      return;
    }
    exportToXLSX(dataToExport, `tariffs_${new Date().toISOString().split("T")[0]}`, t);
    toast.success(`${dataToExport.length} ${t("export.tariffsExported")}`);
  };

  const handleExportPDF = () => {
    if (dataToExport.length === 0) {
      toast.error(t("export.noTariffsToExport"));
      return;
    }
    exportToPDF(dataToExport, `quote_${new Date().toISOString().split("T")[0]}`, t, locale);
    toast.success(t("export.openingPrint"));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {t("export.export")} {selectedTariffs.length > 0 ? `(${selectedTariffs.length})` : ""}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover z-50">
        <DropdownMenuItem onClick={handleExportXLSX} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4" />
          {t("export.exportExcel")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          {t("export.exportPDF")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

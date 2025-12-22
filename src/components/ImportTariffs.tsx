import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileSpreadsheet, AlertTriangle, X, Check } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface ParsedTariff {
  carrier: string;
  pol: string;
  pod: string;
  commodity: string | null;
  price_20dc: number | null;
  price_40hc: number | null;
  price_40reefer: number | null;
  free_time_origin: string | null;
  free_time_destination: string | null;
  transit_time: string | null;
  ens_ams: string | null;
  validity: string | null;
  subject_to: string | null;
}

// Normalize header for flexible matching
function normalizeHeader(header: string): string {
  return String(header)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/\s+/g, " "); // Normalize spaces
}

// Column mapping: normalized Excel column name -> database field
const COLUMN_MAP_NORMALIZED: Record<string, keyof ParsedTariff> = {
  "origem": "pol",
  "destino": "pod",
  "armador": "carrier",
  "commodity": "commodity",
  "20 dry": "price_20dc",
  "40 high cube": "price_40hc",
  "40 reefer": "price_40reefer",
  "free time origem": "free_time_origin",
  "free time destino": "free_time_destination",
  "transit time": "transit_time",
  "ens": "ens_ams",
  "validade": "validity",
  "obs": "subject_to",
};

// Required normalized headers for finding header row
const REQUIRED_HEADERS = ["origem", "destino", "armador"];

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^\d.,\-]/g, "").replace(",", "."));
  return isNaN(num) ? null : num;
}

function parseString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim();
}

// Find the header row by looking for required columns
function findHeaderRowIndex(data: unknown[][]): number {
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i];
    if (!row || !Array.isArray(row)) continue;
    
    const normalizedRow = row.map((cell) => normalizeHeader(String(cell || "")));
    const hasAllRequired = REQUIRED_HEADERS.every((req) =>
      normalizedRow.some((cell) => cell.includes(req))
    );
    
    if (hasAllRequired) {
      return i;
    }
  }
  return -1;
}

export function ImportTariffs() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTariff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetState = useCallback(() => {
    setFile(null);
    setParsedData([]);
    setIsLoading(false);
    setIsImporting(false);
    setProgress(0);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    resetState();
  }, [resetState]);

  const parseExcelFile = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

      if (jsonData.length < 2) {
        throw new Error("Arquivo vazio ou sem dados");
      }

      // Find header row automatically
      const headerRowIndex = findHeaderRowIndex(jsonData);
      if (headerRowIndex === -1) {
        throw new Error("Colunas obrigatórias não encontradas: Origem, Destino, Armador");
      }

      const headers = jsonData[headerRowIndex] as string[];
      const columnIndices: Partial<Record<keyof ParsedTariff, number>> = {};

      headers.forEach((header, index) => {
        const normalizedHeader = normalizeHeader(String(header || ""));
        // Check exact match first, then partial match
        let mappedField = COLUMN_MAP_NORMALIZED[normalizedHeader];
        if (!mappedField) {
          // Try partial matching for flexibility
          for (const [key, field] of Object.entries(COLUMN_MAP_NORMALIZED)) {
            if (normalizedHeader.includes(key) || key.includes(normalizedHeader)) {
              mappedField = field;
              break;
            }
          }
        }
        if (mappedField) {
          columnIndices[mappedField] = index;
        }
      });

      // Validate required columns
      if (!columnIndices.pol || !columnIndices.pod || !columnIndices.carrier) {
        throw new Error("Colunas obrigatórias não encontradas: Origem, Destino, Armador");
      }

      const parsed: ParsedTariff[] = [];
      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i] as unknown[];
        if (!row || row.length === 0) continue;

        const carrier = parseString(row[columnIndices.carrier!]);
        const pol = parseString(row[columnIndices.pol!]);
        const pod = parseString(row[columnIndices.pod!]);

        if (!carrier || !pol || !pod) continue;

        parsed.push({
          carrier,
          pol,
          pod,
          commodity: parseString(row[columnIndices.commodity ?? -1]),
          price_20dc: parseNumber(row[columnIndices.price_20dc ?? -1]),
          price_40hc: parseNumber(row[columnIndices.price_40hc ?? -1]),
          price_40reefer: parseNumber(row[columnIndices.price_40reefer ?? -1]),
          free_time_origin: parseString(row[columnIndices.free_time_origin ?? -1]),
          free_time_destination: parseString(row[columnIndices.free_time_destination ?? -1]),
          transit_time: parseString(row[columnIndices.transit_time ?? -1]),
          ens_ams: parseString(row[columnIndices.ens_ams ?? -1]),
          validity: parseString(row[columnIndices.validity ?? -1]),
          subject_to: parseString(row[columnIndices.subject_to ?? -1]),
        });
      }

      if (parsed.length === 0) {
        throw new Error("Nenhum registro válido encontrado no arquivo");
      }

      setParsedData(parsed);
      setFile(file);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao ler arquivo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
      resetState();
    } finally {
      setIsLoading(false);
    }
  }, [toast, resetState]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.match(/\.(xlsx|xls)$/i)) {
        parseExcelFile(file);
      } else {
        toast({
          variant: "destructive",
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
        });
      }
    }
  }, [parseExcelFile, toast]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      parseExcelFile(files[0]);
    }
  }, [parseExcelFile]);

  const handleImport = useCallback(async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    setProgress(0);

    try {
      // Step 1: Delete all existing tariffs
      setProgress(10);
      const { error: deleteError } = await supabase.from("tariffs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (deleteError) {
        throw new Error(`Erro ao limpar dados: ${deleteError.message}`);
      }

      setProgress(30);

      // Step 2: Insert new tariffs in batches
      const batchSize = 50;
      const totalBatches = Math.ceil(parsedData.length / batchSize);
      
      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize);
        const { error: insertError } = await supabase.from("tariffs").insert(batch);
        
        if (insertError) {
          throw new Error(`Erro ao inserir dados: ${insertError.message}`);
        }

        const currentBatch = Math.floor(i / batchSize) + 1;
        setProgress(30 + (currentBatch / totalBatches) * 60);
      }

      setProgress(100);

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["tariffs"] });
      await queryClient.invalidateQueries({ queryKey: ["carriers"] });
      await queryClient.invalidateQueries({ queryKey: ["pols"] });
      await queryClient.invalidateQueries({ queryKey: ["pods"] });

      toast({
        title: "Importação concluída!",
        description: `${parsedData.length} tarifas importadas com sucesso.`,
      });

      handleClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsImporting(false);
    }
  }, [parsedData, queryClient, toast, handleClose]);

  const formatPrice = (price: number | null) => {
    if (price === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Tarifas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Tarifas do Excel
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel (.xlsx) com as tarifas. Todos os dados atuais serão substituídos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {!file && !isLoading && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Arraste seu arquivo Excel aqui
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                ou clique para selecionar
              </p>
              <label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <Button variant="secondary" className="cursor-pointer" asChild>
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Processando arquivo...</p>
              </div>
            </div>
          )}

          {file && parsedData.length > 0 && (
            <>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {parsedData.length} registros encontrados
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={resetState}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                        <TableHead>Armador</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Commodity</TableHead>
                        <TableHead className="text-right">20 DRY</TableHead>
                        <TableHead className="text-right">40 HC</TableHead>
                        <TableHead>Validade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 10).map((tariff, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{tariff.carrier}</TableCell>
                          <TableCell>{tariff.pol}</TableCell>
                          <TableCell>{tariff.pod}</TableCell>
                          <TableCell>{tariff.commodity || "-"}</TableCell>
                          <TableCell className="text-right">{formatPrice(tariff.price_20dc)}</TableCell>
                          <TableCell className="text-right">{formatPrice(tariff.price_40hc)}</TableCell>
                          <TableCell>{tariff.validity || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedData.length > 10 && (
                  <div className="p-2 text-center text-sm text-muted-foreground bg-muted/30">
                    Mostrando 10 de {parsedData.length} registros
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Atenção</p>
                  <p className="text-sm text-muted-foreground">
                    Todos os dados atuais de tarifas serão apagados e substituídos pelos {parsedData.length} novos registros.
                  </p>
                </div>
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">
                    Importando... {Math.round(progress)}%
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {file && parsedData.length > 0 && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isImporting}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={isImporting} className="gap-2">
              <Check className="h-4 w-4" />
              Confirmar Importação
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

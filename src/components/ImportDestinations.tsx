import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileSpreadsheet, X, MapPin, Check } from "lucide-react";
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

interface ParsedDestination {
  destination: string;
  country: string;
}

function normalizeHeader(header: string): string {
  return String(header)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

const COLUMN_MAP_NORMALIZED: Record<string, keyof ParsedDestination> = {
  "destino": "destination",
  "pais destino": "country",
  "pais": "country",
  "country": "country",
  "destination": "destination",
};

const REQUIRED_HEADERS = ["destino"];
const HEADER_SCAN_MAX_ROWS = 50;

function parseString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim();
}

function findHeaderRowIndex(data: unknown[][]): number {
  for (let i = 0; i < Math.min(data.length, HEADER_SCAN_MAX_ROWS); i++) {
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

interface ImportDestinationsProps {
  trigger?: React.ReactNode;
}

export function ImportDestinations({ trigger }: ImportDestinationsProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedDestination[]>([]);
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

      const headerRowIndex = findHeaderRowIndex(jsonData);
      if (headerRowIndex === -1) {
        throw new Error(
          `Colunas obrigatórias não encontradas: Destino, País destino`
        );
      }

      const headers = jsonData[headerRowIndex] as string[];
      const columnIndices: Partial<Record<keyof ParsedDestination, number>> = {};

      headers.forEach((header, index) => {
        const normalizedHeader = normalizeHeader(String(header || ""));
        let mappedField = COLUMN_MAP_NORMALIZED[normalizedHeader];
        if (!mappedField) {
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

      if (columnIndices.destination === undefined) {
        throw new Error("Coluna 'Destino' não encontrada");
      }
      if (columnIndices.country === undefined) {
        throw new Error("Coluna 'País destino' não encontrada");
      }

      const parsed: ParsedDestination[] = [];
      const seen = new Set<string>();

      for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i] as unknown[];
        if (!row || row.length === 0) continue;

        const destination = parseString(row[columnIndices.destination!]);
        const country = parseString(row[columnIndices.country!]);

        if (!destination || !country) continue;

        const key = `${destination.toLowerCase()}-${country.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        parsed.push({ destination, country });
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
      setProgress(10);

      // Use UPSERT instead of DELETE + INSERT (Smart Merge)
      const batchSize = 100;
      const totalBatches = Math.ceil(parsedData.length / batchSize);
      
      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize);
        const { error: upsertError } = await supabase
          .from("destinations")
          .upsert(batch, { 
            onConflict: 'destination',
            ignoreDuplicates: false 
          });
        
        if (upsertError) {
          throw new Error(`Erro ao inserir/atualizar dados: ${upsertError.message}`);
        }

        const currentBatch = Math.floor(i / batchSize) + 1;
        setProgress(10 + (currentBatch / totalBatches) * 80);
      }

      setProgress(100);

      await queryClient.invalidateQueries({ queryKey: ["countries"] });
      await queryClient.invalidateQueries({ queryKey: ["destinations"] });

      toast({
        title: "Importação concluída!",
        description: `${parsedData.length} destinos adicionados/atualizados com sucesso.`,
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <MapPin className="h-4 w-4" />
            Importar Destinos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Importar Destinos e Países
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel (.xlsx) com as colunas "Destino" e "País destino".
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
                      {parsedData.length} destinos encontrados
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
                        <TableHead>Destino</TableHead>
                        <TableHead>País</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 20).map((dest, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{dest.destination}</TableCell>
                          <TableCell>{dest.country}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {parsedData.length > 20 && (
                  <div className="p-2 text-center text-sm text-muted-foreground bg-muted/30">
                    Mostrando 20 de {parsedData.length} registros
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-primary">Merge inteligente</p>
                  <p className="text-sm text-muted-foreground">
                    Os {parsedData.length} destinos serão adicionados ao dicionário existente. Destinos já cadastrados terão o país atualizado.
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
              <Upload className="h-4 w-4" />
              Importar {parsedData.length} Destinos
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

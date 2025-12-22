import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tariff } from "@/hooks/useTariffs";
import { Package, Clock, Calendar, AlertTriangle } from "lucide-react";

interface TariffTableProps {
  tariffs: Tariff[];
  selectedTariffs: string[];
  onSelectionChange: (ids: string[]) => void;
  isLoading?: boolean;
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "-";
  return `USD ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export function TariffTable({ tariffs, selectedTariffs, onSelectionChange, isLoading }: TariffTableProps) {
  const toggleSelection = (id: string) => {
    if (selectedTariffs.includes(id)) {
      onSelectionChange(selectedTariffs.filter((s) => s !== id));
    } else {
      onSelectionChange([...selectedTariffs, id]);
    }
  };

  const toggleAll = () => {
    if (selectedTariffs.length === tariffs.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(tariffs.map((t) => t.id));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Carregando tarifas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tariffs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhuma tarifa encontrada</p>
            <p className="text-sm">Ajuste os filtros ou importe dados para começar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Resultados ({tariffs.length} tarifas)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTariffs.length === tariffs.length && tariffs.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="font-semibold">Armador</TableHead>
                <TableHead className="font-semibold">POL</TableHead>
                <TableHead className="font-semibold">POD</TableHead>
                <TableHead className="font-semibold text-right">20'DC</TableHead>
                <TableHead className="font-semibold text-right">40'HC</TableHead>
                <TableHead className="font-semibold text-right">40'Reefer</TableHead>
                <TableHead className="font-semibold text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4" />
                    FT
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-center">TT</TableHead>
                <TableHead className="font-semibold">ENS/AMS</TableHead>
                <TableHead className="font-semibold">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Validade
                  </div>
                </TableHead>
                <TableHead className="font-semibold">Subject to</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tariffs.map((tariff, index) => (
                <TableRow
                  key={tariff.id}
                  className="animate-fade-in hover:bg-muted/30 transition-colors"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedTariffs.includes(tariff.id)}
                      onCheckedChange={() => toggleSelection(tariff.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {tariff.carrier}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{tariff.pol}</TableCell>
                  <TableCell className="font-medium">{tariff.pod}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatPrice(tariff.price_20dc)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatPrice(tariff.price_40hc)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatPrice(tariff.price_40reefer)}
                  </TableCell>
                  <TableCell className="text-center">
                    {tariff.free_time || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {tariff.transit_time || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {tariff.ens_ams || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tariff.validity === "SPOT" ? "secondary" : "outline"} className="text-xs">
                      {tariff.validity || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {tariff.subject_to ? (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-warning shrink-0" />
                        <span className="truncate">{tariff.subject_to}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ship, MapPin, Navigation, RotateCcw, Search } from "lucide-react";
import { useCarriers, usePols, usePods } from "@/hooks/useTariffs";

interface TariffFiltersProps {
  carrier: string;
  pol: string;
  pod: string;
  onCarrierChange: (value: string) => void;
  onPolChange: (value: string) => void;
  onPodChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export function TariffFilters({
  carrier,
  pol,
  pod,
  onCarrierChange,
  onPolChange,
  onPodChange,
  onSearch,
  onReset,
}: TariffFiltersProps) {
  const { data: carriers = [], isLoading: loadingCarriers } = useCarriers();
  const { data: pols = [], isLoading: loadingPols } = usePols(carrier || undefined);
  const { data: pods = [], isLoading: loadingPods } = usePods(carrier || undefined, pol || undefined);

  return (
    <Card className="border-none shadow-lg bg-card">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Carrier */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Armador
            </label>
            <Select value={carrier} onValueChange={onCarrierChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={loadingCarriers ? "Carregando..." : "Selecione o armador"} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[300px]">
                {carriers.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* POL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Porto de Origem (POL)
            </label>
            <Select value={pol} onValueChange={onPolChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={loadingPols ? "Carregando..." : "Selecione a origem"} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[300px]">
                {pols.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* POD */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Porto de Destino (POD)
            </label>
            <Select value={pod} onValueChange={onPodChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={loadingPods ? "Carregando..." : "Selecione o destino"} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[300px]">
                {pods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <Button onClick={onSearch} className="flex-1 gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </Button>
            <Button variant="outline" onClick={onReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

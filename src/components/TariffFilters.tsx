import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Ship, MapPin, Navigation, RotateCcw, Search } from "lucide-react";
import { useCarriers, usePols, usePods } from "@/hooks/useTariffs";

interface TariffFiltersProps {
  carrier: string;
  pol: string;
  pod: string;
  userCountry?: string | null;
  onCarrierChange: (value: string) => void;
  onPolChange: (value: string) => void;
  onPodChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

const ALL_VALUE = "__all__";

export function TariffFilters({
  carrier,
  pol,
  pod,
  userCountry,
  onCarrierChange,
  onPolChange,
  onPodChange,
  onSearch,
  onReset,
}: TariffFiltersProps) {
  const { t } = useTranslation();
  const { data: carriers = [], isLoading: loadingCarriers } = useCarriers();
  const { data: pols = [], isLoading: loadingPols } = usePols(carrier || undefined);
  const { data: pods = [], isLoading: loadingPods } = usePods(carrier || undefined, pol || undefined, userCountry);

  const handleCarrierChange = (value: string) => {
    onCarrierChange(value === ALL_VALUE ? "" : value);
  };

  const handlePolChange = (value: string) => {
    onPolChange(value === ALL_VALUE ? "" : value);
  };

  const handlePodChange = (value: string) => {
    onPodChange(value === ALL_VALUE ? "" : value);
  };

  return (
    <Card className="border-none shadow-lg bg-card">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Carrier */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Ship className="h-4 w-4" />
              {t("tariffs.carrier")}
            </label>
            <Select value={carrier || ALL_VALUE} onValueChange={handleCarrierChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={loadingCarriers ? t("common.loading") : t("tariffs.selectCarrier")} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[300px]">
                <SelectItem value={ALL_VALUE}>{t("common.all")}</SelectItem>
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
              {t("tariffs.origin")}
            </label>
            <Select value={pol || ALL_VALUE} onValueChange={handlePolChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={loadingPols ? t("common.loading") : t("tariffs.selectOrigin")} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[300px]">
                <SelectItem value={ALL_VALUE}>{t("common.all")}</SelectItem>
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
              {t("tariffs.destination")}
            </label>
            <Select value={pod || ALL_VALUE} onValueChange={handlePodChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={loadingPods ? t("common.loading") : t("tariffs.selectDestination")} />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[300px]">
                <SelectItem value={ALL_VALUE}>{t("common.all")}</SelectItem>
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
              {t("common.search")}
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

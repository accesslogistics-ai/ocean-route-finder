import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { TariffFilters } from "@/components/TariffFilters";
import { TariffTable } from "@/components/TariffTable";
import { RouteComparison } from "@/components/RouteComparison";
import { ExportActions } from "@/components/ExportActions";
import { useTariffs, useRouteComparison, TariffFilters as TariffFiltersType } from "@/hooks/useTariffs";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLogSearch } from "@/hooks/useMonitoring";
import { Search, BarChart3 } from "lucide-react";

const Index = () => {
  const { t } = useTranslation();
  const { user, effectiveCountry } = useAuthContext();
  const { logSearch } = useLogSearch();
  const [activeTab, setActiveTab] = useState("search");
  const [carrier, setCarrier] = useState("");
  const [pol, setPol] = useState("");
  const [pod, setPod] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<TariffFiltersType>({});
  const [selectedTariffs, setSelectedTariffs] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: tariffs = [], isLoading } = useTariffs(appliedFilters, { 
    enabled: hasSearched, 
    limit: 50,
    userCountry: effectiveCountry,
  });
  const { data: comparisonTariffs = [], isLoading: loadingComparison } = useRouteComparison(
    appliedFilters.pol || "",
    appliedFilters.pod || ""
  );

  const handleSearch = () => {
    setAppliedFilters({
      carrier: carrier || undefined,
      pol: pol || undefined,
      pod: pod || undefined,
    });
    setSelectedTariffs([]);
    setHasSearched(true);

    // Log the search
    if (user) {
      logSearch(user.id, carrier || null, pol || null, pod || null);
    }
  };

  const handleReset = () => {
    setCarrier("");
    setPol("");
    setPod("");
    setAppliedFilters({});
    setSelectedTariffs([]);
    setHasSearched(false);
  };

  const handleCarrierChange = (value: string) => {
    setCarrier(value);
    setPol("");
    setPod("");
  };

  const handlePolChange = (value: string) => {
    setPol(value);
    setPod("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <TariffFilters
          carrier={carrier}
          pol={pol}
          pod={pod}
          userCountry={effectiveCountry}
          onCarrierChange={handleCarrierChange}
          onPolChange={handlePolChange}
          onPodChange={setPod}
          onSearch={handleSearch}
          onReset={handleReset}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TabsList className="bg-muted">
              <TabsTrigger value="search" className="gap-2">
                <Search className="h-4 w-4" />
                {t("tariffs.query")}
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                {t("tariffs.comparison")}
              </TabsTrigger>
            </TabsList>

            <ExportActions tariffs={tariffs} selectedTariffs={selectedTariffs} />
          </div>

          <TabsContent value="search" className="mt-6">
            <TariffTable
              tariffs={tariffs}
              selectedTariffs={selectedTariffs}
              onSelectionChange={setSelectedTariffs}
              isLoading={isLoading}
              hasSearched={hasSearched}
            />
          </TabsContent>

          <TabsContent value="compare" className="mt-6">
            {appliedFilters.pol && appliedFilters.pod ? (
              <RouteComparison tariffs={comparisonTariffs} isLoading={loadingComparison} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">{t("tariffs.selectRouteToCompare")}</p>
                <p className="text-sm">{t("tariffs.choosePOLPOD")}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;

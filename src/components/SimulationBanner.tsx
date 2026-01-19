import { useTranslation } from "react-i18next";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSimulation } from "@/contexts/SimulationContext";

export function SimulationBanner() {
  const { t } = useTranslation();
  const { isSimulating, simulatedCountry, stopSimulation } = useSimulation();

  if (!isSimulating) return null;

  return (
    <div className="bg-amber-500 text-amber-950 py-2 px-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5" />
          <div>
            <span className="font-semibold">{t("simulation.mode")}:</span>{" "}
            <span>{t("simulation.viewingAs")} <strong>{simulatedCountry}</strong></span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={stopSimulation}
          className="text-amber-950 hover:text-amber-900 hover:bg-amber-400 gap-2"
        >
          <X className="h-4 w-4" />
          {t("simulation.exit")}
        </Button>
      </div>
    </div>
  );
}

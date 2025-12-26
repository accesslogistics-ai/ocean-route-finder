import { useSimulation } from "@/contexts/SimulationContext";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

export function SimulationBanner() {
  const { isSimulating, simulatedUser, stopSimulation } = useSimulation();

  if (!isSimulating || !simulatedUser) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-2 px-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5" />
        <span className="font-medium">
          Simulando visão de: <strong>{simulatedUser.email}</strong>
          {simulatedUser.country && (
            <span className="ml-2">(País: {simulatedUser.country})</span>
          )}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={stopSimulation}
        className="bg-amber-600 border-amber-700 text-amber-950 hover:bg-amber-700"
      >
        <X className="h-4 w-4 mr-1" />
        Encerrar Simulação
      </Button>
    </div>
  );
}

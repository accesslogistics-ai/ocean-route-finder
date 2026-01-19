import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface SimulationContextType {
  isSimulating: boolean;
  simulatedCountry: string | null;
  startSimulation: (country: string) => void;
  stopSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedCountry, setSimulatedCountry] = useState<string | null>(null);

  const startSimulation = useCallback((country: string) => {
    setSimulatedCountry(country);
    setIsSimulating(true);
  }, []);

  const stopSimulation = useCallback(() => {
    setSimulatedCountry(null);
    setIsSimulating(false);
  }, []);

  return (
    <SimulationContext.Provider value={{
      isSimulating,
      simulatedCountry,
      startSimulation,
      stopSimulation,
    }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
}

import React, { createContext, useContext, useState, useCallback } from "react";

interface SimulatedUser {
  id: string;
  email: string;
  country: string | null;
}

interface SimulationContextType {
  simulatedUser: SimulatedUser | null;
  isSimulating: boolean;
  simulatedCountry: string | null;
  startSimulation: (user: SimulatedUser) => void;
  stopSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [simulatedUser, setSimulatedUser] = useState<SimulatedUser | null>(null);

  const startSimulation = useCallback((user: SimulatedUser) => {
    setSimulatedUser(user);
  }, []);

  const stopSimulation = useCallback(() => {
    setSimulatedUser(null);
  }, []);

  const value: SimulationContextType = {
    simulatedUser,
    isSimulating: simulatedUser !== null,
    simulatedCountry: simulatedUser?.country ?? null,
    startSimulation,
    stopSimulation,
  };

  return (
    <SimulationContext.Provider value={value}>
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

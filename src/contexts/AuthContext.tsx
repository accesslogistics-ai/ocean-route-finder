import { createContext, useContext, ReactNode, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";

type AppRole = "admin" | "user";

interface SimulationState {
  isSimulating: boolean;
  simulatedCountry: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  userCountry: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

interface AuthContextWithSimulation extends AuthContextType {
  effectiveCountry: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SimulationStateContext = createContext<SimulationState>({ 
  isSimulating: false, 
  simulatedCountry: null 
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Internal hook to get simulation state injected by SimulationProvider
export function useSimulationState() {
  return useContext(SimulationStateContext);
}

// This is the context provider that will be used by SimulationProvider to inject state
export { SimulationStateContext };

export function useAuthContext(): AuthContextWithSimulation {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  
  const { isSimulating, simulatedCountry } = useSimulationState();
  
  // effectiveCountry considers simulation mode
  const effectiveCountry = useMemo(() => {
    return context.isAdmin && isSimulating 
      ? simulatedCountry 
      : context.userCountry;
  }, [context.isAdmin, context.userCountry, isSimulating, simulatedCountry]);
  
  return {
    ...context,
    effectiveCountry,
  };
}

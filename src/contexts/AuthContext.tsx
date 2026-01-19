import { createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { useSimulation } from "@/contexts/SimulationContext";

type AppRole = "admin" | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  userCountry: string | null;
  effectiveCountry: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { isSimulating, simulatedCountry } = useSimulation();

  // effectiveCountry considers simulation mode
  const effectiveCountry = auth.isAdmin && isSimulating 
    ? simulatedCountry 
    : auth.userCountry;

  return (
    <AuthContext.Provider value={{
      ...auth,
      effectiveCountry,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AppRole = "admin" | "user";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  userCountry: string | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    userCountry: null,
    isLoading: true,
    isAdmin: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState((prev) => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));

        // Defer role fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setAuthState((prev) => ({
            ...prev,
            role: null,
            userCountry: null,
            isAdmin: false,
            isLoading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));

      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Fetch role
      const { data: roleData, error: roleError } = await supabase.rpc("get_user_role", {
        _user_id: userId,
      });

      if (roleError) throw roleError;

      const role = roleData as AppRole | null;

      // Fetch user's country from profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("country")
        .eq("user_id", userId)
        .single();

      const userCountry = profileError ? null : profileData?.country ?? null;

      setAuthState((prev) => ({
        ...prev,
        role,
        userCountry,
        isAdmin: role === "admin",
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching user role:", error);
      setAuthState((prev) => ({
        ...prev,
        role: null,
        userCountry: null,
        isAdmin: false,
        isLoading: false,
      }));
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: error.message === "Invalid login credentials" 
          ? "Email ou senha incorretos" 
          : error.message,
      });
      return { error };
    }

    toast({
      title: "Bem-vindo!",
      description: "Login realizado com sucesso.",
    });

    return { error: null };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error.message,
      });
    }
  }, [toast]);

  return {
    ...authState,
    signIn,
    signOut,
  };
}

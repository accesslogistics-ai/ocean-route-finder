import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Tariff {
  id: string;
  carrier: string;
  pol: string;
  pod: string;
  commodity: string | null;
  price_20dc: number | null;
  price_40hc: number | null;
  price_40reefer: number | null;
  free_time: string | null;
  free_time_origin: string | null;
  free_time_destination: string | null;
  transit_time: string | null;
  ens_ams: string | null;
  subject_to: string | null;
  validity: string | null;
  created_at: string;
  updated_at: string;
}

export interface TariffFilters {
  carrier?: string;
  pol?: string;
  pod?: string;
}

export function useTariffs(filters: TariffFilters = {}) {
  return useQuery({
    queryKey: ["tariffs", filters],
    queryFn: async () => {
      let query = supabase.from("tariffs").select("*");

      if (filters.carrier) {
        query = query.eq("carrier", filters.carrier);
      }
      if (filters.pol) {
        query = query.eq("pol", filters.pol);
      }
      if (filters.pod) {
        query = query.eq("pod", filters.pod);
      }

      const { data, error } = await query.order("carrier");

      if (error) throw error;
      return data as Tariff[];
    },
  });
}

export function useCarriers() {
  return useQuery({
    queryKey: ["carriers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tariffs")
        .select("carrier")
        .order("carrier");

      if (error) throw error;
      const unique = [...new Set(data.map((d) => d.carrier))];
      return unique;
    },
  });
}

export function usePols(carrier?: string) {
  return useQuery({
    queryKey: ["pols", carrier],
    queryFn: async () => {
      let query = supabase.from("tariffs").select("pol");

      if (carrier) {
        query = query.eq("carrier", carrier);
      }

      const { data, error } = await query.order("pol");

      if (error) throw error;
      const unique = [...new Set(data.map((d) => d.pol))];
      return unique;
    },
    enabled: true,
  });
}

export function usePods(carrier?: string, pol?: string) {
  return useQuery({
    queryKey: ["pods", carrier, pol],
    queryFn: async () => {
      let query = supabase.from("tariffs").select("pod");

      if (carrier) {
        query = query.eq("carrier", carrier);
      }
      if (pol) {
        query = query.eq("pol", pol);
      }

      const { data, error } = await query.order("pod");

      if (error) throw error;
      const unique = [...new Set(data.map((d) => d.pod))];
      return unique;
    },
    enabled: true,
  });
}

export function useRouteComparison(pol: string, pod: string) {
  return useQuery({
    queryKey: ["route-comparison", pol, pod],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tariffs")
        .select("*")
        .eq("pol", pol)
        .eq("pod", pod)
        .order("price_20dc", { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as Tariff[];
    },
    enabled: !!pol && !!pod,
  });
}

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

export interface UseTariffsOptions {
  enabled?: boolean;
  limit?: number;
}

export function useTariffs(filters: TariffFilters = {}, options: UseTariffsOptions = {}) {
  return useQuery({
    queryKey: ["tariffs", filters, options.limit ?? null],
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

      if (options.limit && options.limit > 0) {
        query = query.range(0, options.limit - 1);
      }

      const { data, error } = await query.order("carrier");

      if (error) throw error;
      return data as Tariff[];
    },
    enabled: options.enabled ?? true,
  });
}

export function useCarriers() {
  return useQuery({
    queryKey: ["carriers"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_unique_carriers");
      if (error) throw error;
      return (data as { carrier: string }[]).map((d) => d.carrier);
    },
  });
}

export function usePols(carrier?: string) {
  return useQuery({
    queryKey: ["pols", carrier],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_unique_pols", {
        p_carrier: carrier || null,
      });
      if (error) throw error;
      return (data as { pol: string }[]).map((d) => d.pol);
    },
  });
}

export function usePods(carrier?: string, pol?: string) {
  return useQuery({
    queryKey: ["pods", carrier, pol],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_unique_pods", {
        p_carrier: carrier || null,
        p_pol: pol || null,
      });
      if (error) throw error;
      return (data as { pod: string }[]).map((d) => d.pod);
    },
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

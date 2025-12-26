import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_unique_countries");
      if (error) throw error;
      return (data as { country: string }[]).map((d) => d.country);
    },
  });
}

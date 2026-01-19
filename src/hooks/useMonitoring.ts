import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserActivitySummary {
  user_id: string;
  email: string;
  full_name: string | null;
  country: string | null;
  access_count: number;
  search_count: number;
  last_access: string | null;
}

interface MonitoringStats {
  activeUsers: number;
  totalSearches: number;
  totalAccesses: number;
  averageSearchesPerUser: number;
}

export function useMonitoring(year: number, month: number) {
  const { data: userActivity = [], isLoading, error } = useQuery({
    queryKey: ["user-activity", year, month],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_activity_summary", {
        p_year: year,
        p_month: month,
      });

      if (error) throw error;

      return (data || []) as UserActivitySummary[];
    },
  });

  // Calculate stats from the data
  const stats: MonitoringStats = {
    activeUsers: userActivity.filter(u => u.access_count > 0 || u.search_count > 0).length,
    totalSearches: userActivity.reduce((sum, u) => sum + Number(u.search_count), 0),
    totalAccesses: userActivity.reduce((sum, u) => sum + Number(u.access_count), 0),
    averageSearchesPerUser: userActivity.length > 0 
      ? userActivity.reduce((sum, u) => sum + Number(u.search_count), 0) / userActivity.filter(u => u.access_count > 0 || u.search_count > 0).length || 0
      : 0,
  };

  return {
    userActivity,
    stats,
    isLoading,
    error,
  };
}

export function useLogSearch() {
  const logSearch = async (
    userId: string,
    carrier: string | null,
    pol: string | null,
    pod: string | null,
    resultsCount?: number
  ) => {
    try {
      await supabase.from("search_logs").insert({
        user_id: userId,
        carrier,
        pol,
        pod,
        results_count: resultsCount ?? null,
      });
    } catch (error) {
      console.error("Error logging search:", error);
    }
  };

  return { logSearch };
}

export function useLogAccess() {
  const logAccess = async (userId: string) => {
    try {
      await supabase.from("access_logs").insert({
        user_id: userId,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error("Error logging access:", error);
    }
  };

  return { logAccess };
}

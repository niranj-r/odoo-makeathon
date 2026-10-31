import { AnalyticsData } from "@/types/analytics";
import { DateRangePreset } from "@/types/common";
import { MOCK_ANALYTICS_DATA } from "@/mockData/analyticsMock";

/**
 * Analytics Service
 * Provides detailed MRR movements, churn cohorts, ARPU/LTV history, and tier breakdowns.
 */
class AnalyticsService {
  /**
   * Retrieves analytics data filtered by the selected date range preset
   */
  async getAnalyticsData(preset: DateRangePreset = "12m"): Promise<AnalyticsData> {
    // In future:
    // const { data, error } = await supabase.rpc('get_analytics_movements', { p_preset: preset });
    // if (error) throw error; return data;

    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredMovements = MOCK_ANALYTICS_DATA.mrrMovements;
        if (preset === "7d" || preset === "30d") {
          filteredMovements = MOCK_ANALYTICS_DATA.mrrMovements.slice(-4);
        } else if (preset === "90d") {
          filteredMovements = MOCK_ANALYTICS_DATA.mrrMovements.slice(-6);
        }

        resolve({
          ...MOCK_ANALYTICS_DATA,
          preset,
          mrrMovements: filteredMovements,
        });
      }, 150);
    });
  }
}

export const analyticsService = new AnalyticsService();


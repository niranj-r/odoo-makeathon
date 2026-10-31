import { AdminDashboardData } from "@/types/dashboard";
import { MOCK_ADMIN_DASHBOARD } from "@/mockData/dashboardMock";

/**
 * Dashboard Service
 * Follows the enterprise pattern: Component -> Hook -> Service -> (Mock Data -> Future Supabase)
 * Components never know whether this data comes from Mock or Supabase.
 */
class DashboardService {
  /**
   * Retrieves high-level executive KPIs, trends, recent activities, and plan snapshots
   */
  async getAdminDashboardData(): Promise<AdminDashboardData> {
    // In future:
    // const { data, error } = await supabase.rpc('get_admin_dashboard_metrics');
    // if (error) throw error; return data;

    // Simulate realistic asynchronous network call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_ADMIN_DASHBOARD);
      }, 150);
    });
  }
}

export const dashboardService = new DashboardService();


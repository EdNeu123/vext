import { api } from "./api";

/**
 * Report service
 */
export const reportService = {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<any> {
    const response = await api.get("/reports/dashboard");
    return response.data;
  },

  /**
   * Get sales report
   */
  async getSalesReport(startDate: Date, endDate: Date): Promise<any> {
    const response = await api.get("/reports/sales", {
      params: { startDate, endDate },
    });
    return response.data;
  },

  /**
   * Get pipeline report
   */
  async getPipelineReport(): Promise<any> {
    const response = await api.get("/reports/pipeline");
    return response.data;
  },
};

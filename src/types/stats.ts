export interface Stats {
  totalRequests: number;
  successCount: number;
  fastestTime: number;
  slowestTime: number;
  totalTime: number;
}

export type GlobalStats = Stats;
export type TaskStats = Stats;

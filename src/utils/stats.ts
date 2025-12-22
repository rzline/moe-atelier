export const calculateSuccessRate = (totalRequests: number, successCount: number) =>
  totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 0;

export const formatDuration = (ms: number) => {
  if (ms === 0) return '0.0s';
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}m ${secs}s`;
};

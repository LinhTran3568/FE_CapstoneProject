import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@ticketshield/api-client';

export const useAdminDashboardData = () => {
  const metricsQuery = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => adminApi.getMetrics(),
  });

  const botSessionsQuery = useQuery({
    queryKey: ['admin-bot-sessions'],
    queryFn: () => adminApi.getBotSessions(),
  });

  const suspiciousListingsQuery = useQuery({
    queryKey: ['admin-suspicious-listings'],
    queryFn: () => adminApi.getSuspiciousListings(),
  });

  const auditLogsQuery = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminApi.getAuditLogs(),
  });

  return {
    metrics: metricsQuery.data,
    botSessions: botSessionsQuery.data || [],
    suspiciousListings: suspiciousListingsQuery.data || [],
    auditLogs: auditLogsQuery.data || [],
    isLoading:
      metricsQuery.isLoading ||
      botSessionsQuery.isLoading ||
      suspiciousListingsQuery.isLoading ||
      auditLogsQuery.isLoading,
  };
};

import { useQuery } from '@tanstack/react-query';
import { botDetectionApi } from '@ticketshield/api-client';
import { useUIStore } from '../stores/uiStore';

export const useBotAssessment = () => {
  const simulateBotState = useUIStore((state) => state.simulateBotState);

  return useQuery({
    queryKey: ['bot-assessment', simulateBotState],
    queryFn: () => botDetectionApi.assessSession({ simulateState: simulateBotState }),
    refetchOnWindowFocus: false,
  });
};

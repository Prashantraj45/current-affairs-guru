import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api/endpoints';
export function useMCQ() {
  return useQuery({ queryKey: ['feed', 'today'], queryFn: api.today, staleTime: 1000 * 60 * 60 * 6, select: (data: any) => data.mcqs ?? [] });
}

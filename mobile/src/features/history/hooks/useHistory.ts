import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api/endpoints';
export function useHistory() {
  return useQuery({ queryKey: ['history'], queryFn: () => api.history(), staleTime: 1000 * 60 * 60 * 6 });
}

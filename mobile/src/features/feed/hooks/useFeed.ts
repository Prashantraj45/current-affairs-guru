import { useQuery } from '@tanstack/react-query';
import { feedRepository } from '../repository/feedRepository';
export function useFeed() {
  return useQuery({ queryKey: ['feed', 'today'], queryFn: feedRepository.getToday, staleTime: 1000 * 60 * 60 * 6 });
}

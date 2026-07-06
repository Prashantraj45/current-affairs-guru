import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api/endpoints';
import { useDebounce } from '../../../hooks/useDebounce';
export function useSearch(query: string) {
  const debounced = useDebounce(query, 300);
  const { data, isLoading } = useQuery({ queryKey: ['history'], queryFn: () => api.history(), staleTime: 1000 * 60 * 60 * 6 });
  const results = useMemo(() => {
    if (!debounced.trim() || !data?.entries) return [];
    const q = debounced.toLowerCase();
    return data.entries.flatMap((e: any) => e.topics.filter((t: any) => t.title?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q) || t.tags?.some((tag: string) => tag.toLowerCase().includes(q))).map((t: any) => ({ ...t, date: e.date })));
  }, [debounced, data]);
  return { results, isLoading, query: debounced };
}

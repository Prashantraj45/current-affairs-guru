import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api/endpoints';
export function useBookmarks() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['bookmarks'], queryFn: api.user.bookmarks });
  const add = useMutation({
    mutationFn: ({ topicId, date }: { topicId: string; date: string }) => api.user.addBookmark(topicId, date),
    onMutate: async ({ topicId, date }) => { await qc.cancelQueries({ queryKey: ['bookmarks'] }); const prev = qc.getQueryData(['bookmarks']); qc.setQueryData(['bookmarks'], (old: any) => ({ bookmarks: [...(old?.bookmarks ?? []), { topicId, date, savedAt: new Date().toISOString() }] })); return { prev }; },
    onError: (_, __, ctx: any) => qc.setQueryData(['bookmarks'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
  });
  const remove = useMutation({
    mutationFn: (topicId: string) => api.user.removeBookmark(topicId),
    onMutate: async (topicId) => { await qc.cancelQueries({ queryKey: ['bookmarks'] }); const prev = qc.getQueryData(['bookmarks']); qc.setQueryData(['bookmarks'], (old: any) => ({ bookmarks: (old?.bookmarks ?? []).filter((b: any) => b.topicId !== topicId) })); return { prev }; },
    onError: (_, __, ctx: any) => qc.setQueryData(['bookmarks'], ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
  });
  return { bookmarks: query.data?.bookmarks ?? [], isLoading: query.isLoading, add, remove };
}

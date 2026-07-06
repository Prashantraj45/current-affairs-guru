import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../../../services/api/endpoints';
export function useTopicDetail(topicId: string, date?: string) {
  const q = useQuery({ queryKey: ['topic', topicId, date], queryFn: () => api.topic(topicId, date), staleTime: 1000 * 60 * 60 * 24 });
  useEffect(() => { if (q.data && topicId && date) api.user.recordRead(topicId, date).catch(() => {}); }, [q.data, topicId, date]);
  return q;
}

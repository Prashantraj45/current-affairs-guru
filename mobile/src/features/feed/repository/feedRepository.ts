import { api } from '../../../services/api/endpoints';
export const feedRepository = { getToday: () => api.today(), getByDate: (date: string) => api.entry(date) };

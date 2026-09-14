import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, type Job, type JobStatus, type StatusCounts } from '@/lib/api';

const EMPTY_COUNTS: StatusCounts = {
  pending: 0,
  running: 0,
  completed: 0,
  failed: 0,
};

export function useJobs(filter: JobStatus | 'all') {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [counts, setCounts] = useState<StatusCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [jobs, counts] = await Promise.all([
        api.list(filter === 'all' ? undefined : filter),
        api.counts(),
      ]);
      setJobs(jobs);
      setCounts(counts);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return { jobs, counts, loading, error, reload: load };
}

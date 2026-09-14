import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError, NEXT_STATUSES, type Job, type JobStatus } from '@/lib/api';

// Nothing can transition back to pending, so it needs no button label.
const ACTION_LABELS: Record<Exclude<JobStatus, 'pending'>, string> = {
  running: 'Start',
  completed: 'Complete',
  failed: 'Fail',
};

export function JobList({
  jobs,
  loading,
  onChanged,
}: {
  jobs: Job[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function run(id: string, action: () => Promise<unknown>, success: string) {
    setBusyId(id);
    try {
      await action();
      toast.success(success);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Someone else moved this job first - show what actually happened.
        toast.warning(err.message);
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Request failed');
      }
    } finally {
      setBusyId(null);
      onChanged();
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[68px] w-full" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No jobs here yet.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {jobs.map((job) => {
        const busy = busyId === job.id;
        const next = NEXT_STATUSES[job.status];

        return (
          <li
            key={job.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{job.title}</span>
                <Badge variant={job.status}>{job.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {job.type} · {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}

              {next.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === 'failed' ? 'outline' : 'secondary'}
                  disabled={busy}
                  onClick={() =>
                    run(
                      job.id,
                      () => api.updateStatus(job.id, status),
                      `Job marked ${status}`,
                    )
                  }
                >
                  {ACTION_LABELS[status]}
                </Button>
              ))}

              {next.length === 0 && (
                <span className="text-xs text-muted-foreground">final state</span>
              )}

              <Button
                size="icon"
                variant="ghost"
                disabled={busy}
                aria-label={`Delete ${job.title}`}
                onClick={() => {
                  if (!confirm(`Delete "${job.title}"?`)) return;
                  run(job.id, () => api.remove(job.id), 'Job deleted');
                }}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

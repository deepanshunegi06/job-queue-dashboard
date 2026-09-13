export const JOB_STATUSES = ['pending', 'running', 'completed', 'failed'] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/**
 * pending -> running -> completed
 *                    -> failed
 *
 * Keyed by target status so a transition check is a single lookup, and so the
 * status update can be written as one conditional UPDATE (see JobsService).
 */
export const ALLOWED_SOURCES: Record<JobStatus, JobStatus[]> = {
  pending: [],
  running: ['pending'],
  completed: ['running'],
  failed: ['running'],
};

export function isTerminal(status: JobStatus) {
  return status === 'completed' || status === 'failed';
}

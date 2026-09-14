export const STATUSES = ['pending', 'running', 'completed', 'failed'] as const;

export type JobStatus = (typeof STATUSES)[number];

export type Job = {
  id: string;
  title: string;
  type: string;
  status: JobStatus;
  createdAt: string;
};

export type StatusCounts = Record<JobStatus, number>;

// Same transition table as the API. The UI uses it to decide which buttons to
// show; the API is still the one that enforces it.
export const NEXT_STATUSES: Record<JobStatus, Exclude<JobStatus, 'pending'>[]> = {
  pending: ['running'],
  running: ['completed', 'failed'],
  completed: [],
  failed: [],
};

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError('Could not reach the API. Is the server running?', 0);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    // Nest sends a string for most errors and an array for validation failures.
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? response.statusText);
    throw new ApiError(message, response.status);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  list: (status?: JobStatus) =>
    request<Job[]>(status ? `/jobs?status=${status}` : '/jobs'),

  counts: () => request<StatusCounts>('/jobs/counts'),

  create: (job: { title: string; type: string }) =>
    request<Job>('/jobs', { method: 'POST', body: JSON.stringify(job) }),

  updateStatus: (id: string, status: JobStatus) =>
    request<Job>(`/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  remove: (id: string) => request<void>(`/jobs/${id}`, { method: 'DELETE' }),
};

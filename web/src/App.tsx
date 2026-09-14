import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { CreateJobForm } from '@/components/create-job-form';
import { JobList } from '@/components/job-list';
import { StatusSummary } from '@/components/status-summary';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useJobs } from '@/hooks/use-jobs';
import type { JobStatus } from '@/lib/api';

export default function App() {
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');
  const { jobs, counts, loading, error, reload } = useJobs(filter);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Queue work, move it through the pipeline, keep an eye on what failed.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={reload} aria-label="Refresh">
          <RefreshCw className={loading ? 'animate-spin' : undefined} />
        </Button>
      </header>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            {error}
          </span>
          <Button size="sm" variant="outline" onClick={reload}>
            Retry
          </Button>
        </div>
      )}

      <StatusSummary counts={counts} active={filter} onSelect={setFilter} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>New job</CardTitle>
          <CardDescription>Everything starts out as pending.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateJobForm onCreated={reload} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="capitalize">
            {filter === 'all' ? 'All jobs' : `${filter} jobs`}
          </CardTitle>
          <CardDescription>
            Transitions are validated on the server, so a stale tab gets a
            conflict instead of overwriting someone else.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JobList jobs={jobs} loading={loading} onChanged={reload} />
        </CardContent>
      </Card>
    </div>
  );
}

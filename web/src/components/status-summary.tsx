import { cn } from '@/lib/utils';
import { STATUSES, type JobStatus, type StatusCounts } from '@/lib/api';

const DOT_COLORS: Record<JobStatus, string> = {
  pending: 'bg-amber-500',
  running: 'bg-sky-400',
  completed: 'bg-emerald-400',
  failed: 'bg-rose-400',
};

type Props = {
  counts: StatusCounts;
  active: JobStatus | 'all';
  onSelect: (status: JobStatus | 'all') => void;
};

export function StatusSummary({ counts, active, onSelect }: Props) {
  const total = STATUSES.reduce((sum, status) => sum + counts[status], 0);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <SummaryCard
        label="All jobs"
        value={total}
        selected={active === 'all'}
        onClick={() => onSelect('all')}
      />
      {STATUSES.map((status) => (
        <SummaryCard
          key={status}
          label={status}
          value={counts[status]}
          dot={DOT_COLORS[status]}
          selected={active === status}
          onClick={() => onSelect(status)}
        />
      ))}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  dot,
  selected,
  onClick,
}: {
  label: string;
  value: number;
  dot?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/50',
        selected && 'border-foreground/30 bg-accent/60',
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium capitalize text-muted-foreground">
        {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </button>
  );
}

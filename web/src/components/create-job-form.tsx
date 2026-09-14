import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';

const JOB_TYPES = ['email', 'report', 'export', 'image', 'sync'];

export function CreateJobForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState(JOB_TYPES[0]);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = title.trim();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await api.create({ title: trimmed, type });
      setTitle('');
      onCreated();
      toast.success('Job queued');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not create job');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[1fr_180px_auto]">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Send weekly digest"
          maxLength={120}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {JOB_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button type="submit" disabled={!trimmed || submitting} className="w-full sm:w-auto">
          {submitting ? <Loader2 className="animate-spin" /> : <Plus />}
          Add job
        </Button>
      </div>
    </form>
  );
}

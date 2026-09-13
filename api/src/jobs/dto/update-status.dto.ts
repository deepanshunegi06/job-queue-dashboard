import { IsIn } from 'class-validator';
import { JOB_STATUSES, JobStatus } from '../job-status';

export class UpdateStatusDto {
  @IsIn(JOB_STATUSES)
  status!: JobStatus;
}

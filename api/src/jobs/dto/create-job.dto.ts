import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { JOB_STATUSES, JobStatus } from '../job-status';

export class CreateJobDto {
  @IsString()
  @Length(1, 120)
  title!: string;

  @IsString()
  @Length(1, 60)
  type!: string;

  // A job normally starts as pending, but seeding one that is already running
  // is handy and harmless, so allow it explicitly instead of silently ignoring.
  @IsOptional()
  @IsIn(['pending', 'running'])
  status?: Extract<JobStatus, 'pending' | 'running'>;
}

export class JobFilterDto {
  @IsOptional()
  @IsIn(JOB_STATUSES)
  status?: JobStatus;
}

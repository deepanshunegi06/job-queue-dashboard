import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { JobStatus } from './job-status';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  type!: string;

  @Index()
  @Column({ default: 'pending' })
  status!: JobStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ default: 1 })
  version!: number;
}

@Entity('job_events')
export class JobEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  job!: Job;

  @Column()
  jobId!: string;

  @Column()
  from!: JobStatus;

  @Column()
  to!: JobStatus;

  @CreateDateColumn()
  at!: Date;
}

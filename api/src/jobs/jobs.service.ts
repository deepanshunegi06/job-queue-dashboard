import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto';
import { ALLOWED_SOURCES, JOB_STATUSES, JobStatus } from './job-status';
import { Job, JobEvent } from './job.entity';

export type StatusCounts = Record<JobStatus, number>;

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    @InjectRepository(JobEvent) private readonly events: Repository<JobEvent>,
  ) {}

  findAll(status?: JobStatus) {
    return this.jobs.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async counts(): Promise<StatusCounts> {
    const rows = await this.jobs
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('job.status')
      .getRawMany<{ status: JobStatus; count: string }>();

    const counts = Object.fromEntries(
      JOB_STATUSES.map((s) => [s, 0]),
    ) as StatusCounts;
    for (const row of rows) counts[row.status] = Number(row.count);
    return counts;
  }

  create(dto: CreateJobDto) {
    return this.jobs.save(
      this.jobs.create({
        title: dto.title.trim(),
        type: dto.type.trim(),
        status: dto.status ?? 'pending',
      }),
    );
  }

  /**
   * The transition rule lives here, not in the UI, because the API is the only
   * thing every client has to go through.
   *
   * Two tabs flipping the same pending job to running land as two UPDATEs. The
   * WHERE clause carries the expected status, so the database decides the
   * winner: the second one matches zero rows and gets a 409 instead of
   * silently overwriting the first.
   */
  async updateStatus(id: string, next: JobStatus) {
    const sources = ALLOWED_SOURCES[next];
    if (sources.length === 0) {
      throw new BadRequestException(`A job cannot be moved back to ${next}`);
    }

    const result = await this.jobs
      .createQueryBuilder()
      .update(Job)
      .set({ status: next, version: () => 'version + 1' })
      .where('id = :id AND status IN (:...sources)', { id, sources })
      .execute();

    if (!result.affected) {
      const current = await this.jobs.findOneBy({ id });
      if (!current) throw new NotFoundException(`Job ${id} not found`);
      throw new ConflictException({
        message:
          current.status === next
            ? `Job is already ${next}`
            : `Job is ${current.status} and cannot move to ${next}`,
        currentStatus: current.status,
      });
    }

    // Written after the fact rather than inside a transaction: the audit trail
    // is nice to have, and wrapping both statements would serialise every
    // status change behind one sqlite write lock.
    await this.events.insert({ jobId: id, from: sources[0], to: next });

    return this.jobs.findOneByOrFail({ id });
  }

  async remove(id: string) {
    const result = await this.jobs.delete(id);
    if (!result.affected) throw new NotFoundException(`Job ${id} not found`);
  }

  history(id: string) {
    return this.events.find({ where: { jobId: id }, order: { at: 'DESC' } });
  }
}

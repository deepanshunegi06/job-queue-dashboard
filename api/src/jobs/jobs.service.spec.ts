import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job, JobEvent } from './job.entity';
import { JobsModule } from './jobs.module';
import { JobsService } from './jobs.service';

describe('JobsService transitions', () => {
  let service: JobsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [Job, JobEvent],
          synchronize: true,
        }),
        JobsModule,
      ],
    }).compile();

    service = moduleRef.get(JobsService);
  });

  it('walks a job through the happy path', async () => {
    const job = await service.create({ title: 'resize avatars', type: 'image' });
    expect(job.status).toBe('pending');

    await service.updateStatus(job.id, 'running');
    const done = await service.updateStatus(job.id, 'completed');
    expect(done.status).toBe('completed');
  });

  it('refuses to restart a finished job', async () => {
    const job = await service.create({ title: 'send digest', type: 'email' });
    await service.updateStatus(job.id, 'running');
    await service.updateStatus(job.id, 'failed');

    await expect(service.updateStatus(job.id, 'running')).rejects.toThrow(
      ConflictException,
    );
  });

  it('lets only one of two racing claims win', async () => {
    const job = await service.create({ title: 'nightly sync', type: 'sync' });

    const results = await Promise.allSettled([
      service.updateStatus(job.id, 'running'),
      service.updateStatus(job.id, 'running'),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
  });
});

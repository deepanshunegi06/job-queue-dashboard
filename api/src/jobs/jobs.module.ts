import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Job, JobEvent } from './job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, JobEvent])],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}

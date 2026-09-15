import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { JobsModule } from './jobs/jobs.module';
import { Job, JobEvent } from './jobs/job.entity';

const entities = [Job, JobEvent];

// Postgres when the host gives us a DATABASE_URL, otherwise a local sqlite file.
const database = process.env.DATABASE_URL
  ? ({
      type: 'postgres' as const,
      url: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'require',
    })
  : ({
      type: 'better-sqlite3' as const,
      database: process.env.SQLITE_PATH ?? 'jobs.sqlite',
    });

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...database,
      entities,
      synchronize: true,
    }),
    JobsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // Landing on the bare API URL should say what this is instead of 404ing.
  @Get()
  index() {
    return {
      service: 'job-queue-api',
      repo: 'https://github.com/deepanshunegi06/job-queue-dashboard',
      dashboard: 'https://job-queue-dashboard-delta.vercel.app',
      endpoints: [
        'GET    /jobs?status=',
        'GET    /jobs/counts',
        'POST   /jobs',
        'PATCH  /jobs/:id/status',
        'DELETE /jobs/:id',
        'GET    /jobs/:id/history',
      ],
    };
  }
}

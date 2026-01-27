import { http, HttpResponse, delay } from 'msw';
import type { Job, JobStatus, JobType } from '@/types';

// In-memory job storage
let jobs: Job[] = [
  {
    id: 'job-001',
    type: 'backup',
    status: 'completed',
    collection_name: 'products',
    snapshot_name: 'products-2024-01-15-120000.snapshot',
    progress: 100,
    created_at: '2024-01-15T11:58:00Z',
    started_at: '2024-01-15T11:58:01Z',
    completed_at: '2024-01-15T12:00:00Z',
  },
  {
    id: 'job-002',
    type: 'backup',
    status: 'running',
    collection_name: 'embeddings',
    progress: 67,
    created_at: '2024-01-15T14:00:00Z',
    started_at: '2024-01-15T14:00:01Z',
  },
  {
    id: 'job-003',
    type: 'restore',
    status: 'failed',
    collection_name: 'documents',
    snapshot_name: 'documents-2024-01-14-120000.snapshot',
    progress: 45,
    error: 'Connection timeout while restoring from S3',
    created_at: '2024-01-15T10:00:00Z',
    started_at: '2024-01-15T10:00:01Z',
    completed_at: '2024-01-15T10:05:00Z',
  },
  {
    id: 'job-004',
    type: 'shard_backup',
    status: 'pending',
    collection_name: 'users',
    shard_id: 0,
    progress: 0,
    created_at: '2024-01-15T14:30:00Z',
  },
];

// Simulate progress updates
setInterval(() => {
  jobs = jobs.map((job) => {
    if (job.status === 'running' && job.progress < 100) {
      const newProgress = Math.min(job.progress + Math.floor(Math.random() * 10) + 1, 100);
      if (newProgress === 100) {
        return {
          ...job,
          progress: 100,
          status: 'completed' as JobStatus,
          completed_at: new Date().toISOString(),
        };
      }
      return { ...job, progress: newProgress };
    }
    if (job.status === 'pending') {
      return {
        ...job,
        status: 'running' as JobStatus,
        started_at: new Date().toISOString(),
      };
    }
    return job;
  });
}, 2000);

export const jobsHandlers = [
  // List jobs
  http.get('/api/v1/jobs', async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    let filteredJobs = [...jobs];

    if (status) {
      filteredJobs = filteredJobs.filter((j) => j.status === status);
    }
    if (type) {
      filteredJobs = filteredJobs.filter((j) => j.type === type);
    }

    // Sort by created_at descending
    filteredJobs.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const start = (page - 1) * limit;
    const paginatedJobs = filteredJobs.slice(start, start + limit);

    return HttpResponse.json({
      items: paginatedJobs,
      total: filteredJobs.length,
      page,
      limit,
    });
  }),

  // Get job details
  http.get('/api/v1/jobs/:id', async ({ params }) => {
    await delay(50);
    const { id } = params;
    const job = jobs.find((j) => j.id === id);

    if (!job) {
      return HttpResponse.json(
        { status: { error: 'Job not found' }, time: 0.001 },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      result: job,
      status: 'ok',
      time: 0.001,
    });
  }),

  // Create job
  http.post('/api/v1/jobs', async ({ request }) => {
    await delay(200);
    const body = await request.json() as {
      type: JobType;
      collection_name: string;
      shard_id?: number;
      snapshot_name?: string;
      storage_id?: string;
      metadata?: Record<string, unknown>;
    };

    const newJob: Job = {
      id: `job-${Date.now()}`,
      type: body.type,
      status: 'pending',
      collection_name: body.collection_name,
      shard_id: body.shard_id,
      snapshot_name: body.snapshot_name,
      storage_id: body.storage_id,
      progress: 0,
      created_at: new Date().toISOString(),
      metadata: body.metadata,
    };

    jobs.unshift(newJob);

    return HttpResponse.json({
      result: newJob,
      status: 'ok',
      time: 0.1,
    });
  }),

  // Cancel job
  http.post('/api/v1/jobs/:id/cancel', async ({ params }) => {
    await delay(100);
    const { id } = params;
    const job = jobs.find((j) => j.id === id);

    if (!job) {
      return HttpResponse.json(
        { status: { error: 'Job not found' }, time: 0.001 },
        { status: 404 }
      );
    }

    if (job.status !== 'pending' && job.status !== 'running') {
      return HttpResponse.json(
        { status: { error: 'Job cannot be cancelled' }, time: 0.001 },
        { status: 400 }
      );
    }

    job.status = 'cancelled';
    job.completed_at = new Date().toISOString();

    return HttpResponse.json({
      result: true,
      status: 'ok',
      time: 0.1,
    });
  }),

  // Retry job
  http.post('/api/v1/jobs/:id/retry', async ({ params }) => {
    await delay(200);
    const { id } = params;
    const job = jobs.find((j) => j.id === id);

    if (!job) {
      return HttpResponse.json(
        { status: { error: 'Job not found' }, time: 0.001 },
        { status: 404 }
      );
    }

    if (job.status !== 'failed' && job.status !== 'cancelled') {
      return HttpResponse.json(
        { status: { error: 'Job cannot be retried' }, time: 0.001 },
        { status: 400 }
      );
    }

    const newJob: Job = {
      ...job,
      id: `job-${Date.now()}`,
      status: 'pending',
      progress: 0,
      error: undefined,
      created_at: new Date().toISOString(),
      started_at: undefined,
      completed_at: undefined,
    };

    jobs.unshift(newJob);

    return HttpResponse.json({
      result: newJob,
      status: 'ok',
      time: 0.1,
    });
  }),
];

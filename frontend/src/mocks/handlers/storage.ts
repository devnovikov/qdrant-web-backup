import { http, HttpResponse, delay } from 'msw';

interface MockStorageConfig {
  id: string;
  name: string;
  type: 'local' | 's3';
  path?: string;
  s3_endpoint?: string;
  s3_bucket?: string;
  s3_region?: string;
  s3_access_key?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// In-memory storage config
let storageConfigs: MockStorageConfig[] = [
  {
    id: 'local-default',
    name: 'Local Storage',
    type: 'local',
    path: '/var/qdrant/snapshots',
    is_default: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 's3-backup',
    name: 'S3 Backup Storage',
    type: 's3',
    s3_endpoint: 'https://s3.amazonaws.com',
    s3_bucket: 'qdrant-backups',
    s3_region: 'us-east-1',
    s3_access_key: '***********',
    is_default: false,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
];

export const storageHandlers = [
  // Get storage configs
  http.get('/api/v1/storage/config', async () => {
    await delay(100);
    return HttpResponse.json({
      result: storageConfigs,
      status: 'ok',
      time: 0.001,
    });
  }),

  // Create storage config
  http.post('/api/v1/storage/config', async ({ request }) => {
    await delay(200);
    const body = await request.json() as Record<string, unknown>;

    const newConfig: MockStorageConfig = {
      id: `storage-${Date.now()}`,
      name: body.name as string,
      type: body.type as 'local' | 's3',
      path: body.path as string | undefined,
      s3_endpoint: body.s3_endpoint as string | undefined,
      s3_bucket: body.s3_bucket as string | undefined,
      s3_region: body.s3_region as string | undefined,
      s3_access_key: body.s3_access_key ? '***********' : undefined,
      is_default: (body.is_default as boolean) || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (newConfig.is_default) {
      storageConfigs = storageConfigs.map((c) => ({ ...c, is_default: false }));
    }

    storageConfigs.push(newConfig);

    return HttpResponse.json({
      result: newConfig,
      status: 'ok',
      time: 0.1,
    });
  }),

  // Update storage config
  http.put('/api/v1/storage/config/:id', async ({ params, request }) => {
    await delay(200);
    const { id } = params;
    const body = await request.json() as Record<string, unknown>;

    const index = storageConfigs.findIndex((c) => c.id === id);
    if (index === -1) {
      return HttpResponse.json(
        { status: { error: 'Storage config not found' }, time: 0.001 },
        { status: 404 }
      );
    }

    if (body.is_default) {
      storageConfigs = storageConfigs.map((c) => ({ ...c, is_default: false }));
    }

    storageConfigs[index] = {
      ...storageConfigs[index],
      ...(body as Partial<MockStorageConfig>),
      s3_access_key: body.s3_access_key ? '***********' : storageConfigs[index].s3_access_key,
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json({
      result: storageConfigs[index],
      status: 'ok',
      time: 0.1,
    });
  }),

  // Delete storage config
  http.delete('/api/v1/storage/config/:id', async ({ params }) => {
    await delay(200);
    const { id } = params;

    const index = storageConfigs.findIndex((c) => c.id === id);
    if (index === -1) {
      return HttpResponse.json(
        { status: { error: 'Storage config not found' }, time: 0.001 },
        { status: 404 }
      );
    }

    if (storageConfigs[index].is_default) {
      return HttpResponse.json(
        { status: { error: 'Cannot delete default storage config' }, time: 0.001 },
        { status: 400 }
      );
    }

    storageConfigs.splice(index, 1);

    return HttpResponse.json({
      result: true,
      status: 'ok',
      time: 0.1,
    });
  }),

  // Test storage connectivity
  http.post('/api/v1/storage/test', async ({ request }) => {
    await delay(500);
    const body = await request.json() as Record<string, unknown>;

    // Simulate connectivity test
    if (body.type === 'local') {
      return HttpResponse.json({
        result: {
          success: true,
          message: 'Local storage path is accessible',
        },
        status: 'ok',
        time: 0.1,
      });
    }

    // S3 test - randomly succeed or fail for demo
    const success = Math.random() > 0.3;
    return HttpResponse.json({
      result: {
        success,
        message: success
          ? 'Successfully connected to S3 bucket'
          : 'Failed to connect: Access denied',
      },
      status: 'ok',
      time: 0.5,
    });
  }),
];

import { http, HttpResponse, delay } from 'msw';

// In-memory snapshot storage for mocking
const snapshotsStore: Record<string, Array<{
  name: string;
  creation_time: string;
  size: number;
  checksum: string;
}>> = {
  products: [
    {
      name: 'products-2024-01-15-120000.snapshot',
      creation_time: '2024-01-15T12:00:00Z',
      size: 1024 * 1024 * 512, // 512MB
      checksum: 'sha256:abc123...',
    },
    {
      name: 'products-2024-01-14-120000.snapshot',
      creation_time: '2024-01-14T12:00:00Z',
      size: 1024 * 1024 * 480, // 480MB
      checksum: 'sha256:def456...',
    },
  ],
  users: [
    {
      name: 'users-2024-01-15-080000.snapshot',
      creation_time: '2024-01-15T08:00:00Z',
      size: 1024 * 1024 * 128, // 128MB
      checksum: 'sha256:ghi789...',
    },
  ],
  documents: [],
  embeddings: [
    {
      name: 'embeddings-2024-01-15-000000.snapshot',
      creation_time: '2024-01-15T00:00:00Z',
      size: 1024 * 1024 * 1024 * 2, // 2GB
      checksum: 'sha256:jkl012...',
    },
  ],
  images: [],
};

// Shard snapshots store
const shardSnapshotsStore: Record<string, Record<number, Array<{
  name: string;
  creation_time: string;
  size: number;
  checksum: string;
  shard_id: number;
}>>> = {
  products: {
    0: [
      {
        name: 'products-shard-0-2024-01-15-120000.snapshot',
        creation_time: '2024-01-15T12:00:00Z',
        size: 1024 * 1024 * 170,
        checksum: 'sha256:shard0abc...',
        shard_id: 0,
      },
    ],
    1: [],
    2: [],
  },
};

export const snapshotsHandlers = [
  // List collection snapshots
  http.get('/api/v1/collections/:name/snapshots', async ({ params }) => {
    await delay(100);
    const { name } = params;
    const snapshots = snapshotsStore[name as string] || [];
    return HttpResponse.json({
      result: snapshots,
      status: 'ok',
      time: 0.001,
    });
  }),

  // Create collection snapshot
  http.post('/api/v1/collections/:name/snapshots', async ({ params, request }) => {
    await delay(500);
    const { name } = params;
    const url = new URL(request.url);
    const wait = url.searchParams.get('wait') !== 'false';

    const newSnapshot = {
      name: `${name}-${new Date().toISOString().replace(/[:.]/g, '-')}.snapshot`,
      creation_time: new Date().toISOString(),
      size: Math.floor(Math.random() * 1024 * 1024 * 500) + 1024 * 1024 * 100,
      checksum: `sha256:${Math.random().toString(36).substring(7)}...`,
    };

    if (!snapshotsStore[name as string]) {
      snapshotsStore[name as string] = [];
    }
    snapshotsStore[name as string].unshift(newSnapshot);

    if (!wait) {
      return new HttpResponse(null, { status: 202 });
    }

    return HttpResponse.json({
      result: newSnapshot,
      status: 'ok',
      time: 0.5,
    });
  }),

  // Delete collection snapshot
  http.delete('/api/v1/collections/:name/snapshots/:snapshotName', async ({ params }) => {
    await delay(200);
    const { name, snapshotName } = params;
    const snapshots = snapshotsStore[name as string];
    if (snapshots) {
      const index = snapshots.findIndex((s) => s.name === snapshotName);
      if (index !== -1) {
        snapshots.splice(index, 1);
      }
    }
    return HttpResponse.json({
      result: true,
      status: 'ok',
      time: 0.1,
    });
  }),

  // Recover collection from snapshot
  http.post('/api/v1/collections/:name/snapshots/recover', async () => {
    await delay(1000);
    return HttpResponse.json({
      result: true,
      status: 'ok',
      time: 1.0,
    });
  }),

  // Download snapshot (returns binary data URL in real implementation)
  http.get('/api/v1/collections/:name/snapshots/:snapshotName', async () => {
    await delay(100);
    // In real implementation, this would stream the binary file
    return new HttpResponse(new Blob(['mock-snapshot-data']), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="snapshot.snapshot"',
      },
    });
  }),

  // List shard snapshots
  http.get('/api/v1/collections/:name/shards/:shardId/snapshots', async ({ params }) => {
    await delay(100);
    const { name, shardId } = params;
    const collectionShards = shardSnapshotsStore[name as string] || {};
    const snapshots = collectionShards[Number(shardId)] || [];
    return HttpResponse.json({
      result: snapshots,
      status: 'ok',
      time: 0.001,
    });
  }),

  // Create shard snapshot
  http.post('/api/v1/collections/:name/shards/:shardId/snapshots', async ({ params, request }) => {
    await delay(300);
    const { name, shardId } = params;
    const url = new URL(request.url);
    const wait = url.searchParams.get('wait') !== 'false';

    const newSnapshot = {
      name: `${name}-shard-${shardId}-${new Date().toISOString().replace(/[:.]/g, '-')}.snapshot`,
      creation_time: new Date().toISOString(),
      size: Math.floor(Math.random() * 1024 * 1024 * 200) + 1024 * 1024 * 50,
      checksum: `sha256:${Math.random().toString(36).substring(7)}...`,
      shard_id: Number(shardId),
    };

    if (!shardSnapshotsStore[name as string]) {
      shardSnapshotsStore[name as string] = {};
    }
    if (!shardSnapshotsStore[name as string][Number(shardId)]) {
      shardSnapshotsStore[name as string][Number(shardId)] = [];
    }
    shardSnapshotsStore[name as string][Number(shardId)].unshift(newSnapshot);

    if (!wait) {
      return new HttpResponse(null, { status: 202 });
    }

    return HttpResponse.json({
      result: newSnapshot,
      status: 'ok',
      time: 0.3,
    });
  }),

  // Recover shard from snapshot
  http.post('/api/v1/collections/:name/shards/:shardId/snapshots/recover', async () => {
    await delay(500);
    return HttpResponse.json({
      result: true,
      status: 'ok',
      time: 0.5,
    });
  }),
];

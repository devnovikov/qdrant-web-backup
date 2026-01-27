import { http, HttpResponse, delay } from 'msw';

const mockCollections = {
  result: {
    collections: [
      { name: 'products' },
      { name: 'users' },
      { name: 'documents' },
      { name: 'embeddings' },
      { name: 'images' },
    ],
  },
  status: 'ok',
  time: 0.001,
};

const mockCollectionDetails = (name: string) => ({
  result: {
    name,
    status: 'green',
    optimizer_status: 'ok',
    vectors_count: Math.floor(Math.random() * 1000000) + 10000,
    points_count: Math.floor(Math.random() * 1000000) + 10000,
    segments_count: Math.floor(Math.random() * 20) + 1,
    config: {
      params: {
        vectors: {
          size: 768,
          distance: 'Cosine',
          on_disk: false,
        },
        shard_number: 3,
        replication_factor: 2,
        write_consistency_factor: 1,
        on_disk_payload: true,
      },
      hnsw_config: {
        m: 16,
        ef_construct: 100,
        full_scan_threshold: 10000,
        max_indexing_threads: 0,
        on_disk: false,
      },
      optimizer_config: {
        deleted_threshold: 0.2,
        vacuum_min_vector_number: 1000,
        default_segment_number: 0,
        max_segment_size: null,
        memmap_threshold: null,
        indexing_threshold: 20000,
        flush_interval_sec: 5,
        max_optimization_threads: null,
      },
      wal_config: {
        wal_capacity_mb: 32,
        wal_segments_ahead: 0,
      },
      quantization_config: null,
    },
    payload_schema: {
      category: {
        data_type: 'keyword',
        points: 50000,
      },
      price: {
        data_type: 'float',
        points: 50000,
      },
    },
  },
  status: 'ok',
  time: 0.002,
});

const mockCollectionCluster = () => ({
  result: {
    peer_id: 1234567890,
    shard_count: 3,
    local_shards: [
      {
        shard_id: 0,
        points_count: Math.floor(Math.random() * 50000) + 10000,
        state: 'Active',
      },
      {
        shard_id: 1,
        points_count: Math.floor(Math.random() * 50000) + 10000,
        state: 'Active',
      },
    ],
    remote_shards: [
      {
        shard_id: 0,
        peer_id: 1234567891,
        state: 'Active',
      },
      {
        shard_id: 1,
        peer_id: 1234567891,
        state: 'Active',
      },
      {
        shard_id: 2,
        peer_id: 1234567891,
        state: 'Active',
      },
      {
        shard_id: 2,
        peer_id: 1234567892,
        state: 'Active',
      },
    ],
    shard_transfers: [],
  },
  status: 'ok',
  time: 0.001,
});

export const collectionsHandlers = [
  http.get('/api/v1/collections', async () => {
    await delay(100);
    return HttpResponse.json(mockCollections);
  }),

  http.get('/api/v1/collections/:name', async ({ params }) => {
    await delay(100);
    const { name } = params;
    return HttpResponse.json(mockCollectionDetails(name as string));
  }),

  http.get('/api/v1/collections/:name/cluster', async () => {
    await delay(100);
    return HttpResponse.json(mockCollectionCluster());
  }),
];

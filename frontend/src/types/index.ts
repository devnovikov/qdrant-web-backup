// System Capabilities
export interface QdrantCapabilities {
  isCloud: boolean;
}

// Cluster Types
export interface ClusterStatus {
  status: 'green' | 'yellow' | 'red';
  peer_id: number;
  peers: Record<string, PeerInfo>;
  raft_info: RaftInfo;
  consensus_thread_status: {
    consensus_thread_status: 'working' | 'stopped';
    last_update: string;
  };
  message?: string;
}

export interface PeerInfo {
  uri: string;
}

export interface RaftInfo {
  term: number;
  commit: number;
  pending_operations: number;
  leader: number;
  role?: 'Leader' | 'Follower';
  is_voter: boolean;
}

export interface ClusterNode {
  peer_id: number;
  uri: string;
  is_leader: boolean;
  is_voter: boolean;
  collections_count: number;
  shards_count: number;
}

// Collection Types
export interface Collection {
  name: string;
  status: 'green' | 'yellow' | 'red' | 'grey';
  optimizer_status: 'ok' | 'indexing';
  vectors_count: number;
  points_count: number;
  segments_count: number;
  config: CollectionConfig;
  payload_schema: Record<string, PayloadSchemaInfo>;
}

export interface CollectionConfig {
  params: {
    vectors: VectorParams | Record<string, VectorParams>;
    shard_number: number;
    sharding_method?: 'auto' | 'custom';
    replication_factor: number;
    write_consistency_factor: number;
    on_disk_payload: boolean;
  };
  hnsw_config: HnswConfig;
  optimizer_config: OptimizerConfig;
  wal_config: WalConfig;
  quantization_config?: QuantizationConfig;
}

export interface VectorParams {
  size: number;
  distance: 'Cosine' | 'Euclid' | 'Dot' | 'Manhattan';
  on_disk?: boolean;
}

export interface HnswConfig {
  m: number;
  ef_construct: number;
  full_scan_threshold: number;
  max_indexing_threads: number;
  on_disk?: boolean;
}

export interface OptimizerConfig {
  deleted_threshold: number;
  vacuum_min_vector_number: number;
  default_segment_number: number;
  max_segment_size?: number;
  memmap_threshold?: number;
  indexing_threshold?: number;
  flush_interval_sec: number;
  max_optimization_threads?: number;
}

export interface WalConfig {
  wal_capacity_mb: number;
  wal_segments_ahead: number;
}

export interface QuantizationConfig {
  scalar?: ScalarQuantization;
  product?: ProductQuantization;
  binary?: BinaryQuantization;
}

export interface ScalarQuantization {
  type: 'int8';
  quantile?: number;
  always_ram?: boolean;
}

export interface ProductQuantization {
  compression: 'x4' | 'x8' | 'x16' | 'x32' | 'x64';
  always_ram?: boolean;
}

export interface BinaryQuantization {
  always_ram?: boolean;
}

export interface PayloadSchemaInfo {
  data_type: 'keyword' | 'integer' | 'float' | 'geo' | 'text' | 'bool' | 'datetime';
  params?: Record<string, unknown>;
  points: number;
}

// Shard Types
export interface CollectionClusterInfo {
  peer_id: number;
  shard_count: number;
  local_shards: ShardInfo[];
  remote_shards: RemoteShardInfo[];
  shard_transfers: ShardTransferInfo[];
}

export interface ShardInfo {
  shard_id: number;
  shard_key?: string | number;
  points_count: number;
  state: 'Active' | 'Dead' | 'Partial' | 'Initializing' | 'Listener' | 'PartialSnapshot' | 'Recovery';
}

export interface RemoteShardInfo {
  shard_id: number;
  shard_key?: string | number;
  peer_id: number;
  state: 'Active' | 'Dead' | 'Partial' | 'Initializing' | 'Listener' | 'PartialSnapshot' | 'Recovery';
}

export interface ShardTransferInfo {
  shard_id: number;
  from: number;
  to: number;
  sync: boolean;
  method: 'stream_records' | 'snapshot' | 'wal_delta';
  comment?: string;
}

// Snapshot Types
export interface Snapshot {
  name: string;
  creation_time: string;
  size: number;
  checksum?: string;
}

export interface SnapshotRecover {
  location: string;
  priority?: 'replica' | 'snapshot' | 'no_sync';
  checksum?: string;
  api_key?: string;
}

export interface ShardSnapshot {
  name: string;
  creation_time: string;
  size: number;
  checksum?: string;
  shard_id: number;
}

// Storage Configuration Types
export interface StorageConfig {
  id: string;
  name: string;
  type: 'local' | 's3';
  path?: string;
  s3_endpoint?: string;
  s3_bucket?: string;
  s3_region?: string;
  s3_access_key?: string;
  s3_secret_key?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorageConfigCreate {
  name: string;
  type: 'local' | 's3';
  path?: string;
  s3_endpoint?: string;
  s3_bucket?: string;
  s3_region?: string;
  s3_access_key?: string;
  s3_secret_key?: string;
  is_default?: boolean;
}

// Job Types
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'backup' | 'restore' | 'shard_backup' | 'shard_restore';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  collection_name: string;
  shard_id?: number;
  snapshot_name?: string;
  storage_id?: string;
  progress: number;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
}

export interface JobCreate {
  type: JobType;
  collection_name: string;
  shard_id?: number;
  snapshot_name?: string;
  storage_id?: string;
  metadata?: Record<string, unknown>;
}

// API Response Types
export interface ApiResponse<T> {
  result: T;
  status: 'ok';
  time: number;
}

export interface ApiError {
  status: {
    error: string;
  };
  time: number;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// WebSocket Messages
export interface WsMessage {
  type: 'job_progress' | 'job_status' | 'cluster_status' | 'error';
  payload: unknown;
}

export interface JobProgressPayload {
  job_id: string;
  progress: number;
  message?: string;
}

export interface JobStatusPayload {
  job_id: string;
  status: JobStatus;
  error?: string;
}

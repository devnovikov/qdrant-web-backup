/**
 * Centralized API Service
 * ALL backend communication flows through this module
 */

import type {
  ClusterStatus,
  ClusterNode,
  Collection,
  CollectionClusterInfo,
  Snapshot,
  ShardSnapshot,
  SnapshotRecover,
  StorageConfig,
  StorageConfigCreate,
  Job,
  JobCreate,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

const API_BASE = '/api/v1';

class ApiError extends Error {
  status: number;
  statusText: string;
  body?: unknown;

  constructor(status: number, statusText: string, body?: unknown) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new ApiError(response.status, response.statusText, body);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// ==================== Cluster API ====================

export const clusterApi = {
  getStatus: (): Promise<ApiResponse<ClusterStatus>> =>
    request('/cluster'),

  getNodes: (): Promise<ApiResponse<ClusterNode[]>> =>
    request('/cluster/nodes'),

  getHealth: (): Promise<{ status: string }> =>
    request('/healthz'),
};

// ==================== Collections API ====================

export const collectionsApi = {
  list: (): Promise<ApiResponse<{ collections: { name: string }[] }>> =>
    request('/collections'),

  get: (name: string): Promise<ApiResponse<Collection>> =>
    request(`/collections/${encodeURIComponent(name)}`),

  getClusterInfo: (name: string): Promise<ApiResponse<CollectionClusterInfo>> =>
    request(`/collections/${encodeURIComponent(name)}/cluster`),
};

// ==================== Snapshots API ====================

export const snapshotsApi = {
  list: (collectionName: string): Promise<ApiResponse<Snapshot[]>> =>
    request(`/collections/${encodeURIComponent(collectionName)}/snapshots`),

  create: (
    collectionName: string,
    wait?: boolean
  ): Promise<ApiResponse<Snapshot>> =>
    request(
      `/collections/${encodeURIComponent(collectionName)}/snapshots${wait !== undefined ? `?wait=${wait}` : ''}`,
      { method: 'POST' }
    ),

  download: (collectionName: string, snapshotName: string): string =>
    `${API_BASE}/collections/${encodeURIComponent(collectionName)}/snapshots/${encodeURIComponent(snapshotName)}`,

  delete: (
    collectionName: string,
    snapshotName: string
  ): Promise<ApiResponse<boolean>> =>
    request(
      `/collections/${encodeURIComponent(collectionName)}/snapshots/${encodeURIComponent(snapshotName)}`,
      { method: 'DELETE' }
    ),

  recover: (
    collectionName: string,
    data: SnapshotRecover
  ): Promise<ApiResponse<boolean>> =>
    request(
      `/collections/${encodeURIComponent(collectionName)}/snapshots/recover`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
};

// ==================== Shard Snapshots API ====================

export const shardSnapshotsApi = {
  list: (
    collectionName: string,
    shardId: number
  ): Promise<ApiResponse<ShardSnapshot[]>> =>
    request(
      `/collections/${encodeURIComponent(collectionName)}/shards/${shardId}/snapshots`
    ),

  create: (
    collectionName: string,
    shardId: number,
    wait?: boolean
  ): Promise<ApiResponse<ShardSnapshot>> =>
    request(
      `/collections/${encodeURIComponent(collectionName)}/shards/${shardId}/snapshots${wait !== undefined ? `?wait=${wait}` : ''}`,
      { method: 'POST' }
    ),

  download: (
    collectionName: string,
    shardId: number,
    snapshotName: string
  ): string =>
    `${API_BASE}/collections/${encodeURIComponent(collectionName)}/shards/${shardId}/snapshots/${encodeURIComponent(snapshotName)}`,

  recover: (
    collectionName: string,
    shardId: number,
    data: SnapshotRecover
  ): Promise<ApiResponse<boolean>> =>
    request(
      `/collections/${encodeURIComponent(collectionName)}/shards/${shardId}/snapshots/recover`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
};

// ==================== Storage API ====================

export const storageApi = {
  getConfig: (): Promise<ApiResponse<StorageConfig[]>> =>
    request('/storage/config'),

  updateConfig: (
    id: string,
    data: Partial<StorageConfigCreate>
  ): Promise<ApiResponse<StorageConfig>> =>
    request(`/storage/config/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createConfig: (data: StorageConfigCreate): Promise<ApiResponse<StorageConfig>> =>
    request('/storage/config', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteConfig: (id: string): Promise<ApiResponse<boolean>> =>
    request(`/storage/config/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  testConnectivity: (
    data: StorageConfigCreate
  ): Promise<ApiResponse<{ success: boolean; message?: string }>> =>
    request('/storage/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ==================== Jobs API ====================

export const jobsApi = {
  list: (params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Job>> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return request(`/jobs${query ? `?${query}` : ''}`);
  },

  get: (id: string): Promise<ApiResponse<Job>> =>
    request(`/jobs/${encodeURIComponent(id)}`),

  create: (data: JobCreate): Promise<ApiResponse<Job>> =>
    request('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancel: (id: string): Promise<ApiResponse<boolean>> =>
    request(`/jobs/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
    }),

  retry: (id: string): Promise<ApiResponse<Job>> =>
    request(`/jobs/${encodeURIComponent(id)}/retry`, {
      method: 'POST',
    }),
};

// ==================== Metrics API ====================

export const metricsApi = {
  getPrometheus: (): Promise<string> =>
    fetch(`${API_BASE}/metrics`).then((r) => r.text()),
};

// Export default API object
export const api = {
  cluster: clusterApi,
  collections: collectionsApi,
  snapshots: snapshotsApi,
  shardSnapshots: shardSnapshotsApi,
  storage: storageApi,
  jobs: jobsApi,
  metrics: metricsApi,
};

export default api;

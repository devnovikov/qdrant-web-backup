import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  clusterApi,
  collectionsApi,
  snapshotsApi,
  shardSnapshotsApi,
  storageApi,
  jobsApi,
} from '@/services/api';
import type { SnapshotRecover, StorageConfigCreate, JobCreate } from '@/types';

// Query Keys
export const queryKeys = {
  cluster: ['cluster'] as const,
  clusterNodes: ['cluster', 'nodes'] as const,
  collections: ['collections'] as const,
  collection: (name: string) => ['collections', name] as const,
  collectionCluster: (name: string) => ['collections', name, 'cluster'] as const,
  snapshots: (collectionName: string) => ['snapshots', collectionName] as const,
  shardSnapshots: (collectionName: string, shardId: number) =>
    ['snapshots', collectionName, 'shards', shardId] as const,
  storage: ['storage'] as const,
  jobs: (filters?: { status?: string; type?: string }) =>
    ['jobs', filters] as const,
  job: (id: string) => ['jobs', id] as const,
};

// ==================== Cluster Hooks ====================

export function useClusterStatus(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.cluster,
    queryFn: () => clusterApi.getStatus(),
    refetchInterval: options?.refetchInterval ?? 5000,
  });
}

export function useClusterNodes() {
  return useQuery({
    queryKey: queryKeys.clusterNodes,
    queryFn: () => clusterApi.getNodes(),
  });
}

// ==================== Collections Hooks ====================

export function useCollections() {
  return useQuery({
    queryKey: queryKeys.collections,
    queryFn: () => collectionsApi.list(),
  });
}

export function useCollection(name: string) {
  return useQuery({
    queryKey: queryKeys.collection(name),
    queryFn: () => collectionsApi.get(name),
    enabled: !!name,
  });
}

export function useCollectionCluster(name: string) {
  return useQuery({
    queryKey: queryKeys.collectionCluster(name),
    queryFn: () => collectionsApi.getClusterInfo(name),
    enabled: !!name,
  });
}

// ==================== Snapshots Hooks ====================

export function useSnapshots(collectionName: string) {
  return useQuery({
    queryKey: queryKeys.snapshots(collectionName),
    queryFn: () => snapshotsApi.list(collectionName),
    enabled: !!collectionName,
  });
}

export function useCreateSnapshot(collectionName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wait?: boolean) => snapshotsApi.create(collectionName, wait),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.snapshots(collectionName),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs() });
    },
  });
}

export function useDeleteSnapshot(collectionName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (snapshotName: string) =>
      snapshotsApi.delete(collectionName, snapshotName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.snapshots(collectionName),
      });
    },
  });
}

export function useRecoverSnapshot(collectionName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SnapshotRecover) =>
      snapshotsApi.recover(collectionName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collection(collectionName),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs() });
    },
  });
}

// ==================== Shard Snapshots Hooks ====================

export function useShardSnapshots(collectionName: string, shardId: number) {
  return useQuery({
    queryKey: queryKeys.shardSnapshots(collectionName, shardId),
    queryFn: () => shardSnapshotsApi.list(collectionName, shardId),
    enabled: !!collectionName && shardId !== undefined,
  });
}

export function useCreateShardSnapshot(collectionName: string, shardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (wait?: boolean) =>
      shardSnapshotsApi.create(collectionName, shardId, wait),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.shardSnapshots(collectionName, shardId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs() });
    },
  });
}

export function useRecoverShardSnapshot(collectionName: string, shardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SnapshotRecover) =>
      shardSnapshotsApi.recover(collectionName, shardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.collectionCluster(collectionName),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs() });
    },
  });
}

// ==================== Storage Hooks ====================

export function useStorageConfig() {
  return useQuery({
    queryKey: queryKeys.storage,
    queryFn: () => storageApi.getConfig(),
  });
}

export function useCreateStorageConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StorageConfigCreate) => storageApi.createConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage });
    },
  });
}

export function useUpdateStorageConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<StorageConfigCreate>;
    }) => storageApi.updateConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage });
    },
  });
}

export function useDeleteStorageConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storageApi.deleteConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storage });
    },
  });
}

export function useTestStorageConnectivity() {
  return useMutation({
    mutationFn: (data: StorageConfigCreate) => storageApi.testConnectivity(data),
  });
}

// ==================== Jobs Hooks ====================

export function useJobs(filters?: { status?: string; type?: string }) {
  return useQuery({
    queryKey: queryKeys.jobs(filters),
    queryFn: () => jobsApi.list(filters),
    refetchInterval: 3000,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: queryKeys.job(id),
    queryFn: () => jobsApi.get(id),
    enabled: !!id,
    refetchInterval: 1000,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: JobCreate) => jobsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs() });
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs() });
    },
  });
}

export function useRetryJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobsApi.retry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs() });
    },
  });
}

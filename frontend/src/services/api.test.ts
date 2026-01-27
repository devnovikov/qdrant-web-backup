import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from '@/mocks/server';
import { clusterApi, collectionsApi, snapshotsApi, jobsApi, storageApi } from './api';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Cluster API', () => {
  it('should fetch cluster status', async () => {
    const response = await clusterApi.getStatus();

    expect(response.status).toBe('ok');
    expect(response.result).toHaveProperty('status');
    expect(response.result).toHaveProperty('peer_id');
    expect(response.result).toHaveProperty('peers');
    expect(response.result).toHaveProperty('raft_info');
  });

  it('should fetch cluster nodes', async () => {
    const response = await clusterApi.getNodes();

    expect(response.status).toBe('ok');
    expect(Array.isArray(response.result)).toBe(true);
    expect(response.result.length).toBeGreaterThan(0);
    expect(response.result[0]).toHaveProperty('peer_id');
    expect(response.result[0]).toHaveProperty('uri');
  });
});

describe('Collections API', () => {
  it('should fetch collections list', async () => {
    const response = await collectionsApi.list();

    expect(response.status).toBe('ok');
    expect(response.result).toHaveProperty('collections');
    expect(Array.isArray(response.result.collections)).toBe(true);
  });

  it('should fetch collection details', async () => {
    const response = await collectionsApi.get('products');

    expect(response.status).toBe('ok');
    expect(response.result).toHaveProperty('name');
    expect(response.result).toHaveProperty('status');
    expect(response.result).toHaveProperty('vectors_count');
    expect(response.result).toHaveProperty('config');
  });

  it('should fetch collection cluster info', async () => {
    const response = await collectionsApi.getClusterInfo('products');

    expect(response.status).toBe('ok');
    expect(response.result).toHaveProperty('peer_id');
    expect(response.result).toHaveProperty('shard_count');
    expect(response.result).toHaveProperty('local_shards');
  });
});

describe('Snapshots API', () => {
  it('should fetch snapshots for a collection', async () => {
    const response = await snapshotsApi.list('products');

    expect(response.status).toBe('ok');
    expect(Array.isArray(response.result)).toBe(true);
  });

  it('should create a snapshot', async () => {
    const response = await snapshotsApi.create('products', true);

    expect(response.status).toBe('ok');
    expect(response.result).toHaveProperty('name');
    expect(response.result).toHaveProperty('creation_time');
    expect(response.result).toHaveProperty('size');
  });

  it('should delete a snapshot', async () => {
    // First create a snapshot
    const created = await snapshotsApi.create('products', true);

    // Then delete it
    const response = await snapshotsApi.delete('products', created.result.name);

    expect(response.status).toBe('ok');
    expect(response.result).toBe(true);
  });
});

describe('Jobs API', () => {
  it('should fetch jobs list', async () => {
    const response = await jobsApi.list();

    expect(response).toHaveProperty('items');
    expect(response).toHaveProperty('total');
    expect(response).toHaveProperty('page');
    expect(Array.isArray(response.items)).toBe(true);
  });

  it('should filter jobs by status', async () => {
    const response = await jobsApi.list({ status: 'completed' });

    expect(response).toHaveProperty('items');
    response.items.forEach((job) => {
      expect(job.status).toBe('completed');
    });
  });

  it('should create a job', async () => {
    const response = await jobsApi.create({
      type: 'backup',
      collection_name: 'products',
    });

    expect(response.status).toBe('ok');
    expect(response.result).toHaveProperty('id');
    expect(response.result).toHaveProperty('type', 'backup');
    expect(response.result).toHaveProperty('collection_name', 'products');
  });
});

describe('Storage API', () => {
  it('should fetch storage configurations', async () => {
    const response = await storageApi.getConfig();

    expect(response.status).toBe('ok');
    expect(Array.isArray(response.result)).toBe(true);
  });

  it('should create a storage configuration', async () => {
    const response = await storageApi.createConfig({
      name: 'Test Storage',
      type: 'local',
      path: '/tmp/test',
    });

    expect(response.status).toBe('ok');
    expect(response.result).toHaveProperty('id');
    expect(response.result).toHaveProperty('name', 'Test Storage');
    expect(response.result).toHaveProperty('type', 'local');
  });

  it('should test storage connectivity', async () => {
    const response = await storageApi.testConnectivity({
      name: 'Test',
      type: 'local',
      path: '/tmp/test',
    });

    expect(response.status).toBe('ok');
    expect(response.result).toHaveProperty('success');
    expect(response.result).toHaveProperty('message');
  });
});

import { http, HttpResponse, delay } from 'msw';

const mockClusterStatus = {
  result: {
    status: 'green',
    peer_id: 1234567890,
    peers: {
      '1234567890': { uri: 'http://node-1:6335' },
      '1234567891': { uri: 'http://node-2:6335' },
      '1234567892': { uri: 'http://node-3:6335' },
    },
    raft_info: {
      term: 5,
      commit: 1023,
      pending_operations: 0,
      leader: 1234567890,
      role: 'Leader',
      is_voter: true,
    },
    consensus_thread_status: {
      consensus_thread_status: 'working',
      last_update: new Date().toISOString(),
    },
  },
  status: 'ok',
  time: 0.001,
};

const mockClusterNodes = {
  result: [
    {
      peer_id: 1234567890,
      uri: 'http://node-1:6335',
      is_leader: true,
      is_voter: true,
      collections_count: 5,
      shards_count: 12,
    },
    {
      peer_id: 1234567891,
      uri: 'http://node-2:6335',
      is_leader: false,
      is_voter: true,
      collections_count: 5,
      shards_count: 10,
    },
    {
      peer_id: 1234567892,
      uri: 'http://node-3:6335',
      is_leader: false,
      is_voter: true,
      collections_count: 5,
      shards_count: 10,
    },
  ],
  status: 'ok',
  time: 0.001,
};

export const clusterHandlers = [
  http.get('/api/v1/cluster', async () => {
    await delay(100);
    return HttpResponse.json(mockClusterStatus);
  }),

  http.get('/api/v1/cluster/nodes', async () => {
    await delay(100);
    return HttpResponse.json(mockClusterNodes);
  }),

  http.get('/api/v1/healthz', async () => {
    await delay(50);
    return HttpResponse.json({ status: 'ok' });
  }),
];

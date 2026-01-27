import { useClusterStatus, useClusterNodes, useCollections, useJobs } from '@/hooks/useApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  LoadingState,
  ErrorState,
} from '@/components/ui';
import { cn, formatNumber, getStatusDot } from '@/lib/utils';
import {
  Server,
  Database,
  HardDrive,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { data: clusterData, isLoading: clusterLoading, error: clusterError } = useClusterStatus();
  const { data: nodesData } = useClusterNodes();
  const { data: collectionsData } = useCollections();
  const { data: jobsData } = useJobs();

  if (clusterLoading) {
    return <LoadingState message="Loading cluster status..." />;
  }

  if (clusterError) {
    return <ErrorState title="Failed to load cluster" message="Could not connect to Qdrant cluster" />;
  }

  const cluster = clusterData?.result;
  const nodes = nodesData?.result || [];
  const collections = collectionsData?.result?.collections || [];
  const jobs = jobsData?.items || [];

  const runningJobs = jobs.filter((j) => j.status === 'running').length;
  const pendingJobs = jobs.filter((j) => j.status === 'pending').length;
  const failedJobs = jobs.filter((j) => j.status === 'failed').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Monitor your Qdrant cluster and backup operations
        </p>
      </div>

      {/* Cluster Status Banner */}
      <Card className={cn(
        'border-l-4',
        cluster?.status === 'green' && 'border-l-green-500',
        cluster?.status === 'yellow' && 'border-l-yellow-500',
        cluster?.status === 'red' && 'border-l-red-500'
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-3 h-3 rounded-full animate-pulse',
                getStatusDot(cluster?.status || 'grey')
              )} />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Cluster Status: {cluster?.status?.toUpperCase()}
                </h2>
                <p className="text-sm text-gray-500">
                  Leader: Node {cluster?.raft_info?.leader} | Term: {cluster?.raft_info?.term} | Commit: {cluster?.raft_info?.commit}
                </p>
              </div>
            </div>
            <Badge variant={cluster?.status === 'green' ? 'success' : cluster?.status === 'yellow' ? 'warning' : 'error'}>
              {cluster?.raft_info?.role || 'Unknown'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Cluster Nodes</p>
                <p className="text-2xl font-bold text-gray-900">{nodes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Collections</p>
                <p className="text-2xl font-bold text-gray-900">{collections.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <HardDrive className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Shards</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(nodes.reduce((acc, n) => acc + n.shards_count, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{runningJobs + pendingJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nodes List */}
        <Card>
          <CardHeader>
            <CardTitle>Cluster Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nodes.map((node) => (
                <div
                  key={node.peer_id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      'bg-green-500'
                    )} />
                    <div>
                      <p className="font-medium text-gray-900">{node.uri}</p>
                      <p className="text-sm text-gray-500">
                        Peer ID: {node.peer_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {node.is_leader && (
                        <Badge variant="info">Leader</Badge>
                      )}
                      <Badge variant="default">
                        {node.shards_count} shards
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Jobs Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Jobs</CardTitle>
            <Link
              to="/jobs"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Job Stats */}
              <div className="grid grid-cols-4 gap-4 pb-4 border-b border-gray-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-lg font-semibold">
                      {jobs.filter((j) => j.status === 'completed').length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600">
                    <Activity className="h-4 w-4" />
                    <span className="text-lg font-semibold">{runningJobs}</span>
                  </div>
                  <p className="text-xs text-gray-500">Running</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-lg font-semibold">{pendingJobs}</span>
                  </div>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-lg font-semibold">{failedJobs}</span>
                  </div>
                  <p className="text-xs text-gray-500">Failed</p>
                </div>
              </div>

              {/* Recent Jobs List */}
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      getStatusDot(job.status)
                    )} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {job.type === 'backup' ? 'Backup' : 'Restore'}: {job.collection_name}
                      </p>
                      <p className="text-xs text-gray-500">{job.status}</p>
                    </div>
                  </div>
                  {job.status === 'running' && (
                    <Badge variant="info">{job.progress}%</Badge>
                  )}
                </div>
              ))}

              {jobs.length === 0 && (
                <p className="text-center text-gray-500 py-4">No jobs yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collections Quick View */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Collections</CardTitle>
          <Link
            to="/collections"
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.slice(0, 6).map((collection) => (
              <Link
                key={collection.name}
                to={`/collections/${collection.name}`}
                className="p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Database className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{collection.name}</p>
                    <p className="text-sm text-gray-500">Click to view details</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

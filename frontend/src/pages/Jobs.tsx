import { useState } from 'react';
import { useJobs, useCancelJob, useRetryJob } from '@/hooks/useApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Progress,
  Modal,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import { cn, formatDate, formatRelativeTime, getStatusColor } from '@/lib/utils';
import {
  RefreshCw,
  XCircle,
  RotateCcw,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { Job, JobStatus, JobType } from '@/types';

export function Jobs() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data, isLoading, refetch } = useJobs({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  });

  const cancelJob = useCancelJob();
  const retryJob = useRetryJob();

  const jobs = data?.items || [];

  const handleCancel = async (id: string) => {
    try {
      await cancelJob.mutateAsync(id);
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await retryJob.mutateAsync(id);
    } catch (err) {
      console.error('Failed to retry job:', err);
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: JobStatus) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'info';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: JobType) => {
    switch (type) {
      case 'backup':
        return 'Backup';
      case 'restore':
        return 'Restore';
      case 'shard_backup':
        return 'Shard Backup';
      case 'shard_restore':
        return 'Shard Restore';
      default:
        return type;
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading jobs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 mt-1">
            Monitor backup and restore operations
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="backup">Backup</option>
                <option value="restore">Restore</option>
                <option value="shard_backup">Shard Backup</option>
                <option value="shard_restore">Shard Restore</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <EmptyState
              title="No jobs found"
              message={
                statusFilter || typeFilter
                  ? 'No jobs matching the selected filters'
                  : 'No backup or restore jobs have been run yet'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Collection</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow
                    key={job.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedJob(job)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <Badge variant={getStatusBadgeVariant(job.status) as 'default' | 'success' | 'warning' | 'error' | 'info'}>
                          {job.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeLabel(job.type)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{job.collection_name}</span>
                      {job.shard_id !== undefined && (
                        <span className="text-gray-500 text-sm ml-2">
                          (Shard {job.shard_id})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="w-32">
                        <Progress
                          value={job.progress}
                          variant={
                            job.status === 'failed'
                              ? 'error'
                              : job.status === 'completed'
                              ? 'success'
                              : 'default'
                          }
                          showLabel
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span title={formatDate(job.created_at)}>
                        {formatRelativeTime(job.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(job.status === 'pending' || job.status === 'running') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel(job.id);
                            }}
                            isLoading={cancelJob.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {(job.status === 'failed' || job.status === 'cancelled') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(job.id);
                            }}
                            isLoading={retryJob.isPending}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Job Details Modal */}
      <Modal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title="Job Details"
        size="lg"
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Job ID</p>
                <p className="font-mono text-sm">{selectedJob.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(selectedJob.status)}
                  <span className={cn('font-medium', getStatusColor(selectedJob.status))}>
                    {selectedJob.status}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{getTypeLabel(selectedJob.type)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Collection</p>
                <p className="font-medium">{selectedJob.collection_name}</p>
              </div>
              {selectedJob.shard_id !== undefined && (
                <div>
                  <p className="text-sm text-gray-500">Shard ID</p>
                  <p className="font-medium">{selectedJob.shard_id}</p>
                </div>
              )}
              {selectedJob.snapshot_name && (
                <div>
                  <p className="text-sm text-gray-500">Snapshot</p>
                  <p className="font-mono text-sm">{selectedJob.snapshot_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{formatDate(selectedJob.created_at)}</p>
              </div>
              {selectedJob.started_at && (
                <div>
                  <p className="text-sm text-gray-500">Started</p>
                  <p className="font-medium">{formatDate(selectedJob.started_at)}</p>
                </div>
              )}
              {selectedJob.completed_at && (
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="font-medium">{formatDate(selectedJob.completed_at)}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Progress</p>
              <Progress
                value={selectedJob.progress}
                variant={
                  selectedJob.status === 'failed'
                    ? 'error'
                    : selectedJob.status === 'completed'
                    ? 'success'
                    : 'default'
                }
                showLabel
              />
            </div>

            {selectedJob.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600 mt-1">{selectedJob.error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
              {(selectedJob.status === 'failed' || selectedJob.status === 'cancelled') && (
                <Button
                  onClick={() => {
                    handleRetry(selectedJob.id);
                    setSelectedJob(null);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry Job
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

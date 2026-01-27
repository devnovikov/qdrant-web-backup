import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useCollection,
  useCollectionCluster,
  useSnapshots,
  useCreateSnapshot,
  useDeleteSnapshot,
} from '@/hooks/useApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
  LoadingState,
  ErrorState,
  EmptyState,
  Alert,
} from '@/components/ui';
import { cn, formatBytes, formatDate, formatNumber, getStatusDot } from '@/lib/utils';
import {
  ArrowLeft,
  Database,
  HardDrive,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  Archive,
} from 'lucide-react';

export function CollectionDetail() {
  const { name } = useParams<{ name: string }>();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<string | null>(null);

  const { data: collectionData, isLoading: collectionLoading, error: collectionError } = useCollection(name!);
  const { data: clusterData } = useCollectionCluster(name!);
  const { data: snapshotsData, refetch: refetchSnapshots } = useSnapshots(name!);

  const createSnapshot = useCreateSnapshot(name!);
  const deleteSnapshot = useDeleteSnapshot(name!);

  if (collectionLoading) {
    return <LoadingState message="Loading collection details..." />;
  }

  if (collectionError) {
    return (
      <ErrorState
        title="Failed to load collection"
        message={`Could not fetch details for collection "${name}"`}
      />
    );
  }

  const collection = collectionData?.result;
  const cluster = clusterData?.result;
  const snapshots = snapshotsData?.result || [];

  const handleCreateSnapshot = async () => {
    try {
      await createSnapshot.mutateAsync(true);
    } catch (err) {
      console.error('Failed to create snapshot:', err);
    }
  };

  const handleDeleteSnapshot = async () => {
    if (!snapshotToDelete) return;
    try {
      await deleteSnapshot.mutateAsync(snapshotToDelete);
      setDeleteModalOpen(false);
      setSnapshotToDelete(null);
    } catch (err) {
      console.error('Failed to delete snapshot:', err);
    }
  };

  const confirmDelete = (snapshotName: string) => {
    setSnapshotToDelete(snapshotName);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/collections"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            <Badge variant={collection?.status === 'green' ? 'success' : 'warning'}>
              {collection?.status}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">Collection details and snapshots</p>
        </div>
        <Button
          onClick={handleCreateSnapshot}
          isLoading={createSnapshot.isPending}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Snapshot
        </Button>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Vectors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(collection?.vectors_count || 0)}
                </p>
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
                <p className="text-sm text-gray-500">Segments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {collection?.segments_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Archive className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Snapshots</p>
                <p className="text-2xl font-bold text-gray-900">
                  {snapshots.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <RefreshCw className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Shards</p>
                <p className="text-2xl font-bold text-gray-900">
                  {collection?.config?.params?.shard_number || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shard Distribution */}
      {cluster && (
        <Card>
          <CardHeader>
            <CardTitle>Shard Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Local Shards */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Local Shards</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cluster.local_shards?.map((shard) => (
                    <div
                      key={shard.shard_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2 h-2 rounded-full', getStatusDot(shard.state))} />
                        <span className="font-medium">Shard {shard.shard_id}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatNumber(shard.points_count)} points
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remote Shards */}
              {cluster.remote_shards && cluster.remote_shards.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Remote Shards</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cluster.remote_shards?.map((shard, idx) => (
                      <div
                        key={`${shard.shard_id}-${shard.peer_id}-${idx}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn('w-2 h-2 rounded-full', getStatusDot(shard.state))} />
                          <span className="font-medium">Shard {shard.shard_id}</span>
                        </div>
                        <Badge variant="default">Peer {shard.peer_id}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Snapshots */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Snapshots</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetchSnapshots()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {createSnapshot.isSuccess && (
            <Alert variant="success" className="mb-4">
              Snapshot created successfully!
            </Alert>
          )}

          {snapshots.length === 0 ? (
            <EmptyState
              title="No snapshots"
              message="Create your first snapshot to backup this collection"
              action={
                <Button onClick={handleCreateSnapshot} isLoading={createSnapshot.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Snapshot
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map((snapshot) => (
                  <TableRow key={snapshot.name}>
                    <TableCell className="font-medium">{snapshot.name}</TableCell>
                    <TableCell>{formatDate(snapshot.creation_time)}</TableCell>
                    <TableCell>{formatBytes(snapshot.size)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // In real implementation, this would trigger download
                            const url = `/api/v1/collections/${name}/snapshots/${snapshot.name}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(snapshot.name)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Snapshot"
        description="Are you sure you want to delete this snapshot? This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You are about to delete: <strong>{snapshotToDelete}</strong>
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteSnapshot}
              isLoading={deleteSnapshot.isPending}
            >
              Delete Snapshot
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

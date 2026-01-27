import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCollections, useSnapshots } from '@/hooks/useApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import { formatBytes, formatDate } from '@/lib/utils';
import { Archive, Download, Database, RefreshCw } from 'lucide-react';

export function Snapshots() {
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const { data: collectionsData, isLoading: collectionsLoading } = useCollections();
  const { data: snapshotsData, isLoading: snapshotsLoading, refetch } = useSnapshots(selectedCollection);

  const collections = collectionsData?.result?.collections || [];
  const snapshots = snapshotsData?.result || [];

  // Auto-select first collection
  if (collections.length > 0 && !selectedCollection) {
    setSelectedCollection(collections[0].name);
  }

  if (collectionsLoading) {
    return <LoadingState message="Loading collections..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Snapshots</h1>
          <p className="text-gray-500 mt-1">
            View and manage collection snapshots across your cluster
          </p>
        </div>
        <Link to="/restore">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Restore Snapshot
          </Button>
        </Link>
      </div>

      {/* Collection Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Collection
              </label>
              <Select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
              >
                <option value="" disabled>
                  Choose a collection
                </option>
                {collections.map((collection) => (
                  <option key={collection.name} value={collection.name}>
                    {collection.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="pt-6">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={!selectedCollection}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Snapshots Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-purple-600" />
            Snapshots for {selectedCollection || 'Collection'}
          </CardTitle>
          {snapshots.length > 0 && (
            <Badge variant="info">{snapshots.length} snapshots</Badge>
          )}
        </CardHeader>
        <CardContent>
          {!selectedCollection ? (
            <EmptyState
              title="Select a collection"
              message="Choose a collection to view its snapshots"
            />
          ) : snapshotsLoading ? (
            <LoadingState message="Loading snapshots..." />
          ) : snapshots.length === 0 ? (
            <EmptyState
              title="No snapshots"
              message={`No snapshots found for "${selectedCollection}"`}
              action={
                <Link to={`/collections/${selectedCollection}`}>
                  <Button>
                    <Database className="h-4 w-4 mr-2" />
                    Go to Collection
                  </Button>
                </Link>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Snapshot Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Checksum</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map((snapshot) => (
                  <TableRow key={snapshot.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{snapshot.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(snapshot.creation_time)}</TableCell>
                    <TableCell>
                      <Badge variant="default">{formatBytes(snapshot.size)}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-gray-500">
                        {snapshot.checksum?.substring(0, 20)}...
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const url = `/api/v1/collections/${selectedCollection}/snapshots/${snapshot.name}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {snapshots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{snapshots.length}</p>
                <p className="text-sm text-gray-500 mt-1">Total Snapshots</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {formatBytes(snapshots.reduce((acc, s) => acc + s.size, 0))}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total Size</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {snapshots[0] ? formatDate(snapshots[0].creation_time) : 'N/A'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Latest Snapshot</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

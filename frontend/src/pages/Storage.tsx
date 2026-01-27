import { useState } from 'react';
import {
  useStorageConfig,
  useCreateStorageConfig,
  useDeleteStorageConfig,
  useTestStorageConnectivity,
} from '@/hooks/useApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2, HardDrive, Cloud, TestTube, CheckCircle, XCircle } from 'lucide-react';
import type { StorageConfig, StorageConfigCreate } from '@/types';

export function Storage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<StorageConfig | null>(null);
  const [formData, setFormData] = useState<StorageConfigCreate>({
    name: '',
    type: 'local',
    path: '',
    s3_endpoint: '',
    s3_bucket: '',
    s3_region: '',
    s3_access_key: '',
    s3_secret_key: '',
    is_default: false,
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string } | null>(null);

  const { data, isLoading } = useStorageConfig();
  const createConfig = useCreateStorageConfig();
  const deleteConfigMutation = useDeleteStorageConfig();
  const testConnectivity = useTestStorageConnectivity();

  const configs = data?.result || [];

  const handleCreate = async () => {
    try {
      await createConfig.mutateAsync(formData);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create storage config:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfig) return;
    try {
      await deleteConfigMutation.mutateAsync(deleteConfig.id);
      setDeleteConfig(null);
    } catch (err) {
      console.error('Failed to delete storage config:', err);
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const result = await testConnectivity.mutateAsync(formData);
      setTestResult(result.result);
    } catch {
      setTestResult({ success: false, message: 'Failed to test connectivity' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'local',
      path: '',
      s3_endpoint: '',
      s3_bucket: '',
      s3_region: '',
      s3_access_key: '',
      s3_secret_key: '',
      is_default: false,
    });
    setTestResult(null);
  };

  if (isLoading) {
    return <LoadingState message="Loading storage configurations..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Storage</h1>
          <p className="text-gray-500 mt-1">
            Configure backup storage locations
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Storage
        </Button>
      </div>

      {/* Storage Configs */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Configurations</CardTitle>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <EmptyState
              title="No storage configured"
              message="Add a storage location to save your backups"
              action={
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Storage
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {config.type === 'local' ? (
                          <HardDrive className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Cloud className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="font-medium">{config.name}</span>
                        {config.is_default && (
                          <Badge variant="info">Default</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.type === 's3' ? 'info' : 'default'}>
                        {config.type === 's3' ? 'S3' : 'Local'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {config.type === 'local' ? (
                        <code className="text-sm">{config.path}</code>
                      ) : (
                        <code className="text-sm">
                          {config.s3_bucket} ({config.s3_region})
                        </code>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(config.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {!config.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfig(config)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Add Storage Configuration"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Backup Storage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <Select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as 'local' | 's3' })
              }
            >
              <option value="local">Local Filesystem</option>
              <option value="s3">S3-Compatible Storage</option>
            </Select>
          </div>

          {formData.type === 'local' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Path
              </label>
              <Input
                value={formData.path}
                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                placeholder="/var/qdrant/snapshots"
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    S3 Endpoint
                  </label>
                  <Input
                    value={formData.s3_endpoint}
                    onChange={(e) =>
                      setFormData({ ...formData, s3_endpoint: e.target.value })
                    }
                    placeholder="https://s3.amazonaws.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bucket
                  </label>
                  <Input
                    value={formData.s3_bucket}
                    onChange={(e) =>
                      setFormData({ ...formData, s3_bucket: e.target.value })
                    }
                    placeholder="my-backup-bucket"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <Input
                  value={formData.s3_region}
                  onChange={(e) =>
                    setFormData({ ...formData, s3_region: e.target.value })
                  }
                  placeholder="us-east-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Key
                  </label>
                  <Input
                    type="password"
                    value={formData.s3_access_key}
                    onChange={(e) =>
                      setFormData({ ...formData, s3_access_key: e.target.value })
                    }
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secret Key
                  </label>
                  <Input
                    type="password"
                    value={formData.s3_secret_key}
                    onChange={(e) =>
                      setFormData({ ...formData, s3_secret_key: e.target.value })
                    }
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) =>
                setFormData({ ...formData, is_default: e.target.checked })
              }
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="is_default" className="text-sm text-gray-700">
              Set as default storage
            </label>
          </div>

          {testResult && (
            <Alert variant={testResult.success ? 'success' : 'error'}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {testResult.message}
              </div>
            </Alert>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleTest}
              isLoading={testConnectivity.isPending}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Connectivity
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                isLoading={createConfig.isPending}
                disabled={!formData.name || (formData.type === 'local' ? !formData.path : !formData.s3_bucket)}
              >
                Add Storage
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfig}
        onClose={() => setDeleteConfig(null)}
        title="Delete Storage Configuration"
        description="Are you sure you want to delete this storage configuration?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You are about to delete: <strong>{deleteConfig?.name}</strong>
          </p>
          <Alert variant="warning">
            Existing snapshots stored at this location will not be deleted, but
            you won't be able to access them through this interface.
          </Alert>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfig(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteConfigMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

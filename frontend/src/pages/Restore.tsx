import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollections, useSnapshots, useRecoverSnapshot, useCreateJob } from '@/hooks/useApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Select,
  Alert,
  Badge,
} from '@/components/ui';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Link as LinkIcon,
  Archive,
  CheckCircle,
} from 'lucide-react';

type RestoreSource = 'url' | 'existing' | 'upload';
type RestorePriority = 'replica' | 'snapshot' | 'no_sync';

interface RestoreFormData {
  source: RestoreSource;
  collection: string;
  snapshotUrl: string;
  existingSnapshot: string;
  priority: RestorePriority;
  apiKey: string;
}

export function Restore() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RestoreFormData>({
    source: 'existing',
    collection: '',
    snapshotUrl: '',
    existingSnapshot: '',
    priority: 'snapshot',
    apiKey: '',
  });
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreComplete, setRestoreComplete] = useState(false);

  const { data: collectionsData } = useCollections();
  const { data: snapshotsData } = useSnapshots(formData.collection);
  const recoverSnapshot = useRecoverSnapshot(formData.collection);
  const createJob = useCreateJob();

  const collections = collectionsData?.result?.collections || [];
  const snapshots = snapshotsData?.result || [];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      // Create a restore job
      await createJob.mutateAsync({
        type: 'restore',
        collection_name: formData.collection,
        snapshot_name: formData.source === 'existing' ? formData.existingSnapshot : undefined,
        metadata: {
          source: formData.source,
          url: formData.source === 'url' ? formData.snapshotUrl : undefined,
          priority: formData.priority,
        },
      });

      // If using URL, trigger the actual recovery
      if (formData.source === 'url' || formData.source === 'existing') {
        const location =
          formData.source === 'url'
            ? formData.snapshotUrl
            : `/api/v1/collections/${formData.collection}/snapshots/${formData.existingSnapshot}`;

        await recoverSnapshot.mutateAsync({
          location,
          priority: formData.priority,
          api_key: formData.apiKey || undefined,
        });
      }

      setRestoreComplete(true);
    } catch (err) {
      console.error('Restore failed:', err);
    } finally {
      setIsRestoring(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.collection !== '';
      case 2:
        if (formData.source === 'url') {
          return formData.snapshotUrl !== '';
        }
        if (formData.source === 'existing') {
          return formData.existingSnapshot !== '';
        }
        return false;
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (restoreComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Restore Started Successfully
              </h2>
              <p className="text-gray-500 mb-8">
                Your restore job has been queued. You can monitor its progress in the Jobs page.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => navigate('/jobs')}>
                  View Jobs
                </Button>
                <Button onClick={() => navigate(`/collections/${formData.collection}`)}>
                  Go to Collection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restore Snapshot</h1>
          <p className="text-gray-500 mt-1">
            Recover a collection from a snapshot backup
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                s === step
                  ? 'bg-red-600 text-white'
                  : s < step
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s < step ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-20 h-1 mx-2 ${
                  s < step ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Collection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Target Collection</CardTitle>
            <CardDescription>
              Choose the collection where you want to restore the snapshot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection
              </label>
              <Select
                value={formData.collection}
                onChange={(e) =>
                  setFormData({ ...formData, collection: e.target.value, existingSnapshot: '' })
                }
              >
                <option value="">Select a collection</option>
                {collections.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <Alert variant="warning">
              Warning: Restoring a snapshot will overwrite the existing data in the
              collection. Make sure you have a backup if needed.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Source */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Snapshot Source</CardTitle>
            <CardDescription>
              Choose where to restore the snapshot from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Source Type Selection */}
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, source: 'existing' })}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  formData.source === 'existing'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Archive className="h-6 w-6 text-gray-600 mb-2" />
                <p className="font-medium">Existing Snapshot</p>
                <p className="text-sm text-gray-500">Use a snapshot from this collection</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, source: 'url' })}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  formData.source === 'url'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <LinkIcon className="h-6 w-6 text-gray-600 mb-2" />
                <p className="font-medium">From URL</p>
                <p className="text-sm text-gray-500">Restore from S3 or HTTP URL</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, source: 'upload' })}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  formData.source === 'upload'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled
              >
                <Upload className="h-6 w-6 text-gray-400 mb-2" />
                <p className="font-medium text-gray-400">Upload File</p>
                <p className="text-sm text-gray-400">Coming soon</p>
              </button>
            </div>

            {/* Source-specific inputs */}
            {formData.source === 'existing' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Snapshot
                </label>
                {snapshots.length === 0 ? (
                  <Alert variant="warning">
                    No snapshots available for this collection
                  </Alert>
                ) : (
                  <Select
                    value={formData.existingSnapshot}
                    onChange={(e) =>
                      setFormData({ ...formData, existingSnapshot: e.target.value })
                    }
                  >
                    <option value="">Select a snapshot</option>
                    {snapshots.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            )}

            {formData.source === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Snapshot URL
                  </label>
                  <Input
                    value={formData.snapshotUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, snapshotUrl: e.target.value })
                    }
                    placeholder="https://s3.amazonaws.com/bucket/snapshot.snapshot"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Supports S3, HTTP, or file:// URLs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key (Optional)
                  </label>
                  <Input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, apiKey: e.target.value })
                    }
                    placeholder="Enter API key if required"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Restore</CardTitle>
            <CardDescription>
              Review your restore settings before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Collection</span>
                <span className="font-medium">{formData.collection}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Source</span>
                <Badge>
                  {formData.source === 'existing' ? 'Existing Snapshot' : 'URL'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {formData.source === 'existing' ? 'Snapshot' : 'URL'}
                </span>
                <span className="font-mono text-sm">
                  {formData.source === 'existing'
                    ? formData.existingSnapshot
                    : formData.snapshotUrl.substring(0, 40) + '...'}
                </span>
              </div>
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recovery Priority
              </label>
              <Select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as RestorePriority,
                  })
                }
              >
                <option value="snapshot">Snapshot (Recommended)</option>
                <option value="replica">Replica</option>
                <option value="no_sync">No Sync</option>
              </Select>
              <p className="mt-1 text-sm text-gray-500">
                Controls how conflicts are resolved during recovery
              </p>
            </div>

            <Alert variant="warning">
              This action will overwrite data in the "{formData.collection}" collection.
              This cannot be undone.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {step < 3 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleRestore}
            isLoading={isRestoring}
            disabled={!canProceed()}
          >
            Start Restore
          </Button>
        )}
      </div>
    </div>
  );
}

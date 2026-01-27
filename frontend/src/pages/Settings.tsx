import { useState } from 'react';
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
} from '@/components/ui';
import { Save, RefreshCw, Server } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState({
    qdrantUrl: 'http://localhost:6333',
    apiKey: '',
    refreshInterval: '5000',
    maxConcurrentJobs: '3',
    retentionDays: '30',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In real implementation, this would save to backend
    localStorage.setItem('qdrant-backup-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Configure application settings and preferences
        </p>
      </div>

      {saved && (
        <Alert variant="success">
          Settings saved successfully!
        </Alert>
      )}

      {/* Qdrant Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-gray-500" />
            <CardTitle>Qdrant Connection</CardTitle>
          </div>
          <CardDescription>
            Configure the connection to your Qdrant cluster
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qdrant URL
            </label>
            <Input
              value={settings.qdrantUrl}
              onChange={(e) =>
                setSettings({ ...settings, qdrantUrl: e.target.value })
              }
              placeholder="http://localhost:6333"
            />
            <p className="mt-1 text-sm text-gray-500">
              The URL of your Qdrant instance or cluster load balancer
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key (Optional)
            </label>
            <Input
              type="password"
              value={settings.apiKey}
              onChange={(e) =>
                setSettings({ ...settings, apiKey: e.target.value })
              }
              placeholder="Enter API key if authentication is enabled"
            />
            <p className="mt-1 text-sm text-gray-500">
              Required if your Qdrant cluster has authentication enabled
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Application Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-gray-500" />
            <CardTitle>Application Settings</CardTitle>
          </div>
          <CardDescription>
            Configure application behavior and defaults
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dashboard Refresh Interval
            </label>
            <Select
              value={settings.refreshInterval}
              onChange={(e) =>
                setSettings({ ...settings, refreshInterval: e.target.value })
              }
            >
              <option value="1000">1 second</option>
              <option value="5000">5 seconds</option>
              <option value="10000">10 seconds</option>
              <option value="30000">30 seconds</option>
              <option value="60000">1 minute</option>
            </Select>
            <p className="mt-1 text-sm text-gray-500">
              How often the dashboard should refresh cluster status
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Concurrent Jobs
            </label>
            <Select
              value={settings.maxConcurrentJobs}
              onChange={(e) =>
                setSettings({ ...settings, maxConcurrentJobs: e.target.value })
              }
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="10">10</option>
            </Select>
            <p className="mt-1 text-sm text-gray-500">
              Maximum number of backup/restore jobs that can run simultaneously
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Retention Period (Days)
            </label>
            <Input
              type="number"
              value={settings.retentionDays}
              onChange={(e) =>
                setSettings({ ...settings, retentionDays: e.target.value })
              }
              min="1"
              max="365"
            />
            <p className="mt-1 text-sm text-gray-500">
              Default number of days to retain snapshots before automatic cleanup
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}

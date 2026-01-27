import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCollections } from '@/hooks/useApi';
import {
  Card,
  CardContent,
  Input,
  Badge,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ui';
import { Database, Search, ArrowRight } from 'lucide-react';

export function Collections() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, error, refetch } = useCollections();

  if (isLoading) {
    return <LoadingState message="Loading collections..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load collections"
        message="Could not fetch collections from Qdrant"
        onRetry={() => refetch()}
      />
    );
  }

  const collections = data?.result?.collections || [];
  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-500 mt-1">
            Manage your Qdrant vector collections
          </p>
        </div>
        <Badge variant="info">{collections.length} collections</Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search collections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Collections Grid */}
      {filteredCollections.length === 0 ? (
        <EmptyState
          title="No collections found"
          message={
            searchQuery
              ? `No collections matching "${searchQuery}"`
              : 'No collections available in this cluster'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <CollectionCard key={collection.name} name={collection.name} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionCard({ name }: { name: string }) {
  return (
    <Link to={`/collections/${name}`}>
      <Card className="hover:border-red-300 hover:shadow-md transition-all cursor-pointer h-full">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{name}</h3>
                <p className="text-sm text-gray-500 mt-1">Click to view details</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

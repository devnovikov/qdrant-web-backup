import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Collections } from '@/pages/Collections';
import { CollectionDetail } from '@/pages/CollectionDetail';
import { Snapshots } from '@/pages/Snapshots';
import { Jobs } from '@/pages/Jobs';
import { Storage } from '@/pages/Storage';
import { Settings } from '@/pages/Settings';
import { Restore } from '@/pages/Restore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="collections" element={<Collections />} />
            <Route path="collections/:name" element={<CollectionDetail />} />
            <Route path="snapshots" element={<Snapshots />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="storage" element={<Storage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="restore" element={<Restore />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

async function enableMocking() {
  // Check if mocks are enabled via environment variable
  // VITE_MOCK_ENABLED=true enables mocks, any other value disables them
  const mockEnabled = import.meta.env.VITE_MOCK_ENABLED === 'true';

  // Skip mocks in production OR when MOCK_ENABLED is not true
  if (import.meta.env.PROD || !mockEnabled) {
    if (!import.meta.env.PROD && !mockEnabled) {
      console.log('[MSW] Mocking disabled. Using real backend.');
    }
    return;
  }

  const { worker } = await import('./mocks/browser');

  // Start the worker with onUnhandledRequest: 'bypass' to allow other requests
  return worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});

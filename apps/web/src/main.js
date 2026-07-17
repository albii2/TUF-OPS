import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './styles.css';
import { ToastProvider } from './components/toast';
import { ToastHost } from './components/ToastHost';
import { runV085DataCleanup } from './services/v085DataCleanup';
const useHashRouter = window.location.protocol === 'file:';
const Router = useHashRouter ? HashRouter : BrowserRouter;
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
        },
    },
});
runV085DataCleanup();
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <App />
        </Router>
        <ToastHost />
      </ToastProvider>
      <ReactQueryDevtools initialIsOpen={false}/>
    </QueryClientProvider>
  </React.StrictMode>);
// Service worker disabled — caused stale cache issues on production deployments
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js').catch(() => undefined);
//   });
// }
const launchScreen = document.getElementById('launch-screen');
if (launchScreen) {
    window.setTimeout(() => launchScreen.remove(), 700);
}
//# sourceMappingURL=main.js.map
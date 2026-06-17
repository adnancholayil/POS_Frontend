import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import store from './app/store.js';
import './index.css';
import { pingBackend } from './api/axiosInstance'; // <-- New import to wake backend

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Wake the backend as soon as the app mounts. This runs only once.
const AppWrapper = () => {
  useEffect(() => {
    pingBackend();
  }, []);
  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppWrapper />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);

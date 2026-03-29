import './theme.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/SharedUI';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <ErrorBoundary>
        <ToastProvider>
            <App />
        </ToastProvider>
    </ErrorBoundary>
);

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { Button } from '../ui/Button';

interface PageErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

const PageErrorFallback: React.FC<PageErrorFallbackProps> = ({ error, onReset }) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg w-full text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Error</h1>
        <p className="text-gray-600 mb-6">
          {error?.message || 'This page encountered an unexpected error.'}
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={onReset} variant="primary" className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="inline-flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export const PageErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={undefined}
    >
      {children}
    </ErrorBoundary>
  );
};

export default PageErrorBoundary;

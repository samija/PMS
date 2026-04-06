import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
  title?: string;
  message?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onReset,
  title = 'Something went wrong',
  message,
}) => {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-6">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">
          {message || error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {onReset && (
          <Button onClick={onReset} variant="primary" className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </Card>
    </div>
  );
};

export default ErrorFallback;

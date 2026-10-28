import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ message = 'Something went wrong. Please try again.', onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
      <p className="text-gray-600 mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

import { formatDistanceToNow } from 'date-fns';
import {
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Bell
} from 'lucide-react';
import { Notification } from '../../types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  payment_due: Clock,
  payment_overdue: AlertCircle,
  payment_received: CreditCard,
  payment_approved: CheckCircle,
  payment_rejected: XCircle,
  lease_expiring: AlertCircle,
  system: Bell,
};

const typeColors: Record<string, string> = {
  payment_due: 'text-yellow-500 bg-yellow-50',
  payment_overdue: 'text-red-500 bg-red-50',
  payment_received: 'text-green-500 bg-green-50',
  payment_approved: 'text-green-500 bg-green-50',
  payment_rejected: 'text-red-500 bg-red-50',
  lease_expiring: 'text-orange-500 bg-orange-50',
  system: 'text-blue-500 bg-blue-50',
};

const priorityBorder: Record<string, string> = {
  low: '',
  normal: '',
  high: 'border-l-4 border-l-yellow-400',
  urgent: 'border-l-4 border-l-red-500',
};

export default function NotificationItem({ notification, onMarkAsRead, onClick }: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || 'text-gray-500 bg-gray-50';
  const borderClass = priorityBorder[notification.priority] || '';

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }
    if (onClick) {
      onClick(notification);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${borderClass} ${
        notification.isRead ? 'bg-white' : 'bg-blue-50/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-medium truncate ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className={`text-sm mt-0.5 line-clamp-2 ${notification.isRead ? 'text-gray-500' : 'text-gray-600'}`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wrench, FileText, Bell, Phone, MessageSquare } from 'lucide-react';
import { Card } from '../ui/Card';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  description: string;
}

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      label: 'Pay Rent',
      icon: <CreditCard className="h-6 w-6" />,
      path: '/tenant/payments',
      color: 'bg-green-100 text-green-600',
      description: 'Make a payment',
    },
    {
      label: 'Maintenance',
      icon: <Wrench className="h-6 w-6" />,
      path: '/tenant/maintenance',
      color: 'bg-blue-100 text-blue-600',
      description: 'Submit a request',
    },
    {
      label: 'My Lease',
      icon: <FileText className="h-6 w-6" />,
      path: '/tenant/lease',
      color: 'bg-purple-100 text-purple-600',
      description: 'View lease details',
    },
    {
      label: 'Notifications',
      icon: <Bell className="h-6 w-6" />,
      path: '/tenant/notifications',
      color: 'bg-yellow-100 text-yellow-600',
      description: 'View notifications',
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
          >
            <div className={`p-3 rounded-full ${action.color}`}>
              {action.icon}
            </div>
            <span className="text-sm font-medium text-gray-900">{action.label}</span>
            <span className="text-xs text-gray-500">{action.description}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;

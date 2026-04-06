import { Link } from 'react-router-dom';
import { Plus, UserCheck, BarChart3 } from 'lucide-react';

const actions = [
  { label: 'Add Property', icon: Plus, to: '/owner/properties' },
  { label: 'Add Employee', icon: UserCheck, to: '/owner/employees' },
  { label: 'View Reports', icon: BarChart3, to: '/owner/payments' },
];

export default function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.to}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all duration-200"
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </Link>
      ))}
    </div>
  );
}

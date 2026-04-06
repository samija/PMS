import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import type { MaintenanceRequest } from '../../types';

interface MaintenanceTimelineProps {
  timeline: MaintenanceRequest['timeline'];
}

const statusColors: Record<string, string> = {
  submitted: 'bg-gray-400',
  acknowledged: 'bg-blue-400',
  assigned: 'bg-purple-400',
  in_progress: 'bg-yellow-400',
  completed: 'bg-green-400',
  cancelled: 'bg-red-400',
};

export const MaintenanceTimeline: React.FC<MaintenanceTimelineProps> = ({ timeline }) => {
  if (!timeline?.length) {
    return <p className="text-sm text-gray-500">No timeline entries yet.</p>;
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {timeline.map((entry, idx) => (
          <li key={idx}>
            <div className="relative pb-8">
              {idx < timeline.length - 1 && (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${statusColors[entry.status] || 'bg-gray-400'}`}
                  >
                    {entry.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <Clock className="h-4 w-4 text-white" />
                    )}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-900 capitalize">
                      {entry.status.replace('_', ' ')}
                    </p>
                    {entry.note && (
                      <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>
                    )}
                    {entry.updatedBy && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        by {typeof entry.updatedBy === 'object' ? entry.updatedBy.name : 'Staff'}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MaintenanceTimeline;

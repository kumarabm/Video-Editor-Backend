import React from 'react';

interface Job {
  id: number;
  videoId: number;
  type?: string;
  status: string;
  createdAt: string;
  progress?: number;
}

interface JobsListProps {
  jobs: Job[];
  onViewJob: (id: number) => void;
}

const JobsList: React.FC<JobsListProps> = ({ jobs, onViewJob }) => {
  // Format relative time (e.g., "10 min ago")
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getOperationIcon = (type: string | undefined) => {
    switch (type) {
      case 'trim': return 'content_cut';
      case 'subtitles': return 'subtitles';
      case 'render': return 'motion_photos_on';
      default: return 'videocam';
    }
  };

  const getOperationText = (type: string | undefined) => {
    switch (type) {
      case 'trim': return 'Trim';
      case 'subtitles': return 'Add Subtitles';
      case 'render': return 'Render';
      default: return 'Unknown';
    }
  };

  const getOperationColor = (type: string | undefined) => {
    switch (type) {
      case 'trim': return 'yellow';
      case 'subtitles': return 'purple';
      case 'render': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusElement = (status: string, progress?: number) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completed
        </span>
      );
    } else if (status === 'processing') {
      return (
        <span className="inline-flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs">Processing ({progress || 0}%)</span>
        </span>
      );
    } else if (status === 'failed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Failed
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h3 className="font-medium text-neutral-800">Recent Jobs</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Video</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Operation</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Started</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-neutral-500">
                  No recent jobs
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={`${job.type || 'render'}_${job.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">#{job.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">Video #{job.videoId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getOperationColor(job.type)}-100 text-${getOperationColor(job.type)}-800`}>
                      <span className="material-icons text-xs mr-1">{getOperationIcon(job.type)}</span>
                      {getOperationText(job.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusElement(job.status, job.progress)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {getRelativeTime(job.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-primary hover:text-primary-dark"
                      onClick={() => onViewJob(job.id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 text-right">
        <button className="text-sm text-primary hover:text-primary-dark font-medium">View All Jobs</button>
      </div>
    </div>
  );
};

export default JobsList;

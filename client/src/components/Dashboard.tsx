import React, { useState } from 'react';
import StatusCard from './StatusCard';
import JobsList from './JobsList';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';

interface DashboardStats {
  apiStatus: string;
  activeRenders: number;
  totalVideos: number;
  storageUsed: string;
  recentJobs: {
    id: number;
    videoId: number;
    type?: string;
    status: string;
    createdAt: string;
    progress?: number;
  }[];
}

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  
  const { data: stats, isLoading, error, refetch } = useQuery<{ success: boolean, data: DashboardStats }>({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Dashboard data has been refreshed",
    });
  };

  const handleRunTest = () => {
    toast({
      title: "Test Started",
      description: "API test has been initiated",
      variant: "default",
    });
  };

  const handleViewJob = (id: number) => {
    toast({
      title: "Job Details",
      description: `Viewing details for job #${id}`,
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-red-500">Error loading dashboard data: {(error as Error).message}</p>
        <button 
          className="mt-2 bg-red-100 text-red-700 py-1 px-3 rounded text-sm"
          onClick={() => refetch()}
        >
          Try Again
        </button>
      </div>
    );
  }

  const dashboardData = stats?.data || {
    apiStatus: 'Unknown',
    activeRenders: 0,
    totalVideos: 0,
    storageUsed: '0',
    recentJobs: []
  };

  return (
    <section id="dashboard" className="mb-10 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-800 mb-2 md:mb-0">Dashboard</h2>
        <div className="flex space-x-2">
          <button 
            className="bg-white border border-neutral-300 rounded px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center"
            onClick={handleRefresh}
          >
            <span className="material-icons text-sm mr-1">refresh</span>
            Refresh
          </button>
          <button 
            className="bg-primary text-white rounded px-3 py-1.5 text-sm hover:bg-primary-dark flex items-center"
            onClick={handleRunTest}
          >
            <span className="material-icons text-sm mr-1">terminal</span>
            Run Test
          </button>
        </div>
      </div>

      {/* API Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatusCard
          title="API Status"
          value={dashboardData.apiStatus}
          icon="check_circle"
          iconColor="success"
          subtext="Last checked: 2 mins ago"
        />

        <StatusCard
          title="Active Renders"
          value={dashboardData.activeRenders}
          icon="sync"
          iconColor="info"
          subtext={`Est. completion: ${dashboardData.activeRenders > 0 ? '4 mins' : 'N/A'}`}
        />

        <StatusCard
          title="Total Videos"
          value={dashboardData.totalVideos}
          icon="videocam"
          iconColor="neutral-400"
          subtext={`${Math.min(dashboardData.totalVideos, 7)} uploaded today`}
        />

        <StatusCard
          title="Storage Used"
          value={`${dashboardData.storageUsed} GB`}
          icon="storage"
          iconColor="warning"
          subtext="5GB limit"
        />
      </div>

      {/* Recent Jobs */}
      <JobsList 
        jobs={dashboardData.recentJobs} 
        onViewJob={handleViewJob} 
      />

      {/* API Usage */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="font-medium text-neutral-800">API Usage</h3>
        </div>
        <div className="p-6">
          <div className="h-64 bg-neutral-50 rounded-lg flex items-center justify-center">
            <p className="text-neutral-500">API usage statistics displayed here</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;

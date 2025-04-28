import React from 'react';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor: string;
  subtext: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, value, icon, iconColor, subtext }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
        <span className={`material-icons text-${iconColor}`}>{icon}</span>
      </div>
      <p className="text-2xl font-medium text-neutral-800">{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{subtext}</p>
    </div>
  );
};

export default StatusCard;

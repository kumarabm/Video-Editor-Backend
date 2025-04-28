import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-primary shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="material-icons text-white">video_settings</span>
          <h1 className="text-white text-xl font-medium">Video Editing API</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center bg-primary-dark rounded-full px-3 py-1">
            <span className="material-icons text-green-400 text-sm mr-1">circle</span>
            <span className="text-white text-sm">API Online</span>
          </div>
          <button className="text-white hover:text-neutral-200 flex items-center">
            <span className="material-icons mr-1">person</span>
            <span className="hidden md:inline">Developer</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

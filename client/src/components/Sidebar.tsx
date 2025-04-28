import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const [openSection, setOpenSection] = useState('dashboard');

  return (
    <aside className="w-full md:w-64 bg-white shadow-md md:min-h-screen">
      <nav className="p-4">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">General</h3>
          <ul className="space-y-1">
            <li>
              <Link href="/">
                <a className={`flex items-center px-3 py-2 text-neutral-700 rounded hover:bg-neutral-100 hover:text-primary ${location === '/' ? 'bg-neutral-100 text-primary' : ''}`}>
                  <span className="material-icons mr-3 text-lg">dashboard</span>
                  <span>Dashboard</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/documentation">
                <a className={`flex items-center px-3 py-2 text-neutral-700 rounded hover:bg-neutral-100 hover:text-primary ${location === '/documentation' ? 'bg-neutral-100 text-primary' : ''}`}>
                  <span className="material-icons mr-3 text-lg">description</span>
                  <span>Documentation</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">API Endpoints</h3>
          <ul className="space-y-1">
            <li>
              <Link href="/upload">
                <a className={`flex items-center px-3 py-2 text-neutral-700 rounded hover:bg-neutral-100 hover:text-primary ${location === '/upload' ? 'bg-neutral-100 text-primary' : ''}`}>
                  <span className="material-icons mr-3 text-lg">cloud_upload</span>
                  <span>Upload</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/trim">
                <a className={`flex items-center px-3 py-2 text-neutral-700 rounded hover:bg-neutral-100 hover:text-primary ${location === '/trim' ? 'bg-neutral-100 text-primary' : ''}`}>
                  <span className="material-icons mr-3 text-lg">content_cut</span>
                  <span>Trim</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/subtitles">
                <a className={`flex items-center px-3 py-2 text-neutral-700 rounded hover:bg-neutral-100 hover:text-primary ${location === '/subtitles' ? 'bg-neutral-100 text-primary' : ''}`}>
                  <span className="material-icons mr-3 text-lg">subtitles</span>
                  <span>Subtitles</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/render">
                <a className={`flex items-center px-3 py-2 text-neutral-700 rounded hover:bg-neutral-100 hover:text-primary ${location === '/render' ? 'bg-neutral-100 text-primary' : ''}`}>
                  <span className="material-icons mr-3 text-lg">motion_photos_on</span>
                  <span>Render</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/download">
                <a className={`flex items-center px-3 py-2 text-neutral-700 rounded hover:bg-neutral-100 hover:text-primary ${location === '/download' ? 'bg-neutral-100 text-primary' : ''}`}>
                  <span className="material-icons mr-3 text-lg">cloud_download</span>
                  <span>Download</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Developer</h3>
          <ul className="space-y-1">
            <li>
              <Link href="/api-keys">
                <a className={`flex items-center px-3 py-2 text-neutral-700 rounded hover:bg-neutral-100 hover:text-primary ${location === '/api-keys' ? 'bg-neutral-100 text-primary' : ''}`}>
                  <span className="material-icons mr-3 text-lg">vpn_key</span>
                  <span>API Keys</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/logs">
                <a className={`flex items-center px-3 py-2 text-neutral-700 rounded hover:bg-neutral-100 hover:text-primary ${location === '/logs' ? 'bg-neutral-100 text-primary' : ''}`}>
                  <span className="material-icons mr-3 text-lg">receipt_long</span>
                  <span>Logs</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/settings">
                <a className={`flex items-center px-3 py-2 text-neutral-700 rounded hover:bg-neutral-100 hover:text-primary ${location === '/settings' ? 'bg-neutral-100 text-primary' : ''}`}>
                  <span className="material-icons mr-3 text-lg">settings</span>
                  <span>Settings</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

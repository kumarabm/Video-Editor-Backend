import React from 'react';

interface ApiEndpointProps {
  id: string;
  title: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  icon: string;
  endpoint: string;
  description: string;
  requestFormat: string;
  responseFormat: string;
  implementationNotes: string[];
  onTryOut: () => void;
}

const ApiEndpoint: React.FC<ApiEndpointProps> = ({
  id,
  title,
  method,
  icon,
  endpoint,
  description,
  requestFormat,
  responseFormat,
  implementationNotes,
  onTryOut
}) => {
  return (
    <div id={id} className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
      <div className="bg-primary px-6 py-4 flex items-center justify-between">
        <h3 className="text-white font-medium flex items-center">
          <span className="material-icons mr-2">{icon}</span>
          {title}
        </h3>
        <span className="text-white bg-primary-dark rounded-full text-xs px-2 py-1">{method}</span>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <h4 className="text-lg font-medium mb-2">Endpoint URL</h4>
          <div className="code-block bg-neutral-100 text-neutral-800">
            <code>{method} {endpoint}</code>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-lg font-medium mb-2">Description</h4>
          <p className="text-neutral-700">{description}</p>
        </div>
        
        <div className="mb-4">
          <h4 className="text-lg font-medium mb-2">Request Format</h4>
          <div className="code-block bg-neutral-100 text-neutral-800">
            <pre>{requestFormat}</pre>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="text-lg font-medium mb-2">Response Format</h4>
          <div className="code-block bg-neutral-100 text-neutral-800">
            <pre>{responseFormat}</pre>
          </div>
        </div>
        
        <div className="bg-neutral-50 p-4 rounded-lg">
          <h4 className="text-md font-medium mb-2 flex items-center">
            <span className="material-icons text-warning mr-2">tips_and_updates</span>
            Implementation Notes
          </h4>
          <ul className="list-disc pl-5 text-sm text-neutral-700">
            {implementationNotes.map((note, index) => (
              <li key={index} className="mb-1">{note}</li>
            ))}
          </ul>
        </div>
        
        <div className="mt-6 border-t border-neutral-200 pt-4 flex justify-end">
          <button 
            className="bg-primary text-white rounded px-4 py-2 text-sm hover:bg-primary-dark"
            onClick={onTryOut}
          >
            Try it out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiEndpoint;

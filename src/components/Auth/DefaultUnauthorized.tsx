import React from 'react';

const DefaultUnauthorized: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V9a4 4 0 00-8 0v2m8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
      <p className="text-sm text-gray-500">You don&apos;t have permission to view this content.</p>
    </div>
  </div>
);

export default DefaultUnauthorized;

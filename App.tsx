// This file is deprecated and no longer in use.
// The main application component is located at /src/App.tsx.
// This file can be safely deleted.

import React from 'react';

const DeprecatedApp: React.FC = () => (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#f0f0f0', color: '#333', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div>
            <h1>Application Error</h1>
            <p>This component (<code>/App.tsx</code>) is deprecated. The application entry point has been moved to <code>/src/App.tsx</code>.</p>
            <p>Please delete this file and ensure <code>/index.tsx</code> is importing from the correct path.</p>
        </div>
    </div>
);

export default DeprecatedApp;

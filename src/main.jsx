// Root mount. Agentation (dev-only) is the on-page annotation toolbar; pair with agentation-mcp for agent sync.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Agentation } from 'agentation';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    {import.meta.env.DEV && <Agentation />}
  </React.StrictMode>
);

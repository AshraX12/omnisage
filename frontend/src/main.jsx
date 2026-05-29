/**
 * Main Frontend Entrypoint.
 * 
 * Boots the React application, strict-mode wraps the core App component,
 * and mounts it inside the HTML5 document root placeholder.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

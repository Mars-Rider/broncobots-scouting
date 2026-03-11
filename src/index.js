import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';
import MonitorPage from './pages/MonitorPage';

// Check URL before rendering to determine which component to show
const isMonitorPage = window.location.pathname === '/monitor';

const root = ReactDOM.createRoot(document.getElementById('root'));

if (isMonitorPage) {
  // Render monitor page directly without App (bypasses auth)
  root.render(
    <React.StrictMode>
      <MonitorPage />
    </React.StrictMode>
  );
} else {
  root.render(<React.StrictMode><App /></React.StrictMode>);
}

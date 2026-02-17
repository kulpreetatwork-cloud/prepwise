import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#16162A',
            color: '#F1F5F9',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#F1F5F9' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#F1F5F9' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import App from './App';
import AppTest from './App.test';
import { ContextProvider } from './contexts/ContextProvider';

// Cambiar entre App y AppTest para debugging
const USE_TEST = false;

ReactDOM.render(
  <React.StrictMode>
    {USE_TEST ? (
      <AppTest />
    ) : (
      <ContextProvider>
        <App />
      </ContextProvider>
    )}
  </React.StrictMode>,
  document.getElementById('root'),
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.warn('SW registration failed:', err));
  });
}

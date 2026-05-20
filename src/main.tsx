import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress harmless sandbox/iframe-related errors globally
try {
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const msg = event.reason?.message || event.reason || '';
      if (typeof msg === 'string' && (msg.includes('serviceWorker') || msg.includes('sandbox') || event.reason?.name === 'SecurityError' || msg.includes('SecurityError'))) {
        event.preventDefault();
        event.stopPropagation();
      }
    } catch {}
  }, true);

  window.addEventListener('error', (event) => {
    try {
      const msg = event.message || '';
      if (typeof msg === 'string' && (msg.includes('serviceWorker') || msg.includes('sandbox') || msg.includes('Security'))) {
        event.preventDefault();
        event.stopPropagation();
      }
    } catch {}
  }, true);
} catch {}

// Register Service Worker for PWA
try {
  if (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    window.isSecureContext &&
    window.location.protocol === 'https:'
  ) {
    window.addEventListener('load', () => {
      try {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered successfully:', registration.scope);
          })
          .catch((error) => {
            console.warn('[PWA] Service Worker registration ignored/failed in this environment:', error);
          });
      } catch (e) {
        console.warn('[PWA] Service Worker registration bypassed inside load handler:', e);
      }
    });
  }
} catch (e) {
  console.warn('[PWA] Service Worker registration bypassed:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


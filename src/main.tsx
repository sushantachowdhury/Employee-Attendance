import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any legacy service workers on this origin to prevent iframe fetch conflicts
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const r of registrations) {
      r.unregister();
    }
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(<App />);

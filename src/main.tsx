import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { installAudioUnlock } from './audio';

installAudioUnlock();

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
// Offline support, where the browser and hosting allow it (not inside an embedded frame).
try { if ('serviceWorker' in navigator && window.top === window && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {}); } catch { /* embedded */ }

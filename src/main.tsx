import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (window.location.hash.includes('access_token=') && window.opener) {
  const hash = window.location.hash.substring(1);
  // OAuth2 implicit grant uses fragments where params are separated by &
  const params = new URLSearchParams(hash);
  const token = params.get('access_token');
  if (token) {
    window.opener.postMessage({ type: 'ONEDRIVE_TOKEN', token }, '*');
    window.close();
  }
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

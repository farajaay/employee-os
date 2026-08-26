import { startRouter } from './app/router';
import { mountShell } from './app/shell';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/safe-area.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root element');

const { host } = mountShell(root);
startRouter(root, host);

// M-10 registers the service worker here (via vite-plugin-pwa).
// M-23 initialises the secure session storage adapter before the Supabase client.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// base './' so the build works from any path (GitHub Pages, a file server, an embedded frame).
export default defineConfig({ base: './', plugins: [react()], build: { chunkSizeWarningLimit: 2500 } });

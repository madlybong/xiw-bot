import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

import packageJson from '../../package.json';

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        '__APP_VERSION__': JSON.stringify(packageJson.version)
    },
    plugins: [
        vue(),
        vuetify({ autoImport: true }),
    ],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/backend': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                timeout: 0,
                proxyTimeout: 0
            }
        }
    }
});

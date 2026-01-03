import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { resolve } from 'path';

import packageJson from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
    root: 'src/ui',
    define: {
        '__APP_VERSION__': JSON.stringify(packageJson.version)
    },
    plugins: [
        vue(),
        vuetify({ autoImport: true }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src/ui/src')
        }
    },
    build: {
        outDir: '../../dist',
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

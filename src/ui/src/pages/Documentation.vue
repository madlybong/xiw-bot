<script setup lang="ts">
import { ref } from 'vue';
import { clientLibraries } from '../data/sdk_examples';

const tab = ref('node'); // Default to Node for SDK view
const endpointTab = ref('curl');
const host = window.location.origin;

const endpoints = [
    {
        method: 'POST',
        url: '/api/wa/send/text/:instance_id',
        title: 'Send Text Message',
        desc: 'Send a plain text message to a specific phone number.',
        body: { to: '1234567890', message: 'Hello from API!' },
        curl: `curl -X POST ${host}/api/wa/send/text/1 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "1234567890", "message": "Hello World"}'`
    },
    {
        method: 'POST',
        url: '/api/wa/send/image/:instance_id',
        title: 'Send Media / Image',
        desc: 'Send an image with an optional caption.',
        body: { to: '1234567890', url: 'https://example.com/image.png', caption: 'Check this out' },
        curl: `curl -X POST ${host}/api/wa/send/image/1 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "1234567890", "url": "https://example.com/img.png", "caption": "Hi"}'`
    },
    {
        method: 'POST',
        url: '/api/wa/send/video/:instance_id',
        title: 'Send Video (MP4/GIF)',
        desc: 'Send a video. Set gifPlayback to true to play it like a GIF (loop, no sound).',
        body: { to: '1234567890', url: 'https://example.com/video.mp4', caption: 'Watch this', gifPlayback: false },
        curl: `curl -X POST ${host}/api/wa/send/video/1 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "1234567890", "url": "https://example.com/vid.mp4", "gifPlayback": false}'`
    },
    {
        method: 'POST',
        url: '/api/wa/send/audio/:instance_id',
        title: 'Send Audio / Voice Note',
        desc: 'Send an audio file. Set ptt to true to send as a Voice Note (waveform).',
        body: { to: '1234567890', url: 'https://example.com/audio.mp3', ptt: true },
        curl: `curl -X POST ${host}/api/wa/send/audio/1 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "1234567890", "url": "https://example.com/audio.mp3", "ptt": true}'`
    },
    {
        method: 'POST',
        url: '/api/wa/send/document/:instance_id',
        title: 'Send Document',
        desc: 'Send any file type (PDF, ZIP, DOCX).',
        body: { to: '1234567890', url: 'https://example.com/inv.pdf', filename: 'Invoice-001.pdf' },
        curl: `curl -X POST ${host}/api/wa/send/document/1 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "1234567890", "url": "https://example.com/file.pdf", "filename": "file.pdf"}'`
    },
    {
        method: 'POST',
        url: '/api/wa/send/location/:instance_id',
        title: 'Send Location',
        desc: 'Send coordinates.',
        body: { to: '1234567890', latitude: 25.1972, longitude: 55.2744, address: 'Burj Khalifa' },
        curl: `curl -X POST ${host}/api/wa/send/location/1 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "1234567890", "latitude": 25.1972, "longitude": 55.2744}'`
    },
    {
        method: 'POST',
        url: '/api/wa/send/template/:instance_id',
        title: 'Send Template',
        desc: 'Send a hydrated template with variables.',
        body: { to: '1234567890', templateName: 'otp_login', variables: ['1234', '5 mins'] },
        curl: `curl -X POST ${host}/api/wa/send/template/1 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "1234567890", "templateName": "otp_login", "variables": ["1234"]}'`
    }
];
</script>

<template>
    <v-container>
        <div class="mb-6 d-flex align-center justify-space-between flex-wrap gap-4">
            <div>
                <h1 class="text-h3 font-weight-bold text-primary mb-2">API Documentation</h1>
                <p class="text-subtitle-1 text-medium-emphasis">
                    Integrate WhatsApp automation into your apps with our unified API.
                </p>
            </div>
            <v-btn color="orange" prepend-icon="mdi-download" href="/xiw-bot.postman_collection.json"
                download="xiw-bot.postman_collection.json" target="_blank" variant="tonal">
                Download Postman Collection
            </v-btn>
        </div>

        <!-- SDK Section -->
        <v-card class="mb-10" border elevation="0">
            <v-card-title class="bg-surface-light font-weight-bold py-3">
                <v-icon color="secondary" class="mr-2">mdi-code-braces</v-icon>
                Client Libraries (Copy & Paste)
            </v-card-title>
            <v-card-text class="pa-0">
                <v-tabs v-model="tab" density="compact" color="secondary" class="border-b">
                    <v-tab value="node"><v-icon start>mdi-nodejs</v-icon>Node.js</v-tab>
                    <v-tab value="php"><v-icon start>mdi-language-php</v-icon>PHP</v-tab>
                    <v-tab value="vb"><v-icon start>mdi-dot-net</v-icon>VB.NET</v-tab>
                </v-tabs>
                <v-window v-model="tab">
                    <v-window-item value="node">
                        <v-code class="d-block pa-4 bg-grey-darken-4 text-body-2" style="white-space: pre-wrap; font-family: monospace; max-height: 400px; overflow-y: auto;">{{ clientLibraries.node }}</v-code>
                    </v-window-item>
                    <v-window-item value="php">
                        <v-code class="d-block pa-4 bg-grey-darken-4 text-body-2" style="white-space: pre-wrap; font-family: monospace; max-height: 400px; overflow-y: auto;">{{ clientLibraries.php }}</v-code>
                    </v-window-item>
                    <v-window-item value="vb">
                        <v-code class="d-block pa-4 bg-grey-darken-4 text-body-2" style="white-space: pre-wrap; font-family: monospace; max-height: 400px; overflow-y: auto;">{{ clientLibraries.vb }}</v-code>
                    </v-window-item>
                </v-window>
            </v-card-text>
        </v-card>

        <v-divider class="mb-8 border-opacity-25"></v-divider>

        <h2 class="text-h4 font-weight-bold mb-6">Endpoints Reference</h2>

        <!-- Endpoints -->
        <div v-for="(ep, i) in endpoints" :key="i" class="mb-8">
            <v-card border elevation="0">
                <div class="d-flex align-center px-4 py-3 bg-surface-light border-b">
                    <v-chip :color="ep.method === 'GET' ? 'blue' : 'green'" class="mr-3 font-weight-bold" size="small" label variant="flat">
                        {{ ep.method }}
                    </v-chip>
                    <code class="text-subtitle-1 font-weight-bold">{{ ep.url }}</code>
                </div>
                
                <v-card-text class="pa-4">
                    <p class="text-body-1 mb-4">{{ ep.desc }}</p>

                    <v-row>
                        <v-col cols="12" md="6">
                            <div class="text-caption font-weight-bold mb-2 text-medium-emphasis">EXAMPLE BODY</div>
                            <v-code class="d-block pa-3 rounded bg-grey-lighten-4 text-grey-darken-3 border" style="font-family: monospace;">
                                {{ JSON.stringify(ep.body, null, 2) }}
                            </v-code>
                        </v-col>
                        <v-col cols="12" md="6">
                            <div class="text-caption font-weight-bold mb-2 text-medium-emphasis">CURL</div>
                            <v-code class="d-block pa-3 rounded bg-grey-darken-3 text-green-lighten-2" style="white-space: pre-wrap; font-family: monospace; font-size: 0.85rem">
                                {{ ep.curl }}
                            </v-code>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </div>

        <v-alert type="info" variant="tonal" class="mt-8" border="start" border-color="info">
            <strong>Agent Access</strong><br>
            Agents cannot login to the dashboard. They must use the <strong>Static Token</strong> generated by the Admin to access the API.
        </v-alert>

    </v-container>
</template>

<style scoped>
pre { margin: 0; }
</style>

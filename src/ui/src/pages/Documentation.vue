<script setup lang="ts">
import { ref } from 'vue';

const tab = ref('curl');
const host = window.location.origin;

const endpoints = [
    {
        method: 'POST',
        url: '/api/wa/send/text/:instance_id',
        title: 'Send Text Message',
        desc: 'Send a plain text message to a specific phone number.',
        body: { to: '1234567890', message: 'Hello from API!' },
        code: {
            curl: `curl -X POST ${host}/api/wa/send/text/1 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "1234567890", "message": "Hello World"}'`,
            node: `const response = await fetch('${host}/api/wa/send/text/1', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        to: '1234567890',
        message: 'Hello World'
    })
});
const data = await response.json();`,
            php: `$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "${host}/api/wa/send/text/1");
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer YOUR_TOKEN",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "to" => "1234567890",
    "message" => "Hello World"
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);`,
            vb: `Dim client As New HttpClient()
client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_TOKEN")

Dim json As String = "{""to"": ""1234567890"", ""message"": ""Hello World""}"
Dim content As New StringContent(json, Encoding.UTF8, "application/json")

Dim response = Await client.PostAsync("${host}/api/wa/send/text/1", content)
Dim result = Await response.Content.ReadAsStringAsync()`
        }
    },
    {
        method: 'POST',
        url: '/api/wa/send/image/:instance_id',
        title: 'Send Media / Image',
        desc: 'Send an image with an optional caption.',
        body: { to: '1234567890', url: 'https://example.com/image.png', caption: 'Check this out' },
        code: {
            curl: `curl -X POST ${host}/api/wa/send/image/1 \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "1234567890", "url": "https://example.com/img.png", "caption": "Hi"}'`,
            node: `// using fetch
// ... same headers ...
body: JSON.stringify({
    to: '1234567890',
    url: 'https://example.com/image.png',
    caption: 'Cool Image'
})`,
            php: `// ... same setup ...
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "to" => "1234567890",
    "url" => "https://example.com/image.png",
    "caption" => "Cool Image"
]));`,
            vb: `Dim json As String = "{""to"": ""..."", ""url"": ""..."", ""caption"": ""...""}"
' ... send request ...`
        }
    }
];
</script>

<template>
  <v-container>
    <div class="mb-6 d-flex align-center justify-space-between flex-wrap gap-4">
        <div>
            <h1 class="text-h3 font-weight-bold text-primary mb-2">API Documentation</h1>
            <p class="text-subtitle-1 text-medium-emphasis">
                Integrate WhatsApp automation directly into your external applications.
            </p>
        </div>
        <v-btn
            color="orange"
            prepend-icon="mdi-download"
            href="/xiw-bot.postman_collection.json"
            download="xiw-bot.postman_collection.json"
            target="_blank" 
            variant="tonal"
        >
            Download Postman Collection
        </v-btn>
    </div>

    <!-- Workflow Section -->
    <v-card class="mb-8" border>
        <v-card-title class="font-weight-bold">
            <v-icon color="primary" class="mr-2">mdi-sitemap</v-icon>
            Integration Workflow
        </v-card-title>
        <v-card-text>
            <v-timeline density="compact" align="start">
                <v-timeline-item dot-color="primary" size="x-small">
                    <div class="mb-2"><strong>1. Generate API Token</strong></div>
                    <div class="text-caption">
                        Go to the <strong>Users</strong> section in the dashboard and generate a scoped API Token for your application.
                        Each token is linked to specific permissions.
                    </div>
                </v-timeline-item>

                <v-timeline-item dot-color="secondary" size="x-small">
                    <div class="mb-2"><strong>2. Authenticate Requests</strong></div>
                    <div class="text-caption">
                        Include the token in the HTTP Header of every request:
                        <v-chip size="small" class="mt-1 font-weight-bold" label>Authorization: Bearer YOUR_TOKEN</v-chip>
                    </div>
                </v-timeline-item>

                <v-timeline-item dot-color="success" size="x-small">
                    <div class="mb-2"><strong>3. Send Messages</strong></div>
                    <div class="text-caption">
                        Use the <code>POST</code> endpoints exposed below to send text or media messages.
                        Ensure you use the correct <code>instance_id</code> assigned to your user account.
                    </div>
                </v-timeline-item>
            </v-timeline>
        </v-card-text>
    </v-card>

    <v-divider class="mb-8"></v-divider>

    <!-- Endpoints -->
    <div v-for="(ep, i) in endpoints" :key="i" class="mb-10">
        <div class="d-flex align-center mb-4">
            <v-chip :color="ep.method === 'GET' ? 'blue' : 'green'" class="mr-3 font-weight-bold" label>
                {{ ep.method }}
            </v-chip>
            <h2 class="text-h5 font-weight-medium">{{ ep.url }}</h2>
        </div>

        <p class="text-body-1 mb-4">{{ ep.desc }}</p>

        <v-card variant="flat" border class="bg-surface">
            <v-tabs v-model="tab" bg-color="surface-variant" density="compact">
                <v-tab value="curl">cURL</v-tab>
                <v-tab value="node">Node.js</v-tab>
                <v-tab value="php">PHP</v-tab>
                <v-tab value="vb">VB.NET</v-tab>
            </v-tabs>

            <v-card-text class="pa-0">
                <v-window v-model="tab">
                    <v-window-item value="curl">
                        <v-code class="d-block pa-4 bg-background" style="white-space: pre-wrap; font-family: monospace;">
                            {{ ep.code.curl }}
                        </v-code>
                    </v-window-item>
                    <v-window-item value="node">
                        <v-code class="d-block pa-4 bg-background" style="white-space: pre-wrap; font-family: monospace;">
                            {{ ep.code.node }}
                        </v-code>
                    </v-window-item>
                    <v-window-item value="php">
                        <v-code class="d-block pa-4 bg-background" style="white-space: pre-wrap; font-family: monospace;">
                            {{ ep.code.php }}
                        </v-code>
                    </v-window-item>
                    <v-window-item value="vb">
                        <v-code class="d-block pa-4 bg-background" style="white-space: pre-wrap; font-family: monospace;">
                            {{ ep.code.vb }}
                        </v-code>
                    </v-window-item>
                </v-window>
            </v-card-text>
        </v-card>
    </div>

    <v-alert type="info" variant="tonal" class="mt-8">
        <strong>Agent Access</strong><br>
        Agents cannot login to the dashboard. They must use the <strong>Static Token</strong> generated by the Admin to access the API.
    </v-alert>

  </v-container>
</template>

<style scoped>
pre { margin: 0; }
</style>

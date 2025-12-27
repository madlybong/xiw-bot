<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import QRCode from 'qrcode';

interface Instance {
    id: number;
    name: string;
    status: string;
    qr: string | null;
    user?: { id: string; name: string };
}

const instances = ref<Instance[]>([]);
const loading = ref(false);
const qrDialog = ref(false);
const selectedQr = ref('');
const selectedName = ref('');
const qrInstanceId = ref<number | null>(null);

// Terminal State
const logs = ref<{ time: string; level: string; msg: string }[]>([]);
const terminalDialog = ref(false);
let activeStream: { close: () => void } | null = null;
const terminalInstanceId = ref<number | null>(null);

// Fetch Data
const fetchStatus = async () => {
    loading.value = true;
    try {
        const res = await fetch('/backend/wa/status', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            instances.value = data.instances;

            // Auto-close QR dialog if connected
            if (qrDialog.value && qrInstanceId.value) {
                const updated = instances.value.find(i => i.id === qrInstanceId.value);
                if (updated && updated.status === 'connected') {
                    qrDialog.value = false;
                    qrInstanceId.value = null; // Reset
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
    loading.value = false;
};

// ... existing createInstance ...



const createDialog = ref(false);
const newInstanceName = ref('');

const createInstance = async () => {
    if (!newInstanceName.value) return;
    try {
        const res = await fetch('/backend/instances', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name: newInstanceName.value })
        });
        if (res.ok) {
            createDialog.value = false;
            newInstanceName.value = '';
            fetchStatus();
        }
    } catch (e) { console.error(e); }
};

const deleteInstance = async (id: number) => {
    if (!confirm('Delete this instance permanently?')) return;
    await fetch(`/backend/instances/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchStatus();
};

// Actions
const startInstance = async (id: number) => {
    try {
        const res = await fetch(`/backend/wa/start/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) {
            const data = await res.json();
            alert(`Error: ${data.error || 'Failed to start session'}`);
        } else {
            fetchStatus(); // Poll update
        }
    } catch (e) {
        alert('Connection timed out or failed. Please check logs.');
        console.error(e);
    }
};

const stopInstance = async (id: number) => {
    await fetch(`/backend/wa/logout/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchStatus();
};

const showQr = async (qr: string, name: string, id: number) => {
    if (!qr) return;
    try {
        selectedQr.value = await QRCode.toDataURL(qr);
        selectedName.value = name;
        qrInstanceId.value = id;
        qrDialog.value = true;
    } catch (e) {
        console.error(e);
    }
};

const openTerminal = (id: number, name: string) => {
    if (activeStream) activeStream.close();
    logs.value = [];
    selectedName.value = name;
    terminalInstanceId.value = id;
    terminalDialog.value = true;

    const es = new EventSource(`/backend/logs/${id}/stream?token=${localStorage.getItem('token')}`);

    es.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            const date = new Date(Number(event.lastEventId));
            logs.value.push({
                time: date.toLocaleTimeString(),
                level: (data.level || 30) >= 50 ? 'ERROR' : (data.level >= 40 ? 'WARN' : 'INFO'),
                msg: data.msg || JSON.stringify(data)
            });
            // Auto-scroll logic
            const el = document.getElementById('terminal-window');
            if (el) el.scrollTop = el.scrollHeight;
        } catch (e) { }
    };

    // Handle error/close?
    es.onerror = () => {
        // Maybe reconnect or show error? For now, silence.
    };

    activeStream = es;
};

const closeTerminal = () => {
    if (activeStream) activeStream.close();
    activeStream = null;
    terminalDialog.value = false;
};

onMounted(() => {
    fetchStatus();
    // Poll every 5s
    const timer = setInterval(fetchStatus, 5000);
    // return cleanup? No, onUnmounted is better for component lifecycle
});

onUnmounted(() => {
    if (activeStream) activeStream.close();
});

const getStatusColor = (status: string) => {
    switch (status) {
        case 'connected': return 'success';
        case 'connecting': return 'warning';
        default: return 'error';
    }
}
</script>

<template>
    <v-container>
        <div class="d-flex align-center mb-6">
            <h1 class="text-h4 font-weight-bold">Dashboard</h1>
            <v-spacer></v-spacer>
            <v-btn color="primary" class="mr-2" prepend-icon="mdi-plus" @click="createDialog = true">Add
                Instance</v-btn>
            <v-btn prepend-icon="mdi-refresh" @click="fetchStatus" :loading="loading">Refresh</v-btn>
        </div>

        <v-row>
            <v-col v-for="inst in instances" :key="inst.id" cols="12" md="6" lg="4">
                <v-card class="h-100 pa-2 d-flex flex-column" border>
                    <v-card-item>
                        <template v-slot:prepend>
                            <v-avatar color="primary" variant="tonal" class="rounded-lg">
                                <v-icon icon="mdi-whatsapp"></v-icon>
                            </v-avatar>
                        </template>
                        <template v-slot:append>
                            <v-btn icon="mdi-delete" variant="text" size="small" color="error"
                                @click="deleteInstance(inst.id)"></v-btn>
                        </template>
                        <v-card-title class="font-weight-bold">{{ inst.name }}</v-card-title>
                        <v-card-subtitle class="mt-1">
                            <v-chip size="x-small" :color="getStatusColor(inst.status)"
                                class="text-uppercase font-weight-bold" label variant="flat">
                                <v-icon start size="x-small" icon="mdi-circle-medium"></v-icon>
                                {{ inst.status }}
                            </v-chip>
                        </v-card-subtitle>
                    </v-card-item>

                    <v-card-text class="flex-grow-1">
                        <div v-if="inst.user" class="d-flex align-center mt-4 pa-3 bg-surface-variant rounded-lg">
                            <v-icon size="small" class="mr-2" color="success">mdi-account-check</v-icon>
                            <div>
                                <div class="text-body-2 font-weight-bold">{{ inst.user.name }}</div>
                                <div class="text-caption text-medium-emphasis">{{ inst.user.id }}</div>
                            </div>
                        </div>
                        <div v-else
                            class="text-caption text-medium-emphasis mt-4 pa-3 text-center border-dashed rounded-lg">
                            Session Disconnected
                        </div>
                    </v-card-text>

                    <v-card-actions class="justify-end px-4 pb-4">
                        <div class="d-flex flex-wrap gap-2 justify-end w-100">
                            <v-btn variant="text" size="small" prepend-icon="mdi-console"
                                @click="openTerminal(inst.id, inst.name)">
                                Terminal
                            </v-btn>

                            <v-btn v-if="inst.status !== 'connected'" variant="flat" color="success" size="small"
                                @click="startInstance(inst.id)">
                                Start
                            </v-btn>

                            <v-btn v-if="inst.status === 'disconnected'" variant="text" color="warning" size="small"
                                @click="stopInstance(inst.id)">Reset</v-btn>

                            <v-btn v-if="inst.status === 'connecting' && inst.qr" variant="outlined" color="info"
                                size="small" prepend-icon="mdi-qrcode"
                                @click="showQr(inst.qr, inst.name, inst.id)">Scan</v-btn>

                            <v-btn v-if="inst.status === 'connected'" variant="tonal" color="error" size="small"
                                @click="stopInstance(inst.id)">Logout</v-btn>
                        </div>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <!-- QR Dialog -->
        <v-dialog v-model="qrDialog" width="auto">
            <v-card>
                <v-card-title class="text-center">Scan QR for {{ selectedName }}</v-card-title>
                <v-card-text class="text-center pa-4">
                    <img :src="selectedQr" alt="QR Code" style="width: 256px; height: 256px;" />
                </v-card-text>
                <v-card-actions>
                    <v-btn color="primary" block @click="qrDialog = false">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Create Dialog -->
        <v-dialog v-model="createDialog" max-width="400">
            <v-card>
                <v-card-title>Add New Instance</v-card-title>
                <v-card-text>
                    <v-text-field v-model="newInstanceName" label="Instance Name" variant="outlined" autofocus
                        @keyup.enter="createInstance"></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="createDialog = false">Cancel</v-btn>
                    <v-btn color="primary" @click="createInstance">Create</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Terminal Dialog -->
        <v-dialog v-model="terminalDialog" persistent max-width="800" width="100%">
            <v-card theme="dark" class="terminal-card">
                <v-card-title class="d-flex align-center py-2 px-4 bg-grey-darken-4">
                    <span class="text-caption font-weight-bold font-monospace text-medium-emphasis">>_ {{ selectedName
                    }}</span>
                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-close" size="x-small" variant="text" @click="closeTerminal"></v-btn>
                </v-card-title>
                <v-card-text class="pa-0">
                    <div id="terminal-window" class="terminal-window pa-4 font-monospace text-caption">
                        <div v-for="(log, i) in logs" :key="i" class="log-line">
                            <span class="text-grey-darken-1 mr-2">[{{ log.time }}]</span>
                            <span :class="{
                                'text-blue': log.level === 'INFO',
                                'text-yellow': log.level === 'WARN',
                                'text-red': log.level === 'ERROR'
                            }" class="font-weight-bold mr-2">{{ log.level }}</span>
                            <span class="text-grey-lighten-2">{{ log.msg }}</span>
                        </div>
                        <div v-if="logs.length === 0" class="text-grey-darken-2 text-center mt-4">
                            Waiting for logs...
                        </div>
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>

    </v-container>
</template>

<style scoped>
.terminal-card {
    border: 1px solid #333;
}

.terminal-window {
    background-color: #0d0d0f;
    /* Pitch black/very dark */
    height: 400px;
    overflow-y: auto;
    font-family: 'JetBrains Mono', monospace !important;
}

.log-line {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding: 2px 0;
}

.gap-2 {
    gap: 8px;
}

.w-100 {
    width: 100%;
}
</style>

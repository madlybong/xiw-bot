<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
        }
    } catch (e) {
        console.error(e);
    }
    loading.value = false;
};



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
    await fetch(`/backend/wa/start/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchStatus(); // Poll update
};

const stopInstance = async (id: number) => {
    await fetch(`/backend/wa/logout/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchStatus();
};

const showQr = async (qr: string, name: string) => {
    if (!qr) return;
    try {
        selectedQr.value = await QRCode.toDataURL(qr);
        selectedName.value = name;
        qrDialog.value = true;
    } catch (e) {
        console.error(e);
    }
};

onMounted(() => {
    fetchStatus();
    // Poll every 5s
    const timer = setInterval(fetchStatus, 5000);
    return () => clearInterval(timer);
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
                        <v-btn v-if="inst.status !== 'connected'" variant="flat" color="success"
                            @click="startInstance(inst.id)">
                            Start Session
                        </v-btn>

                        <!-- Add Reset Button for Disconnected/Stuck states -->
                        <v-btn v-if="inst.status === 'disconnected'" variant="text" color="warning" size="small"
                            @click="stopInstance(inst.id)">
                            Reset
                        </v-btn>

                        <v-btn v-if="inst.status === 'connecting' && inst.qr" variant="outlined" color="info"
                            prepend-icon="mdi-qrcode" @click="showQr(inst.qr, inst.name)">
                            Scan QR
                        </v-btn>

                        <v-btn v-if="inst.status === 'connected'" variant="tonal" color="error"
                            @click="stopInstance(inst.id)">
                            Logout
                        </v-btn>
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

    </v-container>
</template>

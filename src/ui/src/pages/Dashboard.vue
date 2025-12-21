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
        const res = await fetch('/api/wa/status', {
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

// Actions
const startInstance = async (id: number) => {
    await fetch(`/api/wa/start/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchStatus(); // Poll update
};

const stopInstance = async (id: number) => {
     await fetch(`/api/wa/logout/${id}`, {
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
    switch(status) {
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
        <v-btn prepend-icon="mdi-refresh" @click="fetchStatus" :loading="loading">Refresh</v-btn>
    </div>

    <v-row>
        <v-col v-for="inst in instances" :key="inst.id" cols="12" md="6" lg="4">
            <v-card elevation="2" class="h-100" border>
                <v-card-item>
                    <template v-slot:prepend>
                         <v-avatar color="primary" variant="tonal">
                            <v-icon icon="mdi-whatsapp"></v-icon>
                        </v-avatar>
                    </template>
                    <v-card-title>{{ inst.name }}</v-card-title>
                    <v-card-subtitle>
                        <v-chip size="x-small" :color="getStatusColor(inst.status)" class="text-uppercase" label>
                            {{ inst.status }}
                        </v-chip>
                    </v-card-subtitle>
                </v-card-item>

                <v-card-text>
                    <div v-if="inst.user" class="d-flex align-center mt-2">
                         <v-icon size="small" class="mr-2">mdi-account-check</v-icon>
                         {{ inst.user.name }} ({{ inst.user.id }})
                    </div>
                    <div v-else class="text-caption text-medium-emphasis mt-2">
                        Not connected
                    </div>
                </v-card-text>

                <v-card-actions>
                    <v-btn 
                        v-if="inst.status !== 'connected'" 
                        variant="tonal" 
                        color="success" 
                        @click="startInstance(inst.id)"
                    >
                        Start Session
                    </v-btn>
                    
                    <v-btn 
                        v-if="inst.status === 'connecting' && inst.qr" 
                        variant="outlined" 
                        color="info"
                        prepend-icon="mdi-qrcode"
                        @click="showQr(inst.qr, inst.name)"
                    >
                        Scan QR
                    </v-btn>

                    <v-btn 
                         v-if="inst.status === 'connected'"
                         variant="text" 
                         color="error" 
                         @click="stopInstance(inst.id)"
                    >
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

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const startDate = ref('');
const endDate = ref('');
const userId = ref('');
const loading = ref(false);
const logs = ref([]);
const headers = [
    { title: 'Time', key: 'created_at' },
    { title: 'User', key: 'username' },
    { title: 'Action', key: 'action' },
    { title: 'Details', key: 'details' },
];

const fetchLogs = async () => {
    try {
        const res = await fetch('/backend/logs', {
             headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            logs.value = data.logs;
        }
    } catch (e) {
        console.error('Failed to fetch logs', e);
    }
};

const handleExport = async () => {
    loading.value = true;
    try {
        const params = new URLSearchParams();
        if (startDate.value) params.append('startDate', startDate.value);
        if (endDate.value) params.append('endDate', endDate.value);
        if (userId.value) params.append('userId', userId.value);

        const res = await fetch(`/backend/logs/export?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            const data = await res.json();
            alert(data.error || 'Export failed');
        }
    } catch (e) {
        console.error(e);
        alert('Export failed');
    }
    loading.value = false;
};

onMounted(() => {
    fetchLogs();
});
</script>

<template>
  <v-container>
     <div class="mb-6">
        <h1 class="text-h4 font-weight-bold">Audit Logs</h1>
        <p class="text-medium-emphasis">System activity logs and detailed usage history.</p>
    </div>

    <!-- Filter/Export Card -->
    <v-card class="mb-6">
        <v-card-title>Filter & Export</v-card-title>
        <v-card-text>
            <v-row dense>
                <v-col cols="12" md="4">
                    <v-text-field v-model="startDate" type="date" label="Start Date" variant="outlined"></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                    <v-text-field v-model="endDate" type="date" label="End Date" variant="outlined"></v-text-field>
                </v-col>
                 <v-col cols="12" md="4">
                    <v-text-field v-model="userId" label="User ID (Optional)" variant="outlined"></v-text-field>
                </v-col>
            </v-row>
        </v-card-text>
        <v-card-actions class="justify-end pr-4 pb-4">
             <v-btn 
                color="primary" 
                prepend-icon="mdi-download" 
                variant="elevated"
                :loading="loading"
                @click="handleExport"
            >
                Export CSV
            </v-btn>
        </v-card-actions>
    </v-card>

    <!-- Logs Table -->
    <v-card>
        <v-card-title>Recent Activity</v-card-title>
        <v-data-table
            :headers="headers"
            :items="logs"
            :items-per-page="10"
            class="elevation-1"
        >
            <template v-slot:item.created_at="{ item }">
                {{ new Date(item.created_at).toLocaleString() }}
            </template>
            <template v-slot:item.username="{ item }">
                <v-chip size="small" :color="item.username === 'admin' ? 'purple' : 'blue'" label>
                    {{ item.username }}
                </v-chip>
            </template>
        </v-data-table>
    </v-card>

     <v-alert type="info" variant="tonal" class="mt-4" density="compact">
        Note: The visible table shows the last 100 logs. Use "Export CSV" for full history.
    </v-alert>
  </v-container>
</template>

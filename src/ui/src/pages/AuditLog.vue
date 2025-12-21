<script setup lang="ts">
import { ref } from 'vue';

const startDate = ref('');
const endDate = ref('');
const userId = ref('');
const loading = ref(false);

const handleExport = async () => {
    loading.value = true;
    try {
        const params = new URLSearchParams();
        if (startDate.value) params.append('startDate', startDate.value);
        if (endDate.value) params.append('endDate', endDate.value);
        if (userId.value) params.append('userId', userId.value);

        const res = await fetch(`/api/logs/export?${params.toString()}`, {
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
</script>

<template>
  <v-container>
     <div class="mb-6">
        <h1 class="text-h4 font-weight-bold">Audit Logs</h1>
        <p class="text-medium-emphasis">Export system activity logs for compliance and review.</p>
    </div>

    <v-card>
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
     <v-alert type="info" variant="tonal" class="mt-4" density="compact">
        Note: Only Admins can export logs. The export includes Action, User, Timestamp, and Details.
    </v-alert>
  </v-container>
</template>

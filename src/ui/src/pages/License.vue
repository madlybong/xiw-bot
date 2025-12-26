<script setup lang="ts">
import { ref, onMounted } from 'vue';

const license = ref<any>(null);
const loading = ref(true);

onMounted(async () => {
    try {
        const res = await fetch('/api/license', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            license.value = data;
        }
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <v-container class="fill-height align-start pa-6">
        <v-row>
            <v-col cols="12">
                <h1 class="text-h4 font-weight-bold mb-4 text-white">License Status</h1>

                <div v-if="loading" class="text-center">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>

                <div v-else-if="license">
                    <!-- Warnings -->
                    <v-alert v-if="license.machine_mismatch" type="warning" variant="tonal"
                        class="mb-4 text-amber-accent-2 border-amber">
                        <div class="font-weight-bold text-h6">Machine Mismatch Detected</div>
                        This license is bound to a different machine fingerprint. This may be a violation of the license
                        terms.
                    </v-alert>

                    <v-alert v-if="license.status === 'expired'" type="error" variant="tonal"
                        class="mb-4 text-red-accent-2 border-red">
                        <div class="font-weight-bold text-h6">License Expired</div>
                        This license expired {{ Math.abs(license.days_remaining) }} days ago. Services are disabled.
                    </v-alert>

                    <v-alert v-if="license.status === 'warning'" type="warning" variant="tonal"
                        class="mb-4 text-amber-accent-2 border-amber">
                        <div class="font-weight-bold text-h6">Expiring Soon</div>
                        This license expires in {{ license.days_remaining }} days. Please renew.
                    </v-alert>

                    <v-card class="mb-4" border>
                        <v-card-title class="text-primary font-weight-bold">License Details</v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col cols="12" md="6">
                                    <v-list>
                                        <v-list-item title="Client Name" :subtitle="license.client"></v-list-item>
                                        <v-list-item title="Product" :subtitle="license.product"></v-list-item>
                                        <v-list-item title="License ID" :subtitle="license.license_id"></v-list-item>
                                        <v-list-item title="Billing Cycle"
                                            :subtitle="license.billing_cycle"></v-list-item>
                                    </v-list>
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-list>
                                        <v-list-item title="Issued At"
                                            :subtitle="license.issued_at.split('T')[0]"></v-list-item>
                                        <v-list-item title="Expires At"
                                            :subtitle="license.expires_at.split('T')[0]"></v-list-item>
                                        <v-list-item>
                                            <template v-slot:title>Machine Binding</template>
                                            <template v-slot:subtitle>
                                                <v-chip size="small"
                                                    :color="license.machine_mismatch ? 'error' : 'success'"
                                                    variant="outlined">
                                                    {{ license.machine_mismatch ? 'Mismatch' : (license.machine?.bound ?
                                                    'Bound' : 'Soft Bound') }}
                                                </v-chip>
                                            </template>
                                        </v-list-item>
                                    </v-list>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>

                    <v-card border>
                        <v-card-title class="text-primary font-weight-bold">Limits</v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col cols="12" md="6">
                                    <div class="text-subtitle-2 text-medium-emphasis mb-1">WhatsApp Accounts</div>
                                    <div class="text-h5 font-weight-bold">
                                        {{ license.limits.max_whatsapp_accounts === -1 ? 'Unlimited' :
                                        license.limits.max_whatsapp_accounts
                                        }}
                                    </div>
                                </v-col>
                                <v-col cols="12" md="6">
                                    <div class="text-subtitle-2 text-medium-emphasis mb-1">Agents</div>
                                    <div class="text-h5 font-weight-bold">
                                        {{ license.limits.max_agents === -1 ? 'Unlimited' : license.limits.max_agents }}
                                    </div>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </div>
                <div v-else>
                    <v-alert type="error" variant="tonal">
                        Failed to load license info. Please check the server logs.
                    </v-alert>
                </div>

            </v-col>
        </v-row>
    </v-container>
</template>

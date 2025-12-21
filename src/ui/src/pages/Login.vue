<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const showPass = ref(false);
const router = useRouter();

const handleLogin = async () => {
    loading.value = true;
    error.value = '';
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username.value, password: password.value }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        localStorage.setItem('token', data.token);
        window.dispatchEvent(new Event('auth-change'));
        router.push('/dashboard');
    } catch (e: any) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
};
</script>

<template>
  <v-container class="fill-height justify-center">
    <v-card width="400" class="pa-4 glass-panel" elevation="8" rounded="lg">
      <v-card-title class="text-h4 font-weight-bold text-center text-primary mb-4">
        XiW Bot
      </v-card-title>
      <v-card-subtitle class="text-center mb-6">
        Enterprise WhatsApp Automation
      </v-card-subtitle>

      <v-card-text>
        <v-text-field
            v-model="username"
            label="Username"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            bg-color="surface"
        ></v-text-field>

        <v-text-field
            v-model="password"
            :type="showPass ? 'text' : 'password'"
            label="Password"
            prepend-inner-icon="mdi-lock"
            :append-inner-icon="showPass ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append-inner="showPass = !showPass"
            variant="outlined"
            bg-color="surface"
            @keyup.enter="handleLogin"
        ></v-text-field>

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
            {{ error }}
        </v-alert>

        <v-btn
            block
            color="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="mt-2"
        >
            Login
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.glass-panel {
    background: rgba(22, 22, 26, 0.9) !important;
    backdrop-filter: blur(10px);
}
</style>

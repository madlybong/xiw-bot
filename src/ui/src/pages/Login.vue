<script setup lang="ts">
import { ref } from 'vue';

const username = ref('');
const password = ref('');
const loading = ref(false);
const showPassword = ref(false);

const handleLogin = async () => {
    loading.value = true;
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username.value, password: password.value })
        });
        const data = await res.json();

        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = '/dashboard';
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (e) {
        alert('Connection failed');
    }
    loading.value = false;
};
</script>

<template>
    <v-container class="fill-height justify-center">
        <v-card max-width="400" width="100%" class="pa-4" elevation="4">
            <div class="text-center mb-6 mt-4">
                <v-avatar color="primary" variant="tonal" size="64" class="mb-4">
                    <v-icon size="32">mdi-robot-excited</v-icon>
                </v-avatar>
                <h2 class="text-h5 font-weight-bold text-primary">XiW Bot</h2>
                <p class="text-body-2 text-medium-emphasis">Sign in to continue</p>
            </div>

            <v-card-text>
                <v-form @submit.prevent="handleLogin" autocomplete="off">
                    <v-text-field v-model="username" label="Username" prepend-inner-icon="mdi-account"
                        variant="outlined" class="mb-2" autocomplete="off"></v-text-field>

                    <v-text-field v-model="password" label="Password" prepend-inner-icon="mdi-lock"
                        :type="showPassword ? 'text' : 'password'"
                        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                        @click:append-inner="showPassword = !showPassword" variant="outlined" class="mb-4"
                        autocomplete="new-password"></v-text-field>

                    <v-btn block color="primary" size="large" type="submit" :loading="loading">
                        Login
                    </v-btn>
                </v-form>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<style scoped>
/* No custom styles needed */
</style>

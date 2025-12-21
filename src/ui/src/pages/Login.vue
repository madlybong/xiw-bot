<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Footer from '../components/Footer.vue';

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
  <v-container class="fill-height login-container" fluid>
    
    <!-- Background Elements -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>

    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="glass-card pa-8" elevation="24" rounded="xl">
            
            <div class="text-center mb-8">
                <v-icon size="64" color="primary" class="mb-4">mdi-robot-outline</v-icon>
                <h1 class="text-h4 font-weight-bold text-gradient">XiW Bot</h1>
                <p class="text-subtitle-1 text-medium-emphasis">Enterprise Automation</p>
            </div>

            <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact" icon="mdi-alert-circle">
                {{ error }}
            </v-alert>

            <v-form @submit.prevent="handleLogin" autocomplete="off">
                <v-text-field
                    v-model="username"
                    label="Username"
                    prepend-inner-icon="mdi-account"
                    variant="outlined"
                    density="comfortable"
                    class="mb-2"
                    autocomplete="off"
                    name="username_xiw"
                ></v-text-field>

                <v-text-field
                    v-model="password"
                    :type="showPass ? 'text' : 'password'"
                    label="Password"
                    prepend-inner-icon="mdi-lock"
                    :append-inner-icon="showPass ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPass = !showPass"
                    variant="outlined"
                    density="comfortable"
                    autocomplete="new-password"
                    name="password_xiw"
                    class="mb-6"
                ></v-text-field>

                <v-btn
                    block
                    color="primary"
                    size="large"
                    :loading="loading"
                    type="submit"
                    class="text-uppercase font-weight-bold"
                    elevation="4"
                    rounded="lg"
                >
                    Login
                </v-btn>
            </v-form>

        </v-card>
      </v-col>
    </v-row>
    
    <Footer />
  </v-container>
</template>

<style scoped>
.login-container {
    background: rgb(var(--v-theme-surface));
    position: relative;
    overflow: hidden;
}

/* Glassmorphism Card */
.glass-card {
    background: rgba(var(--v-theme-surface-variant), 0.6) !important;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Animated Background Shapes */
.bg-shape {
    position: absolute;
    filter: blur(100px);
    z-index: 0;
    animation: float 10s infinite alternate;
}

.shape-1 {
    width: 300px;
    height: 300px;
    background: rgb(var(--v-theme-primary));
    opacity: 0.2;
    top: 10%;
    left: 20%;
    border-radius: 50%;
}

.shape-2 {
    width: 400px;
    height: 400px;
    background: rgb(var(--v-theme-secondary));
    opacity: 0.15;
    bottom: 10%;
    right: 20%;
    border-radius: 50%;
    animation-delay: -5s;
}

@keyframes float {
    0% { transform: translate(0, 0); }
    100% { transform: translate(30px, 50px); }
}

.text-gradient {
    background: linear-gradient(45deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-secondary)));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
</style>


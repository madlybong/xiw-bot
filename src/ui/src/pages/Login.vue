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
<div class="login-wrapper">
    <!-- Animated Gradient Blobs -->
    <div class="gradient-bg"></div>

    <v-container class="fill-height justify-center pa-4">
        <v-card class="glass-card d-flex flex-wrap overflow-hidden" elevation="0" max-width="900" width="100%">
            <!-- Left Side: Visual / Branding -->
            <v-col cols="12" md="6" class="visual-side d-flex flex-column align-center justify-center text-center text-white pa-8 position-relative">
                <div class="visual-content">
                    <div class="logo-container mb-6">
                        <v-icon size="64" color="white" class="glass-icon">mdi-robot-excited-outline</v-icon>
                    </div>
                    <h1 class="text-h3 font-weight-bold mb-2">XiW Bot</h1>
                    <p class="text-h6 font-weight-light text-white-50">Enterprise WhatsApp Automation</p>
                    <div class="mt-8 d-none d-md-block">
                        <v-chip color="white" variant="outlined" class="mr-2">v0.9.3</v-chip>
                        <v-chip color="green-accent-2" variant="flat" class="text-black font-weight-bold">Stable</v-chip>
                    </div>
                </div>
                
                <!-- Decorative Circle -->
                <div class="decoration-circle"></div>
            </v-col>

            <!-- Right Side: Login Form -->
            <v-col cols="12" md="6" class="form-side pa-8 pa-md-12 d-flex flex-column justify-center bg-surface">
                <div class="text-center text-md-left mb-8">
                    <h2 class="text-h4 font-weight-bold text-primary mb-2">Welcome Back</h2>
                    <p class="text-body-1 text-medium-emphasis">Please sign in to your dashboard.</p>
                </div>

                <v-form @submit.prevent="handleLogin">
                    <div class="mb-4">
                        <label class="text-caption font-weight-bold ml-1 mb-1 d-block text-medium-emphasis">USERNAME</label>
                        <v-text-field
                            v-model="username"
                            prepend-inner-icon="mdi-account-outline"
                            variant="outlined"
                            density="comfortable"
                            placeholder="Enter your username"
                            bg-color="grey-lighten-5" 
                            color="primary"
                            hide-details="auto"
                            class="rounded-lg apple-input"
                        ></v-text-field>
                    </div>

                    <div class="mb-8">
                        <label class="text-caption font-weight-bold ml-1 mb-1 d-block text-medium-emphasis">PASSWORD</label>
                        <v-text-field
                            v-model="password"
                            :type="showPassword ? 'text' : 'password'"
                            prepend-inner-icon="mdi-lock-outline"
                            :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                            @click:append-inner="showPassword = !showPassword"
                            variant="outlined"
                            density="comfortable"
                            placeholder="Enter your password"
                            bg-color="grey-lighten-5"
                            color="primary"
                            hide-details="auto"
                            class="rounded-lg apple-input"
                        ></v-text-field>
                    </div>

                    <v-btn
                        block
                        height="50"
                        color="primary"
                        class="text-body-1 font-weight-bold rounded-lg shadow-button"
                        :loading="loading"
                        type="submit"
                        elevation="4"
                    >
                        Sign In
                    </v-btn>
                </v-form>
                
                <div class="mt-8 text-center text-caption text-medium-emphasis">
                    Need help? Contact your administrator.
                </div>
            </v-col>
        </v-card>
    </v-container>
</div>
</template>

<style scoped>
/* Animated Background */
.login-wrapper {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: #0f172a; /* Fallback */
    overflow: hidden;
}

.gradient-bg {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at 50% 50%, rgba(76, 29, 149, 0.4), transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.4), transparent 40%),
                radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.4), transparent 40%);
    filter: blur(80px);
    animation: gradientMove 20s ease infinite alternate;
    z-index: 0;
}

@keyframes gradientMove {
    0% { transform: rotate(0deg) translate(0, 0); }
    100% { transform: rotate(45deg) translate(-20px, 20px); }
}

/* Glass Card */
.glass-card {
    background: rgba(255, 255, 255, 0.05) !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
    border-radius: 24px !important;
    z-index: 1;
}

/* Internal Split Styles */
.visual-side {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%);
    border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.form-side {
    /* Slightly customized surface for contrast */
    background: rgba(255, 255, 255, 0.95) !important; /* Nearly opaque white for clean form */
}

/* Dark Mode Form Adjustment (If global theme is dark) */
:deep(.v-theme--dark) .form-side {
    background: rgba(30, 41, 59, 0.8) !important;
}

/* Apple/Glass Inputs */
.apple-input :deep(.v-field__outline) {
    --v-field-border-opacity: 0.15;
}
.apple-input :deep(.v-field--focused .v-field__outline) {
    --v-field-border-opacity: 1; 
    box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.15);
}

.shadow-button {
    box-shadow: 0 10px 15px -3px rgba(var(--v-theme-primary), 0.3), 0 4px 6px -2px rgba(var(--v-theme-primary), 0.1) !important;
    transition: transform 0.2s, box-shadow 0.2s;
}

.shadow-button:active {
    transform: translateY(1px);
    box-shadow: none !important;
}

.glass-icon {
    filter: drop-shadow(0 0 15px rgba(255,255,255,0.4));
}

.decoration-circle {
    position: absolute;
    bottom: -50px;
    left: -50px;
    width: 200px;
    height: 200px;
    background: linear-gradient(45deg, #10b981, #3b82f6);
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.4;
}
</style>

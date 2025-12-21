<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';
import Footer from './components/Footer.vue';

// Navbar Logic Inline for now or separate component
const drawer = ref(true);
const auth = ref(false);
const version = ref('');
const router = useRouter();
const theme = useTheme();

const checkAuth = () => {
    auth.value = !!localStorage.getItem('token');
};

const fetchVersion = async () => {
   if(auth.value) {
       try {
           const res = await fetch('/api/health');
           const data = await res.json();
           version.value = data.version;
       } catch(e) {}
   }
}

const toggleTheme = () => {
    const newVal = theme.global.name.value === 'dark' ? 'light' : 'dark';
    theme.global.name.value = newVal;
    localStorage.setItem('theme', newVal);
};

const logout = () => {
    localStorage.removeItem('token');
    auth.value = false;
    router.push('/login');
};

onMounted(() => {
    checkAuth();
    fetchVersion();
    
    // Load saved theme
    const saved = localStorage.getItem('theme');
    if (saved) {
        theme.global.name.value = saved;
    }

    window.addEventListener('storage', checkAuth);
    // Custom event dispatch from Login
    window.addEventListener('auth-change', checkAuth);
});
</script>

<template>
  <v-app class="app-container">
    <div class="gradient-bg"></div>

    <v-app-bar v-if="auth" class="glass-app-bar" elevation="0">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="font-weight-bold text-primary">XiW Bot</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="toggleTheme">
        <v-icon>{{ theme.global.name.value === 'dark' ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
      </v-btn>
      <v-btn icon to="/docs">
        <v-icon>mdi-file-document-outline</v-icon>
      </v-btn>
      <v-btn icon @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-if="auth" v-model="drawer" class="glass-nav" elevation="0">
      <div class="pa-4 text-center">
        <v-avatar color="primary" variant="tonal" size="64" class="mb-2">
            <v-icon size="32">mdi-robot-excited</v-icon>
        </v-avatar>
        <div class="text-subtitle-1 font-weight-bold">XiW Bot</div>
        <div class="text-caption text-medium-emphasis">v{{ version }}</div>
      </div>
      <v-divider class="mb-2 mx-4 border-opacity-25"></v-divider>

      <v-list density="compact" nav>
        <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard" title="Dashboard" active-color="primary" rounded="xl"></v-list-item>
        <v-list-item to="/contacts" prepend-icon="mdi-contacts" title="Address Book" active-color="primary" rounded="xl"></v-list-item>
        <v-list-item to="/logs" prepend-icon="mdi-history" title="Audit Logs" active-color="primary" rounded="xl"></v-list-item>
        <v-list-item to="/users" prepend-icon="mdi-account-group" title="Users" active-color="primary" rounded="xl"></v-list-item>
        <v-list-item to="/docs" prepend-icon="mdi-file-code" title="API Docs" active-color="primary" rounded="xl"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="bg-transparent">
      <router-view></router-view>
      <Footer v-if="auth" />
    </v-main>
  </v-app>
</template>

<style>
/* Global overrides to ensure transparency */
html, body, .v-application {
    background: transparent !important;
}
.app-container {
    background: #0d0d0f; /* Fallback for gradient */
}
</style>

<style>
/* Global overrides if needed */
body {
    background-color: #0d0d0f;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';
import Footer from './components/Footer.vue';

// Globals
declare const __APP_VERSION__: string;

// Navbar Logic Inline for now or separate component
const drawer = ref(true);
const auth = ref(false);
const router = useRouter();
const theme = useTheme();

// Version Check
const versionMismatch = ref(false);
const backendVersion = ref('');

const checkVersionMismatch = async () => {
  try {
    const res = await fetch('/api/version');
    if (res.ok) {
      const data = await res.json();
      backendVersion.value = data.version;
      if (data.version !== __APP_VERSION__) {
        versionMismatch.value = true;
      }
    }
  } catch (e) { }
};

const checkAuth = () => {
  auth.value = !!localStorage.getItem('token');
};

const appVersion = __APP_VERSION__;

const toggleTheme = () => {
  const newVal = theme.global.name.value === 'dark' ? 'light' : 'dark';
  // Use recommended API to avoid warnings
  (theme as any).change(newVal);
  localStorage.setItem('theme', newVal);
};

const logout = () => {
  localStorage.removeItem('token');
  auth.value = false;
  router.push('/login');
};

const verifySession = async () => {
  if (!auth.value) return;
  try {
    // Proactively check validity
    const res = await fetch('/api/wa/me', {
       headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.status === 401 || res.status === 403) {
       logout();
    }
  } catch (e) {
     // Network error? Ignore or retry.
  }
};

onMounted(() => {
  checkAuth();
  checkVersionMismatch();
  verifySession(); // Check on load

  // Global Fetch Interceptor for 401s
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
          // Check if we are already dealing with login to avoid loops (though 401 usually comes from data endpoints)
          const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
          if (!url.includes('/auth/login')) {
             logout();
          }
      }
      return response;
  };

  // Load saved theme
  const saved = localStorage.getItem('theme');
  if (saved) {
    (theme as any).change(saved);
  }

  window.addEventListener('storage', checkAuth);
  // Custom event dispatch from Login
  window.addEventListener('auth-change', checkAuth);
});
</script>

<template>
  <v-app>
    <v-system-bar v-if="versionMismatch" color="warning" class="justify-center font-weight-bold">
      <v-icon start icon="mdi-alert" class="mr-2"></v-icon>
      Version Mismatch: UI ({{ __APP_VERSION__ }}) != Backend ({{ backendVersion }}). Please refresh or update.
    </v-system-bar>
    <v-app-bar v-if="auth" color="primary">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="font-weight-bold">XiW Bot</v-toolbar-title>
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

    <v-navigation-drawer v-if="auth" v-model="drawer">
      <div class="pa-4 text-center">
        <v-avatar color="primary" variant="tonal" size="64" class="mb-2">
          <v-icon size="32">mdi-robot-excited</v-icon>
        </v-avatar>
        <div class="text-subtitle-1 font-weight-bold">XiW Bot</div>
        <div class="text-caption text-medium-emphasis">v{{ appVersion }}</div>
      </div>
      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard" title="Dashboard" color="primary"></v-list-item>
        <v-list-item to="/contacts" prepend-icon="mdi-contacts" title="Address Book" color="primary"></v-list-item>
        <v-list-item to="/logs" prepend-icon="mdi-history" title="Audit Logs" color="primary"></v-list-item>
        <v-list-item to="/users" prepend-icon="mdi-account-group" title="Users" color="primary"></v-list-item>

        <v-list-item to="/docs" prepend-icon="mdi-file-code" title="API Docs" color="primary"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view></router-view>
      <Footer v-if="auth" />
    </v-main>
  </v-app>
</template>

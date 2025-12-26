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
  if (auth.value) {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      version.value = data.version;
    } catch (e) { }
  }
}

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

onMounted(() => {
  checkAuth();
  fetchVersion();

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
        <div class="text-caption text-medium-emphasis">v{{ version }}</div>
      </div>
      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard" title="Dashboard" color="primary"></v-list-item>
        <v-list-item to="/contacts" prepend-icon="mdi-contacts" title="Address Book" color="primary"></v-list-item>
        <v-list-item to="/logs" prepend-icon="mdi-history" title="Audit Logs" color="primary"></v-list-item>
        <v-list-item to="/users" prepend-icon="mdi-account-group" title="Users" color="primary"></v-list-item>
        <v-list-item to="/license" prepend-icon="mdi-license" title="License" color="primary"></v-list-item>
        <v-list-item to="/docs" prepend-icon="mdi-file-code" title="API Docs" color="primary"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view></router-view>
      <Footer v-if="auth" />
    </v-main>
  </v-app>
</template>

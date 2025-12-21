<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from 'vuetify';

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
  <v-app>
    <v-app-bar v-if="auth" color="surface" elevation="1">
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

    <v-navigation-drawer v-if="auth" v-model="drawer" color="background">
      <v-list>
        <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard" title="Dashboard" active-color="primary"></v-list-item>
        <v-list-item to="/contacts" prepend-icon="mdi-contacts" title="Address Book" active-color="primary"></v-list-item>
        <v-list-item to="/logs" prepend-icon="mdi-history" title="Audit Logs" active-color="primary"></v-list-item>
        <v-list-item to="/users" prepend-icon="mdi-account-group" title="Users" active-color="primary"></v-list-item>
        <v-list-item to="/docs" prepend-icon="mdi-file-code" title="API Docs" active-color="primary"></v-list-item>
      </v-list>
      <template v-slot:append>
        <div class="pa-2 text-center text-caption text-medium-emphasis">
          v{{ version }}
        </div>
      </template>
    </v-navigation-drawer>

    <v-main class="bg-background">
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<style>
/* Global overrides if needed */
body {
    background-color: #0d0d0f;
}
</style>

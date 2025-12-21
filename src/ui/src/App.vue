<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// Navbar Logic Inline for now or separate component
const drawer = ref(false);
const auth = ref(false);
const router = useRouter();

const checkAuth = () => {
    auth.value = !!localStorage.getItem('token');
};

const logout = () => {
    localStorage.removeItem('token');
    auth.value = false;
    router.push('/login');
};

onMounted(() => {
    checkAuth();
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

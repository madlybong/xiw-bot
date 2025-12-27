<script setup lang="ts">
import { ref, onMounted } from 'vue';

const version = ref(__APP_VERSION__ || 'Dev');
const status = ref('Checking...');
const updateAvailable = ref(false);
const latestVersion = ref('');

const checkStatus = async () => {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      status.value = 'Online';
      checkUpdate(version.value);
    } else {
      status.value = 'Offline';
    }
  } catch { status.value = 'Offline'; }
};

const checkUpdate = async (current: string) => {
  try {
    // GitHub API Check (Rate limits apply but safe for client side periodic check)
    const res = await fetch('https://api.github.com/repos/madlybong/xiw-bot/releases/latest');
    if (res.ok) {
      const data = await res.json();
      const remote = data.tag_name?.replace('v', '');
      if (remote && remote !== current) {
        updateAvailable.value = true;
        latestVersion.value = remote;
      }
    }
  } catch (e) {
    // Silent fail for offline/private repos
  }
};

onMounted(checkStatus);
</script>

<template>
  <v-footer app absolute class="d-flex justify-end pa-2 text-caption text-medium-emphasis">
    <div class="d-flex align-center gap-2">

      <!-- Status Indicator -->
      <v-icon size="x-small" :color="status === 'Online' ? 'success' : 'error'" class="mr-1">mdi-circle</v-icon>
      <span class="mr-3">{{ status }}</span>

      <!-- Version -->
      <span class="mr-3">v{{ version }}</span>

      <!-- Update Badge -->
      <v-chip v-if="updateAvailable" color="warning" size="x-small" target="_blank"
        href="https://github.com/madlybong/xiw-bot/releases" class="mr-3 cursor-pointer">
        Update {{ latestVersion }}
      </v-chip>

      <!-- Copyright -->
      <span>&copy; {{ new Date().getFullYear() }} XiW Bot</span>
    </div>
  </v-footer>
</template>

<style scoped>
.gap-2 {
  gap: 8px;
}

.cursor-pointer {
  cursor: pointer;
}
</style>

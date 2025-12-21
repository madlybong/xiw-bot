<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface User {
    id: number;
    username: string;
    role: string;
    status: string;
    created_at: string;
}

const users = ref<User[]>([]);
const loading = ref(false);
const dialog = ref(false);
const newUser = ref({ username: '', password: '', role: 'agent' });
const error = ref('');

const fetchUsers = async () => {
    loading.value = true;
    try {
        const res = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            users.value = data.users;
        } else {
             const data = await res.json();
             // If not admin, maybe redirect?
             if(res.status === 403) alert('Unauthorized');
        }
    } catch (e) { console.error(e); }
    loading.value = false;
};

const createUser = async () => {
    if(!newUser.value.username || !newUser.value.password) return;
    try {
        const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify(newUser.value)
        });
        if(res.ok) {
            dialog.value = false;
            fetchUsers();
            newUser.value = { username: '', password: '', role: 'agent' };
        } else {
            const data = await res.json();
            error.value = data.error;
        }
    } catch(e: any) { error.value = e.message; }
};

const deleteUser = async (id: number) => {
    if(!confirm('Delete this user?')) return;
    await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchUsers();
}

onMounted(fetchUsers);
</script>

<template>
  <v-container>
    <div class="d-flex align-center mb-6">
        <h1 class="text-h4 font-weight-bold">User Management</h1>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="dialog = true" prepend-icon="mdi-account-plus">Add User</v-btn>
    </div>

    <v-card>
        <v-table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <v-tr v-for="user in users" :key="user.id">
                    <td>{{ user.id }}</td>
                    <td>{{ user.username }}</td>
                    <td>
                        <v-chip :color="user.role === 'admin' ? 'purple' : 'blue'" size="small">{{ user.role }}</v-chip>
                    </td>
                    <td>{{ user.status }}</td>
                    <td>{{ new Date(user.created_at).toLocaleDateString() }}</td>
                    <td>
                        <v-btn icon="mdi-delete" variant="text" color="error" size="small" :disabled="user.role === 'admin'" @click="deleteUser(user.id)"></v-btn>
                    </td>
                </v-tr>
            </tbody>
        </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="400">
        <v-card>
            <v-card-title>Create User</v-card-title>
            <v-card-text>
                <v-text-field v-model="newUser.username" label="Username"></v-text-field>
                <v-text-field v-model="newUser.password" label="Password" type="password"></v-text-field>
                <v-select v-model="newUser.role" label="Role" :items="['agent', 'admin']"></v-select>
                <v-alert v-if="error" type="error" density="compact">{{ error }}</v-alert>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="dialog = false">Cancel</v-btn>
                <v-btn color="primary" @click="createUser">Create</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
  </v-container>
</template>

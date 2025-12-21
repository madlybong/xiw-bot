<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface User {
    id: number;
    username: string;
    role: string;
    status: string;
    message_limit: number;
    limit_frequency: string;
    message_usage: number;
    created_at: string;
}

const users = ref<User[]>([]);
const loading = ref(false);
const dialog = ref(false);
const isEdit = ref(false);
const editId = ref(0);

// Form
const formUser = ref({ 
    username: '', 
    password: '', 
    role: 'agent',
    status: 'active',
    message_limit: 1000,
    limit_frequency: 'daily'
});

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
             if(res.status === 403) alert('Unauthorized');
        }
    } catch (e) { console.error(e); }
    loading.value = false;
};

const openCreate = () => {
    isEdit.value = false;
    formUser.value = { username: '', password: '', role: 'agent', status: 'active', message_limit: 1000, limit_frequency: 'daily' };
    dialog.value = true;
};

const openEdit = (user: User) => {
    isEdit.value = true;
    editId.value = user.id;
    // Map fields
    formUser.value = {
        username: user.username,
        password: '', // Leave empty to keep
        role: user.role,
        status: user.status,
        message_limit: user.message_limit,
        limit_frequency: user.limit_frequency
    };
    dialog.value = true;
};

const saveUser = async () => {
    error.value = '';
    // Validation
    if(!isEdit.value && (!formUser.value.username || !formUser.value.password)) return;

    try {
        const url = isEdit.value ? `/api/users/${editId.value}` : '/api/users';
        const method = isEdit.value ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify(formUser.value)
        });

        if(res.ok) {
            dialog.value = false;
            fetchUsers();
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
        <v-btn color="primary" @click="openCreate" prepend-icon="mdi-account-plus">Add User</v-btn>
    </div>

    <v-card :loading="loading">
        <v-table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Limits</th>
                    <th>Usage</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="user in users" :key="user.id">
                    <td>{{ user.id }}</td>
                    <td>{{ user.username }}</td>
                    <td>
                        <v-chip :color="user.role === 'admin' ? 'purple' : 'blue'" size="small" class="text-uppercase" label>
                            {{ user.role }}
                        </v-chip>
                    </td>
                    <td>
                        <v-chip :color="user.status === 'active' ? 'success' : 'error'" size="small" label>
                            {{ user.status }}
                        </v-chip>
                    </td>
                    <td>
                        <div v-if="user.role !== 'admin'" class="text-caption">
                            {{ user.message_limit }} / {{ user.limit_frequency }}
                        </div>
                        <div v-else class="text-caption text-disabled">Unlimited</div>
                    </td>
                    <td>
                         <div v-if="user.role !== 'admin'" class="text-caption">
                            {{ user.message_usage }} used
                        </div>
                    </td>
                    <td>
                        <v-btn icon="mdi-pencil" variant="text" color="primary" size="small" @click="openEdit(user)"></v-btn>
                        <v-btn icon="mdi-delete" variant="text" color="error" size="small" :disabled="user.role === 'admin'" @click="deleteUser(user.id)"></v-btn>
                    </td>
                </tr>
            </tbody>
        </v-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500">
        <v-card>
            <v-card-title>{{ isEdit ? 'Edit User' : 'Create User' }}</v-card-title>
            <v-card-text>
                <v-form @submit.prevent="saveUser">
                    <v-text-field 
                        v-model="formUser.username" 
                        label="Username" 
                        :disabled="isEdit"
                        variant="outlined" 
                        class="mb-2"
                    ></v-text-field>
                    
                    <v-text-field 
                        v-model="formUser.password" 
                        label="Password" 
                        :placeholder="isEdit ? 'Leave blank to keep current' : ''"
                        type="password"
                        variant="outlined"
                        class="mb-2"
                    ></v-text-field>

                    <v-row>
                        <v-col cols="6">
                             <v-select 
                                v-model="formUser.role" 
                                label="Role" 
                                :items="['agent', 'admin']"
                                variant="outlined"
                            ></v-select>
                        </v-col>
                        <v-col cols="6">
                             <v-select 
                                v-model="formUser.status" 
                                label="Status" 
                                :items="['active', 'suspended']"
                                variant="outlined"
                            ></v-select>
                        </v-col>
                    </v-row>

                    <v-row v-if="formUser.role !== 'admin'">
                         <v-col cols="6">
                            <v-text-field 
                                v-model.number="formUser.message_limit" 
                                label="Message Limit" 
                                type="number"
                                variant="outlined"
                            ></v-text-field>
                        </v-col>
                        <v-col cols="6">
                             <v-select 
                                v-model="formUser.limit_frequency" 
                                label="Frequency" 
                                :items="['daily', 'monthly', 'unlimited']"
                                variant="outlined"
                            ></v-select>
                        </v-col>
                    </v-row>

                    <v-alert v-if="error" type="error" density="compact" class="mt-2">{{ error }}</v-alert>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="dialog = false">Cancel</v-btn>
                <v-btn color="primary" @click="saveUser">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
  </v-container>
</template>

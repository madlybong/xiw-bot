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
const instances = ref<{id: number, name: string}[]>([]); // For dropdown
const loading = ref(false);
const dialog = ref(false);
const isEdit = ref(false);
const editId = ref(0);

// Form
const formUser = ref({ 
    username: '', 
    password: '', 
    role: 'agent', // Fixed to agent
    status: 'active',
    message_limit: 1000,
    limit_frequency: 'daily'
});

// Token Management
const staticToken = ref('');
const selectedInstances = ref<number[]>([]);
const tokenLoading = ref(false);

const error = ref('');

const fetchUsers = async () => {
    loading.value = true;
    try {
        const res = await fetch('/backend/users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            users.value = data.users;
        }
    } catch (e) { console.error(e); }
    loading.value = false;
};

const fetchInstances = async () => {
    try {
         const res = await fetch('/backend/wa/status', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            // Store simple list
            instances.value = data.instances.map((i: any) => ({ id: i.id, name: i.name }));
        }
    } catch(e) {}
};

const fetchStaticToken = async (userId: number) => {
    staticToken.value = '';
    selectedInstances.value = [];
    try {
         const res = await fetch(`/backend/users/${userId}/static-token`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            if(data.token) {
                staticToken.value = '•'.repeat(20) + ' (Active)'; // Masked
                selectedInstances.value = data.token.instanceIds || [];
            }
        }
    } catch(e) {}
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
        password: '', 
        role: user.role,
        status: user.status,
        message_limit: user.message_limit,
        limit_frequency: user.limit_frequency
    };
    
    // Fetch token info just for this user
    fetchStaticToken(user.id);
    
    dialog.value = true;
};

const saveUser = async () => {
    error.value = '';
    if(!isEdit.value && (!formUser.value.username || !formUser.value.password)) return;

    try {
        const url = isEdit.value ? `/backend/users/${editId.value}` : '/backend/users';
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

const generateToken = async () => {
    if(selectedInstances.value.length === 0) {
        alert('Please assign at least one instance.');
        return;
    }
    if(!confirm('This will invalidate any previous static token for this user. Continue?')) return;
    
    tokenLoading.value = true;
    try {
        const res = await fetch(`/backend/users/${editId.value}/static-token`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify({ instanceIds: selectedInstances.value })
        });
        
        const data = await res.json();
        if(res.ok) {
            staticToken.value = data.token;
        } else {
            alert(data.error);
        }
    } catch(e) {}
    tokenLoading.value = false;
};

const deleteUser = async (id: number) => {
    if(!confirm('Delete this user?')) return;
    await fetch(`/backend/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchUsers();
}

onMounted(() => {
    fetchUsers();
    fetchInstances();
});
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
    <v-dialog v-model="dialog" max-width="600">
        <v-card>
            <v-card-title>{{ isEdit ? 'Edit User' : 'Create Agent' }}</v-card-title>
            <v-card-text>
                <v-form @submit.prevent="saveUser">
                    <v-row>
                        <v-col cols="6">
                             <v-text-field 
                                v-model="formUser.username" 
                                label="Username" 
                                :disabled="isEdit"
                                variant="outlined" 
                                density="compact"
                            ></v-text-field>
                        </v-col>
                        <v-col cols="6">
                             <v-text-field 
                                v-model="formUser.password" 
                                label="Password" 
                                :placeholder="isEdit ? 'Unchanged' : ''"
                                type="password"
                                variant="outlined"
                                density="compact"
                            ></v-text-field>
                        </v-col>
                    </v-row>

                    <v-row>
                        <v-col cols="6">
                             <v-select 
                                v-model="formUser.status" 
                                label="Status" 
                                :items="['active', 'suspended']"
                                variant="outlined"
                                density="compact"
                            ></v-select>
                        </v-col>
                        <!-- Role is hidden/fixed to Agent -->
                         <v-col cols="6" v-if="isEdit && formUser.role === 'admin'">
                             <v-chip color="purple">Admin Role</v-chip>
                        </v-col>
                    </v-row>

                    <v-divider class="my-4"></v-divider>
                    <div class="text-subtitle-2 mb-2">Usage Limits</div>

                    <v-row v-if="formUser.role !== 'admin'">
                         <v-col cols="6">
                            <v-text-field 
                                v-model.number="formUser.message_limit" 
                                label="Message Limit" 
                                type="number"
                                variant="outlined"
                                density="compact"
                            ></v-text-field>
                        </v-col>
                        <v-col cols="6">
                             <v-select 
                                v-model="formUser.limit_frequency" 
                                label="Frequency" 
                                :items="['daily', 'monthly', 'unlimited']"
                                variant="outlined"
                                density="compact"
                            ></v-select>
                        </v-col>
                    </v-row>

                    <!-- API Access Section (Only in Edit Mode) -->
                    <div v-if="isEdit && formUser.role !== 'admin'" class="mt-4 bg-grey-darken-4 pa-4 rounded">
                        <div class="text-subtitle-1 font-weight-bold mb-2 text-primary">API Access</div>
                        <p class="text-caption text-medium-emphasis mb-4">
                            Assign instances and generate a static token. This token is <strong>mandatory</strong> for sending messages via API.
                        </p>

                        <v-select
                            v-model="selectedInstances"
                            :items="instances"
                            item-title="name"
                            item-value="id"
                            label="Assigned Instances"
                            multiple
                            chips
                            variant="outlined"
                            density="compact"
                        ></v-select>

                        <div class="d-flex align-center mt-2">
                            <v-text-field
                                v-model="staticToken"
                                label="Static Token"
                                readonly
                                variant="outlined"
                                density="compact"
                                hide-details
                                class="mr-2"
                            ></v-text-field>
                            <v-btn color="secondary" :loading="tokenLoading" @click="generateToken">
                                Generate
                            </v-btn>
                        </div>
                    </div>

                    <v-alert v-if="error" type="error" density="compact" class="mt-4">{{ error }}</v-alert>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="dialog = false">Cancel</v-btn>
                <v-btn color="primary" @click="saveUser">Save User</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
  </v-container>
</template>



<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Contact {
    id: number;
    name: string;
    phone: string;
    email: string;
    tags: string;
    notes: string;
    source: string;
}

const contacts = ref<Contact[]>([]);
const search = ref('');
const loading = ref(false);
const dialog = ref(false);
const importDialog = ref(false);
const importFile = ref<File[]>([]); // Vuetify file input returns array

// Form Data
const form = ref({
    id: -1,
    name: '',
    phone: '',
    email: '',
    tags: '',
    notes: ''
});

const headers = [
    { title: 'Name', key: 'name' },
    { title: 'Phone', key: 'phone' },
    { title: 'Tags', key: 'tags' },
    { title: 'Source', key: 'source' },
    { title: 'Actions', key: 'actions', sortable: false },
];

const fetchContacts = async () => {
    loading.value = true;
    try {
        const res = await fetch('/backend/contacts', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            contacts.value = data.contacts;
        }
    } catch(e) { console.error(e); }
    loading.value = false;
};

const saveContact = async () => {
    const isEdit = form.value.id !== -1;
    const url = isEdit ? `/backend/contacts/${form.value.id}` : '/backend/contacts';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
             method,
             headers: { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${localStorage.getItem('token')}` 
             },
             body: JSON.stringify(form.value)
        });
        if (res.ok) {
            dialog.value = false;
            fetchContacts();
        } else {
             const data = await res.json();
             alert(data.error);
        }
    } catch(e) { console.error(e); }
};

const deleteContact = async (id: number) => {
    if(!confirm('Are you sure?')) return;
    await fetch(`/backend/contacts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchContacts();
};

const openEdit = (item: Contact) => {
    form.value = { ...item };
    dialog.value = true;
};

const openCreate = () => {
    form.value = { id: -1, name: '', phone: '', email: '', tags: '', notes: '' };
    dialog.value = true;
};

const handleImport = async () => {
    if (!importFile.value.length) return;
    const formData = new FormData();
    formData.append('file', importFile.value[0]);
    
    try {
         const res = await fetch('/backend/contacts/import', {
             method: 'POST',
             headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
             body: formData
        });
        if (res.ok) {
            importDialog.value = false;
            fetchContacts();
            alert('Import successful');
        }
    } catch(e) { console.error(e); }
};

const exportContacts = () => {
    // window.location.href = ... (Deprecated/Removed in previous logic, using fetch now)
    handleExportFetch();
};

const handleExportFetch = async () => {
    const res = await fetch('/backend/contacts/export', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if(res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contacts.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }
}

onMounted(fetchContacts);
</script>

<template>
  <v-container>
    <div class="d-flex align-center mb-4">
         <h1 class="text-h4 font-weight-bold">Address Book</h1>
         <v-spacer></v-spacer>
         <v-btn color="primary" @click="openCreate" prepend-icon="mdi-plus">Add Contact</v-btn>
    </div>

    <v-card>
        <v-data-table
            :headers="headers"
            :items="contacts"
            :search="search"
            :loading="loading"
        >
            <template v-slot:top>
                <v-toolbar flat color="transparent">
                    <v-toolbar-title>
                         <v-text-field
                            v-model="search"
                            density="compact"
                            label="Search"
                            prepend-inner-icon="mdi-magnify"
                            variant="solo-filled"
                            flat
                            hide-details
                            single-line
                        ></v-text-field>
                    </v-toolbar-title>
                    <v-divider class="mx-4" inset vertical></v-divider>
                    <v-btn color="success" variant="text" @click="importDialog = true">Import CSV</v-btn>
                    <v-btn color="info" variant="text" @click="exportContacts">Export CSV</v-btn>
                </v-toolbar>
            </template>

            <template v-slot:item.actions="{ item }">
                <v-icon size="small" class="me-2" @click="openEdit(item)">mdi-pencil</v-icon>
                <v-icon size="small" color="error" @click="deleteContact(item.id)">mdi-delete</v-icon>
            </template>
        </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
        <v-card>
            <v-card-title>{{ form.id === -1 ? 'New Contact' : 'Edit Contact' }}</v-card-title>
            <v-card-text>
                <v-text-field v-model="form.name" label="Name"></v-text-field>
                <v-text-field v-model="form.phone" label="Phone (Required)" required></v-text-field>
                <v-text-field v-model="form.email" label="Email"></v-text-field>
                <v-text-field v-model="form.tags" label="Tags (comma separated)"></v-text-field>
                <v-textarea v-model="form.notes" label="Notes" rows="3"></v-textarea>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="error" variant="text" @click="dialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="text" @click="saveContact">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Import Dialog -->
     <v-dialog v-model="importDialog" max-width="400px">
        <v-card>
            <v-card-title>Import CSV</v-card-title>
            <v-card-text>
                <v-file-input 
                    v-model="importFile" 
                    label="Select .csv file" 
                    accept=".csv"
                    show-size
                ></v-file-input>
                <div class="text-caption text-medium-emphasis">
                    Format: Name, Phone, Email, Tags, Notes
                </div>
            </v-card-text>
             <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="error" variant="text" @click="importDialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="text" @click="handleImport">Upload</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

  </v-container>
</template>

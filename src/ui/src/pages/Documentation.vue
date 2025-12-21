<script setup lang="ts">
</script>

<template>
  <v-container>
    <h1 class="text-h3 font-weight-bold text-primary mb-6">API Documentation</h1>
    
    <v-card class="mb-6">
        <v-card-title>Authentication</v-card-title>
        <v-card-text>
            <p class="mb-2">All API requests must include the Bearer token header:</p>
            <v-code class="d-block pa-2 rounded bg-surface">Authorization: Bearer &lt;your_token&gt;</v-code>
        </v-card-text>
    </v-card>

    <v-card class="mb-6">
        <v-card-title>Messaging Endpoints</v-card-title>
        <v-card-text>
            <v-list lines="two">
                <v-list-item>
                    <v-list-item-title class="font-weight-bold text-success">POST /api/wa/send/text/:instance_id</v-list-item-title>
                    <v-list-item-subtitle>{ "to": "1234567890", "message": "Hello" }</v-list-item-subtitle>
                </v-list-item>
                <v-divider></v-divider>
                 <v-list-item>
                    <v-list-item-title class="font-weight-bold text-success">POST /api/wa/send/image/:instance_id</v-list-item-title>
                    <v-list-item-subtitle>{ "to": "...", "url": "https://...", "caption": "..." }</v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
    
     <v-card>
        <v-card-title>Address Book</v-card-title>
         <v-card-text>
            <v-list>
                <v-list-item title="GET /api/contacts" subtitle="List all contacts"></v-list-item>
                <v-list-item title="POST /api/contacts" subtitle="Create new contact"></v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
  </v-container>
</template>

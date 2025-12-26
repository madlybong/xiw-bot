import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Pages
import Login from './pages/Login.vue'
import Dashboard from './pages/Dashboard.vue'
import Contacts from './pages/Contacts.vue'
import AuditLog from './pages/AuditLog.vue'
import Documentation from './pages/Documentation.vue'
import Users from './pages/Users.vue'
import License from './pages/License.vue'

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'dark'
    },
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        },
    },
})

const routes = [
    { path: '/login', component: Login },
    {
        path: '/',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/contacts',
        component: Contacts,
        meta: { requiresAuth: true }
    },
    {
        path: '/logs',
        component: AuditLog,
        meta: { requiresAuth: true }
    },
    {
        path: '/users',
        component: Users,
        meta: { requiresAuth: true }
    },
    {
        path: '/license',
        component: License,
        meta: { requiresAuth: true }
    },
    { path: '/docs', component: Documentation },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem('token');
    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
    } else {
        next();
    }
});

const app = createApp(App)
app.use(vuetify)
app.use(router)
app.mount('#root')

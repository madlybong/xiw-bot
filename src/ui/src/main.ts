import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './styles/glass.css' // Global Glass Theme

// Pages
import Login from './pages/Login.vue' // Will create next
import Dashboard from './pages/Dashboard.vue' // Will create next
import Contacts from './pages/Contacts.vue'
import AuditLog from './pages/AuditLog.vue'
import Documentation from './pages/Documentation.vue'
import Users from './pages/Users.vue'

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                colors: {
                    primary: '#7f5af0',
                    secondary: '#2cb67d',
                    background: '#0d0d0f',
                    surface: '#16161a',
                }
            }
        }
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

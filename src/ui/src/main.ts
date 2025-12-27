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

import './styles/main.css'

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                dark: true,
                colors: {
                    background: '#0B0E11', // Enterprise Dark
                    surface: '#15191E',    // Card Surface
                    primary: '#2962FF',    // Corporate Blue
                    secondary: '#78909C',  // Blue Grey
                    error: '#EF5350',
                    info: '#29B6F6',
                    success: '#66BB6A',
                    warning: '#FFA726',
                    'on-background': '#E0E0E0',
                    'on-surface': '#F5F5F5',
                }
            },
            light: {
                dark: false,
                colors: {
                    background: '#F5F7FA', // Cool Grey
                    surface: '#FFFFFF',
                    primary: '#2962FF',
                    secondary: '#78909C',
                    error: '#D32F2F',
                    info: '#0288D1',
                    success: '#388E3C',
                    warning: '#F57C00',
                }
            }
        }
    },
    defaults: {
        global: {
            ripple: false, // Minimalist feel
        },
        VCard: {
            elevation: 0,
            border: true,
            rounded: 'lg', // 8px-12px range usually
        },
        VBtn: {
            variant: 'flat',
            height: 40,
            rounded: '8', // Compact radius
            class: 'text-none font-weight-medium letter-spacing-normal' // No Caps
        },
        VTextField: {
            variant: 'outlined',
            density: 'compact',
            color: 'primary',
            hideDetails: 'auto'
        },
        VTextarea: {
            variant: 'outlined',
            density: 'compact',
            color: 'primary',
            hideDetails: 'auto'
        },
        VSelect: {
            variant: 'outlined',
            density: 'compact',
            color: 'primary',
            hideDetails: 'auto'
        },
        VCheckbox: {
            color: 'primary',
            density: 'compact',
            hideDetails: 'auto'
        },
        VSwitch: {
            color: 'primary',
            density: 'compact',
            hideDetails: 'auto',
            inset: true
        },
        VTable: {
            density: 'compact',
            class: 'border-thin',
        },
        VDataTable: {
            density: 'compact',
            hover: true,
        },
        VList: {
            density: 'compact',
        },
        VChip: {
            label: true,
            size: 'small',
            class: 'font-weight-bold text-uppercase',
            rounded: 'sm'
        },
        VListItem: {
            rounded: 'xl', // Capsule hovers
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

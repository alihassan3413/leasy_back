import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router'
import App from './App.vue'
import { useAuthStore } from './stores/auth'
import './style.css'

// ── Bootstrap ──────────────────────────────────────────────────────────────
// Pinia must be created and installed before any store is accessed,
// including inside router guards, so the order here matters.

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Vue SFC component types include `any` in their generics by design — this
// is a known limitation of the Vue + TypeScript type system, not a bug here.
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const app = createApp(App)
app.use(pinia)
app.use(router)

// Wire the Axios client to the auth store's token state.
// Must be called after Pinia is mounted so the store can be instantiated.
useAuthStore().bootstrap()

app.mount('#app')

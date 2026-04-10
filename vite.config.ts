import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    AutoImport({
      imports: ['vue', 'vue-router'],
      dts: 'src/types/auto-imports.d.ts',
    }),
    Components({
      dirs: ['src/components'],
      dts: 'src/types/components.d.ts',
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            if (['vue', 'vue-router', 'pinia'].some((pkg) => id.includes(`/${pkg}/`))) {
              return 'vendor'
            }
            if (['axios', 'dayjs'].some((pkg) => id.includes(`/${pkg}/`))) {
              return 'utils'
            }
          }
        },
      },
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})

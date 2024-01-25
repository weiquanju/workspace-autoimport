import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'
import ComponentsResolver from 'components/auto-import'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Components({
      // globs: ['src/components/**/*.{vue}'],
      dts: './components.d.ts',
      types: [],
      resolvers: [ComponentsResolver],
      exclude: [/[\\/]node_modules[\\/]/]
    }),
    vue(),
    vueJsx()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const resolver = await import('components/auto-import').then((res) => res.default)
  return {
    plugins: [
      Components({
        // globs: ['src/components/**/*.{vue}'],
        dts: './components.d.ts',
        types: [],
        resolvers: [resolver],
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
  }
})

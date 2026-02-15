import { defineConfig, externalizeDepsPlugin, bytecodePlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['electron'] }), bytecodePlugin()],
    build: {
      outDir: 'dist-electron',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.js')
        }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'src/renderer/index.html')
      }
    }
  }
})

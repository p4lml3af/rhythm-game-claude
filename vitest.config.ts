import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/renderer/game/**', 'src/shared/**'],
      thresholds: {
        'src/renderer/game/hitDetection.ts': { statements: 100, branches: 100 },
        'src/renderer/game/noteRenderer.ts': { statements: 80 },
      }
    }
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@game': resolve(__dirname, 'src/renderer/game'),
    }
  }
})

import { defineConfig } from 'vitest/config'

// Unit tests run in plain Node; the few browser globals the store touches
// (AudioBuffer, AudioContext, URL.createObjectURL, localStorage) are stubbed
// in tests/setup.ts so no DOM environment is needed.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    setupFiles: ['tests/setup.ts'],
  },
})

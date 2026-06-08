import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        AudioContext: 'readonly',
        OfflineAudioContext: 'readonly',
        AudioEncoder: 'readonly',
        AudioData: 'readonly',
        MediaRecorder: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        Promise: 'readonly',
        Worker: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        indexedDB: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Web Worker environment
    files: ['src/workers/**/*.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        importScripts: 'readonly',
        lamejs: 'readonly',
        postMessage: 'readonly',
        addEventListener: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**'],
  },
]

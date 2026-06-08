import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
      globals: {
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
        IDBDatabase: 'readonly',
        IDBOpenDBRequest: 'readonly',
        FileSystemEntry: 'readonly',
        FileSystemFileEntry: 'readonly',
        FileSystemDirectoryEntry: 'readonly',
        AudioBuffer: 'readonly',
        AudioBufferSourceNode: 'readonly',
        Float32Array: 'readonly',
        Int16Array: 'readonly',
        Uint8Array: 'readonly',
        ArrayBuffer: 'readonly',
        DataView: 'readonly',
        HTMLAudioElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        DOMException: 'readonly',
        MessageEvent: 'readonly',
        DragEvent: 'readonly',
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Web Worker — plain JS, no TS parser
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

// @vitest-environment jsdom
/**
 * Theme-Mechanik (portiert aus dem Settings-Store des Collage Makers):
 * html[data-theme] + body.light-theme + html.dark, Standard Light, Sync mit der
 * SSI-Navigation über `theme-changed` und direkte data-theme-Änderungen, sowie
 * das Pre-Paint-Skript in index.html.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'

type ThemeModule = typeof import('../src/composables/useTheme')

async function loadTheme(): Promise<ThemeModule> {
  vi.resetModules()
  return import('../src/composables/useTheme')
}

/** MutationObserver-Callbacks laufen als Microtask. */
const flushMutations = () => new Promise((resolve) => setTimeout(resolve, 0))

let mod: ThemeModule | null = null

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.className = ''
  document.body.className = ''
  document.body.innerHTML = ''
})

afterEach(() => {
  mod?.stopThemeSync()
  mod = null
})

describe('useTheme', () => {
  it('startet ohne gespeicherten Wert in Light und setzt alle Marker', async () => {
    mod = await loadTheme()
    const { theme } = mod.useTheme()

    expect(theme.value).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.body.classList.contains('light-theme')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('übernimmt ein gespeichertes Dark-Theme', async () => {
    localStorage.setItem('theme', 'dark')
    mod = await loadTheme()
    const { theme, isDark } = mod.useTheme()

    expect(theme.value).toBe('dark')
    expect(isDark()).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.body.classList.contains('light-theme')).toBe(false)
  })

  it('ignoriert ungültige gespeicherte Werte', async () => {
    localStorage.setItem('theme', 'sepia')
    mod = await loadTheme()
    expect(mod.useTheme().theme.value).toBe('light')
  })

  it('schaltet um, speichert und synchronisiert das Theme-Icon der SSI-Navigation', async () => {
    document.body.innerHTML = '<span class="global-nav-theme-icon"></span>'
    mod = await loadTheme()
    const { theme, toggleTheme } = mod.useTheme()

    toggleTheme()

    expect(theme.value).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(document.querySelector('.global-nav-theme-icon')?.textContent).toBe('☀️')

    toggleTheme()
    expect(document.querySelector('.global-nav-theme-icon')?.textContent).toBe('🌙')
  })

  it('teilt den Zustand zwischen mehreren Aufrufen', async () => {
    mod = await loadTheme()
    const a = mod.useTheme()
    const b = mod.useTheme()
    a.toggleTheme()
    expect(b.theme.value).toBe('dark')
  })

  it('folgt dem theme-changed-Event der SSI-Navigation', async () => {
    mod = await loadTheme()
    const { theme } = mod.useTheme()

    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'dark' } }))
    expect(theme.value).toBe('dark')
    expect(document.body.classList.contains('light-theme')).toBe(false)

    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: 'bogus' } }))
    expect(theme.value).toBe('dark')
  })

  it('folgt einer direkten Änderung von html[data-theme] (SSI-Navigation)', async () => {
    mod = await loadTheme()
    const { theme } = mod.useTheme()

    document.documentElement.setAttribute('data-theme', 'dark')
    await flushMutations()

    expect(theme.value).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('funktioniert, wenn localStorage blockiert ist', async () => {
    const getItem = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      mod = await loadTheme()
      const { theme, toggleTheme } = mod.useTheme()
      expect(theme.value).toBe('light')
      toggleTheme()
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    } finally {
      getItem.mockRestore()
      setItem.mockRestore()
    }
  })
})

describe('Pre-Paint-Skript in index.html', () => {
  const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8')
  const head = html.slice(0, html.indexOf('</head>'))
  const script = [...head.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1] ?? '')
    .find((code) => code.includes("'data-theme'"))

  function run(stored: string | null, throws = false): string | null {
    let value: string | null = null
    const context = {
      localStorage: {
        getItem: () => {
          if (throws) throw new Error('blocked')
          return stored
        },
      },
      document: {
        documentElement: {
          setAttribute: (_name: string, next: string) => {
            value = next
          },
        },
      },
    }
    runInNewContext(script ?? '', context)
    return value
  }

  it('steht im <head> vor dem App-Bundle', () => {
    expect(script).toBeDefined()
    expect(html.indexOf("'data-theme'")).toBeLessThan(html.indexOf('/src/main.ts'))
  })

  it('setzt data-theme aus localStorage mit Light als Standard', () => {
    expect(run('dark')).toBe('dark')
    expect(run('light')).toBe('light')
    expect(run(null)).toBe('light')
    expect(run('sepia')).toBe('light')
    expect(run(null, true)).toBe('light')
  })

  it('nutzt die Token-Flächen als theme-color', () => {
    expect(head).toContain('content="#f6f5f1" media="(prefers-color-scheme: light)"')
    expect(head).toContain('content="#0a1324" media="(prefers-color-scheme: dark)"')
  })
})

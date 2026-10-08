import { ref, watch, type Ref } from 'vue'

/**
 * Theme-Mechanik wie im Collage Maker / Playlist Generator:
 *
 * - `html[data-theme]` schaltet die Design-Tokens (--ds-*) und die globale
 *   SSI-Navigation (nav/footer/cookie-banner sind Partials außerhalb von #app),
 * - `body.light-theme` hält Parität zu den anderen KodiniTools-Apps,
 * - `html.dark` bleibt als Altbestand für externe Skripte erhalten.
 *
 * Ein Inline-Skript in index.html setzt `data-theme` vor dem ersten Paint aus
 * `localStorage.theme`; dieses Modul übernimmt danach. Umschaltungen der
 * SSI-Navigation kommen als `theme-changed`-Event oder als direkte Änderung von
 * `html[data-theme]` an (MutationObserver). Standard ist Light.
 */

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'
export const DEFAULT_THEME: Theme = 'light'

/** Mond in Light (wechselt zu Dark), Sonne in Dark — wie das SSI-Partial. */
const NAV_ICON: Record<Theme, string> = { light: '🌙', dark: '☀️' }

export function normalizeTheme(value: unknown): Theme | null {
  return value === 'light' || value === 'dark' ? value : null
}

/** Gespeichertes Theme, sonst der Standard (auch wenn localStorage blockiert ist). */
export function readStoredTheme(): Theme {
  try {
    return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY)) ?? DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

/** Setzt alle Theme-Marker im DOM; idempotent. */
export function applyTheme(next: Theme): void {
  const root = document.documentElement
  if (root.getAttribute('data-theme') !== next) root.setAttribute('data-theme', next)
  root.classList.toggle('dark', next === 'dark')
  document.body?.classList.toggle('light-theme', next === 'light')
  document.querySelectorAll('.global-nav-theme-icon').forEach((icon) => {
    icon.textContent = NAV_ICON[next]
  })
}

const theme = ref<Theme>(DEFAULT_THEME)
let started = false
let observer: MutationObserver | null = null
let stopWatch: (() => void) | null = null

function onThemeChanged(event: Event): void {
  const next = normalizeTheme((event as CustomEvent<{ theme?: string }>).detail?.theme)
  if (next && next !== theme.value) theme.value = next
}

function onDataThemeMutation(): void {
  const next = normalizeTheme(document.documentElement.getAttribute('data-theme'))
  if (next && next !== theme.value) theme.value = next
}

function startThemeSync(): void {
  if (started) return
  started = true

  theme.value = readStoredTheme()
  stopWatch = watch(
    theme,
    (next) => {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // Speichern ist optional (z. B. privater Modus); das Theme gilt trotzdem.
      }
      applyTheme(next)
    },
    { immediate: true, flush: 'sync' },
  )

  window.addEventListener('theme-changed', onThemeChanged)
  observer = new MutationObserver(onDataThemeMutation)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
}

/** Beendet die Synchronisation (Tests, HMR). */
export function stopThemeSync(): void {
  stopWatch?.()
  stopWatch = null
  observer?.disconnect()
  observer = null
  window.removeEventListener('theme-changed', onThemeChanged)
  started = false
}

export function useTheme(): {
  theme: Ref<Theme>
  toggleTheme: () => void
  isDark: () => boolean
} {
  startThemeSync()

  const toggleTheme = (): void => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return {
    theme,
    toggleTheme,
    isDark: (): boolean => theme.value === 'dark',
  }
}

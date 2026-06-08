import { ref, watch } from 'vue'

const theme = ref<string>(localStorage.getItem('theme') ?? 'dark')

// Sync with SSI navigation theme-changed events (from global-nav)
window.addEventListener('theme-changed', (e) => {
  const newTheme = (e as CustomEvent<{ theme: string }>).detail?.theme
  if (newTheme && newTheme !== theme.value) {
    theme.value = newTheme
  }
})

export function useTheme() {
  const toggleTheme = (): void => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  watch(
    theme,
    (newTheme) => {
      localStorage.setItem('theme', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    },
    { immediate: true },
  )

  return {
    theme,
    toggleTheme,
    isDark: (): boolean => theme.value === 'dark',
  }
}

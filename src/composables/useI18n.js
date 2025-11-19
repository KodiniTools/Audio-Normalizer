import { useI18n as useVueI18n } from 'vue-i18n'

export function useI18n() {
  const { t, locale } = useVueI18n()

  const toggleLocale = () => {
    locale.value = locale.value === 'de' ? 'en' : 'de'
    localStorage.setItem('locale', locale.value)
    console.log('Sprache gewechselt zu:', locale.value)
  }

  const setLocale = (newLocale) => {
    locale.value = newLocale
    localStorage.setItem('locale', newLocale)
  }

  return {
    t,
    locale,
    toggleLocale,
    setLocale
  }
}
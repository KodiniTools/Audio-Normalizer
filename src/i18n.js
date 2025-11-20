import { createI18n } from 'vue-i18n'
import de from './lokales/de.json'
import en from './lokales/en.json'

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: localStorage.getItem('locale') || 'de',
  fallbackLocale: 'en',
  globalInjection: true,
  messages: {
    de,
    en
  }
})

export default i18n
import { ref, computed, shallowRef } from 'vue'
import de from '../locales/de.json'
import { isLocale, resolveInitialLocale, type Locale } from '../utils/localeUrl'

type Messages = Record<string, string>

// Deutsch ist im Haupt-Bundle; Englisch wird erst bei Bedarf als eigener Chunk geladen.
const loaders: Record<Locale, () => Promise<Messages>> = {
  de: () => Promise.resolve(de),
  en: () => import('../locales/en.json').then((m) => m.default),
}
const messages = shallowRef<Partial<Record<Locale, Messages>>>({ de })

// Startsprache: ?lang=de|en (Ziel der hreflang-Links) vor gespeicherter Wahl, sonst Deutsch.
// Wird gespeichert, damit die SSI-Navigation (liest `locale`) dieselbe Sprache zeigt.
const initialLocale = resolveInitialLocale(
  globalThis.location?.search ?? '',
  localStorage.getItem('locale'),
)
localStorage.setItem('locale', initialLocale)
const currentLocale = ref<string>(initialLocale)

const loadMessages = async (locale: string): Promise<void> => {
  if (!isLocale(locale) || messages.value[locale]) return
  try {
    const loaded = await loaders[locale]()
    messages.value = { ...messages.value, [locale]: loaded }
  } catch (err) {
    console.error(`Übersetzungen für "${locale}" konnten nicht geladen werden`, err)
  }
}

/** Lädt die Übersetzungen der aktiven Sprache; vor dem Mounten der App abwarten. */
export const loadActiveLocale = (): Promise<void> => loadMessages(currentLocale.value)

// Bei schnellen Wechseln gewinnt der zuletzt angeforderte, nicht der zuletzt geladene.
let switchSeq = 0
let requestedLocale = currentLocale.value
const switchLocale = async (newLocale: string): Promise<boolean> => {
  const seq = ++switchSeq
  requestedLocale = newLocale
  await loadMessages(newLocale)
  if (seq !== switchSeq) return false
  currentLocale.value = newLocale
  return true
}

export function useI18n() {
  const locale = computed(() => currentLocale.value)

  // Verbesserte t-Funktion für dynamische Platzhalter wie {count}
  const t = (key: string, replacements: Record<string, unknown> = {}): string => {
    const loaded = messages.value
    const lang = isLocale(currentLocale.value) ? loaded[currentLocale.value] : undefined
    let message: string = lang?.[key] ?? loaded.de?.[key] ?? key

    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{\\s*${placeholder}\\s*}`, 'g')
      message = message.replace(regex, String(value))
    }

    return message
  }

  /**
   * Translates ALL SSI-included elements (Nav, Footer, Cookie Banner).
   *
   * Supported patterns:
   *   data-i18n          → textContent  (nav.html SSI attributes)
   *   data-i18n-aria     → aria-label   (nav.html SSI attributes)
   *   data-lang-de / data-lang-en → textContent (cookie-banner.html, footer.html)
   *
   * Dispatches 'locale-changed' and 'language-changed' so SSI-Includes
   * with their own JS (e.g. CookieConsent, Footer) can also react.
   */
  const translateSsiIncludes = () => {
    const lang = currentLocale.value

    // ── Nav: data-i18n → textContent (matches nav.html SSI attributes) ──
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n')
      if (!key) return
      const translated = t(key)
      if (translated !== key) el.textContent = translated
    })

    // ── Nav: data-i18n-aria → aria-label (matches nav.html SSI attributes) ──
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria')
      if (!key) return
      const translated = t(key)
      if (translated !== key) el.setAttribute('aria-label', translated)
    })

    // ── Nav aria-label ──
    const nav = document.querySelector('.global-nav')
    if (nav) {
      const mainNavLabel = t('aria.mainNav')
      if (mainNavLabel !== 'aria.mainNav') {
        nav.setAttribute('aria-label', mainNavLabel)
      }
    }

    // ── Footer / Cookie Banner: data-lang-de / data-lang-en ──
    const langAttr = 'data-lang-' + lang
    document.querySelectorAll('[' + langAttr + ']').forEach((el) => {
      el.textContent = el.getAttribute(langAttr)
    })

    // ── Sync aktiven Sprach-Button in SSI-Nav ──
    if (nav) {
      nav.querySelectorAll('.global-nav-lang-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang)
      })
    }

    // ── Events dispatchen für SSI-Includes (Footer, Cookie-Banner) ──
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: lang } }))
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }))
  }

  const setLocale = async (newLocale: string): Promise<void> => {
    if (!(await switchLocale(newLocale))) return
    localStorage.setItem('locale', newLocale)
    document.documentElement.setAttribute('lang', newLocale)
    translateSsiIncludes()
  }

  const toggleLocale = (): Promise<void> => setLocale(requestedLocale === 'de' ? 'en' : 'de')

  /**
   * Intercepts clicks on SSI navigation language buttons (.global-nav-lang-btn)
   * to prevent page reload. Instead updates the Vue locale reactively and
   * translates ALL SSI includes (Nav, Footer, Cookie Banner) via Vue i18n.
   * Must be called once after DOM is ready (e.g. in App.vue onMounted).
   */
  const initSsiLanguage = () => {
    const nav = document.querySelector('.global-nav')
    if (!nav) return

    // Capturing listener on the nav container runs BEFORE the SSI nav's
    // own handlers on the button, so stopPropagation() prevents the reload.
    nav.addEventListener(
      'click',
      (e) => {
        const langBtn = (e.target as Element | null)?.closest('.global-nav-lang-btn')
        if (!langBtn) return

        e.stopPropagation()
        e.preventDefault()

        const targetLang = langBtn.getAttribute('data-lang')
        if (!targetLang || targetLang === requestedLocale) return

        // Update Vue reactive locale (no page reload) and translate all SSI includes
        void setLocale(targetLang)
      },
      true,
    ) // ← capturing phase

    // Listen for locale-changed from nav's own JS (fallback sync)
    window.addEventListener('locale-changed', (e) => {
      const detail = (e as CustomEvent<{ locale?: string }>).detail
      const newLocale = detail?.locale
      if (newLocale && newLocale !== requestedLocale) {
        void switchLocale(newLocale).then((switched) => {
          if (switched) translateSsiIncludes()
        })
      }
    })

    // Initial translation to sync all SSI includes with Vue locale on mount
    translateSsiIncludes()
  }

  return {
    t,
    locale,
    toggleLocale,
    setLocale,
    translateSsiIncludes,
    initSsiLanguage,
  }
}

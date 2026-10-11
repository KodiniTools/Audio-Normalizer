/** Sprachen, für die ein eigenes Landingpage-Bild in `public/` liegt. */
export const LANDING_IMAGE_LOCALES = ['de', 'en'] as const
export type LandingImageLocale = (typeof LANDING_IMAGE_LOCALES)[number]

/** Intrinsische Bildmaße (px) – verhindern Layout-Shift beim Laden. */
export const LANDING_IMAGE_WIDTH = 800
export const LANDING_IMAGE_HEIGHT = 447

/**
 * URL des sprachabhängigen Landingpage-Bildes.
 * Unbekannte Sprachen fallen auf Deutsch (App-Standard) zurück.
 */
export function landingImageSrc(locale: string, baseUrl: string): string {
  const lang: LandingImageLocale = (LANDING_IMAGE_LOCALES as readonly string[]).includes(locale)
    ? (locale as LandingImageLocale)
    : 'de'
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return `${base}normalizer-landingpage-${lang}.webp`
}

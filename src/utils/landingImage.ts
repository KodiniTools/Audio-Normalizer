/**
 * Sprachen, für die ein Landingpage-Bild in `public/` liegt. Das aktuelle Motiv
 * (Tonstudio mit Wellenform-Vergleich Original/Normalisiert) ist sprachneutral; beide Dateien sind identisch.
 */
export const LANDING_IMAGE_LOCALES = ['de', 'en'] as const
export type LandingImageLocale = (typeof LANDING_IMAGE_LOCALES)[number]

/** Intrinsische Bildmaße (px) – verhindern Layout-Shift beim Laden. */
export const LANDING_IMAGE_WIDTH = 1120
export const LANDING_IMAGE_HEIGHT = 625

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

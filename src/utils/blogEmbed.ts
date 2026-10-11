/** Blogbeitrag, den der Tab „Blog“ einbettet. */
export const BLOG_POST_URL = 'https://kodinitools.com/blog/audio-normalisieren/'

/** Mindesthöhe des iframes in px, solange die Inhaltshöhe unbekannt ist. */
export const BLOG_FRAME_MIN_HEIGHT = 640

/**
 * Inhaltshöhe eines eingebetteten Dokuments in px.
 *
 * Nur bei gleichem Ursprung lesbar (Produktion: App und Blog liegen beide auf
 * kodinitools.com). Bei fremdem Ursprung (z. B. lokaler Dev-Server) wirft der
 * Zugriff auf `contentDocument` bzw. liefert `null`; dann gibt die Funktion
 * `null` zurück und der Aufrufer behält die feste Höhe.
 */
export function measureFrameHeight(
  frame: Pick<HTMLIFrameElement, 'contentDocument'>,
): number | null {
  try {
    const doc = frame.contentDocument
    const height = Math.max(doc?.documentElement?.scrollHeight ?? 0, doc?.body?.scrollHeight ?? 0)
    return height > 0 ? height : null
  } catch {
    return null
  }
}

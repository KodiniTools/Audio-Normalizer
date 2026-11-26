export interface HeroTitleParts {
  first: string
  rest: string
}

/** Teilt den Hero-Titel am ersten Leerzeichen: „Audio Normalizer“ → „Audio“ + „Normalizer“. */
export function splitHeroTitle(title: string): HeroTitleParts {
  const trimmed = title.trim()
  const index = trimmed.search(/\s/)
  if (index === -1) return { first: trimmed, rest: '' }
  return { first: trimmed.slice(0, index), rest: trimmed.slice(index).trim() }
}

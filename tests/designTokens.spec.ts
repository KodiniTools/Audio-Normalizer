/**
 * Regressionsschutz für die Design-Tokens der Oberfläche.
 *
 * Portiert aus KodiniTools/Collage-Maker (src/tests/designTokens.spec.ts und
 * buttonContrast.spec.ts). Dort prüfen die Tests Tailwind-Klassen; der Audio
 * Normalizer schreibt plain CSS, deshalb prüfen sie hier die Deklarationen in
 * src/assets/*.css und in den <style>-Blöcken aller Vue-Komponenten:
 *
 * - nur --ds-*-Variablen (plus wenige lokale Hilfsvariablen), alle definiert,
 * - keine festen Farbwerte, Gradients, Blur, Karten-Schatten, Hover-Transforms,
 * - nur Token-Radien, -Dauern und -Schriftgrade,
 * - Gold-Flächen tragen immer --ds-on-accent als Textfarbe,
 * - Supreme wird in allen genutzten Gewichten gebündelt geladen.
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parseBlock } from './design-system/tokenTestUtils'

const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'src')

interface CssSource {
  file: string
  css: string
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

const files = walk(SRC)
const vueFiles = files.filter((file) => file.endsWith('.vue'))
const tokensCss = readFileSync(join(SRC, 'design-system', 'tokens-v2.css'), 'utf8')
const definedTokens = new Set(Object.keys(parseBlock(tokensCss, ':root', 'tokens-v2.css')))

/** CSS aller Stylesheets und <style>-Blöcke außer der Token-Datei selbst. */
const sources: CssSource[] = [
  ...files
    .filter((file) => file.endsWith('.css') && !file.includes('design-system'))
    .map((file) => ({ file, css: readFileSync(file, 'utf8') })),
  ...vueFiles.flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({
      file,
      css: m[1] ?? '',
    })),
  ),
].map(({ file, css }) => ({ file, css: css.replace(/\/\*[\s\S]*?\*\//g, '') }))

/** Alle Deklarationen als "datei: eigenschaft: wert". */
const declarations = sources.flatMap(({ file, css }) =>
  [...css.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)].map((m) => ({
    file: relative(ROOT, file),
    property: m[1] ?? '',
    value: (m[2] ?? '').replace(/\s+/g, ' ').trim(),
  })),
)

/** Alle innersten Regeln (Selektor + Körper), auch innerhalb von @media. */
const rules = sources.flatMap(({ file, css }) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    file: relative(ROOT, file),
    selector: (m[1] ?? '').replace(/\s+/g, ' ').trim(),
    body: m[2] ?? '',
  })),
)

const show = (d: { file: string; property: string; value: string }) =>
  `${d.file}: ${d.property}: ${d.value}`

/** Lokale Hilfsvariablen von Komponenten (Statusfarbe des Toasts, Fortschritt des Players). */
const LOCAL_VARS = new Set(['--toast-accent', '--pb-progress'])

describe('Variablen', () => {
  it('nutzen nur --ds-* und die lokalen Hilfsvariablen (keine alte Palette)', () => {
    const offenders = declarations.flatMap((d) =>
      [...d.value.matchAll(/var\((--[\w-]+)/g)]
        .map((m) => m[1] ?? '')
        .filter((name) => !name.startsWith('--ds-') && !LOCAL_VARS.has(name))
        .map((name) => `${show(d)} (${name})`),
    )
    expect(offenders).toEqual([])
  })

  it('deklarieren außerhalb der Token-Datei keine eigenen Custom Properties', () => {
    const offenders = declarations.filter(
      (d) => d.property.startsWith('--') && !LOCAL_VARS.has(d.property),
    )
    expect(offenders.map(show)).toEqual([])
  })

  it('referenzieren nur definierte --ds-*-Tokens', () => {
    const undefinedVars = declarations.flatMap((d) =>
      [...d.value.matchAll(/var\((--ds-[\w-]+)/g)]
        .map((m) => m[1] ?? '')
        .filter((name) => !definedTokens.has(name))
        .map((name) => `${show(d)} (${name})`),
    )
    expect(undefinedVars).toEqual([])
  })
})

describe('Farben und Effekte', () => {
  it('enthalten keine festen Farbwerte (nur der Overlay-Scrim ist erlaubt)', () => {
    const color = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(|\b(?:white|black)\b/i
    const scrim = 'rgba(0, 0, 0, 0.6)'
    const offenders = declarations.filter((d) => color.test(d.value) && d.value !== scrim)
    expect(offenders.map(show)).toEqual([])
  })

  it('nutzen keine Gradients (außer der harten Fortschrittskante des Players)', () => {
    const offenders = declarations.filter(
      (d) => /gradient\(/.test(d.value) && !d.value.includes('var(--pb-progress'),
    )
    expect(offenders.map(show)).toEqual([])
  })

  it('nutzen keinen Blur und keine Helligkeitsfilter', () => {
    const offenders = declarations.filter(
      (d) =>
        d.property === 'backdrop-filter' ||
        (d.property === 'filter' && !d.value.includes('saturate(100%)')),
    )
    expect(offenders.map(show)).toEqual([])
  })

  it('setzen Schatten nur über Overlay- und Fokus-Token', () => {
    const allowed = new Set([
      'var(--ds-shadow-overlay)',
      'var(--ds-focus-ring)',
      'inset 0 0 0 2px var(--ds-accent)',
      'none',
    ])
    const offenders = declarations.filter(
      (d) => d.property === 'box-shadow' && !allowed.has(d.value),
    )
    expect(offenders.map(show)).toEqual([])
  })

  it('ändern bei Hover nie die Größe oder Position', () => {
    const offenders = rules.filter(
      (r) => r.selector.includes(':hover') && /\btransform\s*:/.test(r.body),
    )
    expect(offenders.map((r) => `${r.file}: ${r.selector}`)).toEqual([])
  })

  it('setzen auf Gold-Flächen immer --ds-on-accent als Textfarbe', () => {
    // Flächen ohne Text (Daumen, Füllbalken) sind ausgenommen.
    const offenders = rules.filter(
      (r) =>
        /background(?:-color)?\s*:\s*var\(--ds-accent\)/.test(r.body) &&
        !/thumb|fill/.test(r.selector) &&
        !/(?:^|[\s;])color\s*:\s*var\(--ds-on-accent\)/.test(r.body),
    )
    expect(offenders.map((r) => `${r.file}: ${r.selector}`)).toEqual([])
  })
})

describe('Form, Motion, Typografie', () => {
  it('nutzen nur die Token-Radien (plus 50 % für Kreise)', () => {
    const offenders = declarations.filter(
      (d) =>
        d.property === 'border-radius' &&
        !/^(?:var\(--ds-radius-(?:sm|md|lg|full)\)|50%|0)$/.test(d.value),
    )
    expect(offenders.map(show)).toEqual([])
  })

  it('nutzen in Transitions nur die Token-Dauern', () => {
    const offenders = declarations.filter(
      (d) => d.property === 'transition' && /\d(?:ms|s)\b/.test(d.value),
    )
    expect(offenders.map(show)).toEqual([])
  })

  it('bleiben in der Token-Skala --ds-text-xs … --ds-text-3xl', () => {
    const offenders = declarations.filter(
      (d) =>
        d.property === 'font-size' &&
        !/^var\(--ds-text-(?:xs|sm|md|lg|xl|2xl|3xl)\)(?: !important)?$/.test(d.value),
    )
    expect(offenders.map(show)).toEqual([])
  })

  it('nutzen nur Token-Gewichte (außer den physischen Gewichten in @font-face)', () => {
    const offenders = rules
      .filter((r) => !r.selector.endsWith('@font-face'))
      .flatMap((r) =>
        [...r.body.matchAll(/font-weight\s*:\s*([^;]+);/g)]
          .map((m) => (m[1] ?? '').trim())
          .filter((value) => !/^var\(--ds-weight-\w+\)$/.test(value))
          .map((value) => `${r.file}: ${r.selector}: ${value}`),
      )
    expect(offenders).toEqual([])
  })
})

describe('Vue-Templates', () => {
  it('enthalten keine Tailwind-Reste (dark:, Gradients, Standardfarben)', () => {
    const pattern =
      /\bdark:|\bbg-gradient-to-\w+|\b(?:bg|text|border|from|to)-(?:slate|gray|blue|purple|red|green)-\d{2,3}\b|\bbg-white\/\d+/
    const hits = vueFiles.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, index) =>
          pattern.test(line) ? [`${relative(ROOT, file)}:${index + 1}`] : [],
        ),
    )
    expect(hits).toEqual([])
  })
})

describe('UI-Schrift Supreme', () => {
  const stylesCss = readFileSync(join(SRC, 'assets', 'styles.css'), 'utf8')
  const faces = (stylesCss.match(/@font-face\s*{[^}]*}/g) ?? []).filter((face) =>
    /font-family:\s*'Supreme'/.test(face),
  )

  it.each([
    [400, 'Regular'],
    [500, 'Medium'],
    [700, 'Bold'],
  ])('deklariert @font-face für Gewicht %i aus dem Bundle', (weight, name) => {
    const face = faces.find((f) => new RegExp(`font-weight:\\s*${weight}\\b`).test(f))
    expect(face, `Kein @font-face für Supreme ${weight}`).toBeDefined()
    expect(face).toContain(`url('./fonts/Supreme-${name}.woff2')`)
    expect(existsSync(join(SRC, 'assets', 'fonts', `Supreme-${name}.woff2`))).toBe(true)
  })

  it('setzt Schrift und Grundgröße des Body aus den Tokens', () => {
    expect(stylesCss).toMatch(/body \{[^}]*font-family: var\(--ds-font-sans\)/)
    expect(stylesCss).toMatch(/body \{[^}]*font-size: var\(--ds-text-lg\)/)
  })

  it('verweist auf keine Schriftdatei außerhalb des Bundles (/fonts/…)', () => {
    expect(stylesCss).not.toMatch(/url\(['"]?\/fonts\//)
  })
})

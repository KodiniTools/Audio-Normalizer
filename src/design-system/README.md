# Design-System · Tokens v2

Design Tokens des Audio Normalizers. Sie sind eine Kopie der v2-Tokens des Collage Makers
(`KodiniTools/Collage-Maker`, `src/design-system/`, Stand `9dc4eca`), der sie vom Playlist
Generator übernimmt. So teilen die Apps auf kodinitools.com dieselbe Palette, dieselben Radien,
dieselbe Motion und dieselbe Schrift (Supreme). Werte werden dort gepflegt und hierher übernommen.

## Dateien

| Datei                                   | Zweck                                                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `tokens-v2.css`                         | **Laufzeit-Quelle.** CSS Custom Properties `--ds-*`, Dark auf `:root`, Light auf `.light-theme` und `:root[data-theme='light']`. |
| `tokens-v2.json`                        | Maschinenlesbare Fassung (W3C-Design-Tokens-nah), `$extensions.css` nennt die Variable.                                          |
| `tokens-v2.ts`                          | Typisierter Zugriff für TS, z. B. `themeColorsV2('light')`.                                                                      |
| `tests/design-system/tokens-v2.spec.ts` | Konsistenz JSON ↔ CSS, Light-Spiegelung, Namespace, Kontrast-Audit (WCAG AA), Einbindung.                                        |
| `tests/design-system/tokenTestUtils.ts` | CSS-Block-Parser, Token-Walker, Kontrastberechnung.                                                                              |
| `tests/designTokens.spec.ts`            | Regressionsschutz für alle Stylesheets und `<style>`-Blöcke (siehe Regeln).                                                      |
| `tests/useTheme.spec.ts`                | Theme-Mechanik und Pre-Paint-Skript.                                                                                             |

Eingebunden werden die Tokens über `src/assets/styles.css` (`@import` als erste Regel), das
`main.ts` lädt. Dort stehen auch die `@font-face`-Regeln für Supreme 400/500/700 aus
`src/assets/fonts/`, die Basis-Styles und die Angleichung der SSI-Partials (Nav, Footer,
Cookie-Banner). App-spezifische Styles: `src/assets/audio-app.css`.

## Theme-Mechanik

`src/composables/useTheme.ts` setzt `html[data-theme]` (für Tokens und SSI-Partials),
`body.light-theme` (Parität zu den anderen Apps) und `html.dark` (Altbestand für externe Skripte)
und synchronisiert das Theme-Icon der SSI-Navigation. Umschaltungen der Navigation kommen als
`theme-changed`-Event oder als direkte Änderung von `html[data-theme]` (MutationObserver) an.
Ein Inline-Skript in `index.html` setzt `data-theme` vor dem ersten Paint aus
`localStorage.theme`, damit es keinen Dark-Flash gibt. Standard ist Light.

## Regeln

| Rolle                        | Variable                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------- |
| Seite, Panel, Eingabe, Hover | `--ds-surface-0` … `--ds-surface-3`                                             |
| Rahmen, Feldrahmen           | `--ds-border`, `--ds-border-strong`                                             |
| Text 1–3                     | `--ds-text`, `--ds-text-2`, `--ds-text-3`                                       |
| Primäraktion                 | `--ds-accent`, `--ds-accent-hover`, Text `--ds-on-accent`                       |
| Auswahl, aktive Fläche       | `--ds-accent-soft` + Rahmen `--ds-accent`                                       |
| Link, Status                 | `--ds-link`, `--ds-success`, `--ds-warning`, `--ds-danger`, `--ds-info`         |
| Radien                       | `--ds-radius-sm` (6) · `md` (10) · `lg` (16) · `full`                           |
| Schatten                     | `--ds-shadow-overlay` (nur Player, Toast, Popover, Dialog) · `--ds-focus-ring`  |
| Motion                       | `--ds-duration` (150 ms) · `--ds-duration-slow` (250 ms) · `--ds-ease`          |
| Schriftgrade                 | `--ds-text-xs` 12 · `sm` 13 · `md` 14 · `lg` 16 · `xl` 20 · `2xl` 24 · `3xl` 32 |
| Schrift, Gewichte            | `--ds-font-sans`, `--ds-weight-medium` 500 · `semibold` 600 · `bold` 700        |
| Controls                     | `--ds-control-sm` 28 · `md` 36 · `lg` 40 · `--ds-row-height` 44 (Touch)         |

Gold ist Vollfläche nur für die Primäraktion, Fokus und aktive Zustände. Ein Rahmen (1 px), drei
Radien, Schatten nur für Overlays. Hover ändert Farbe, nie Größe. Destruktive Aktionen sind
textbasiert (`--ds-danger`) auf einer flachen Fläche. Hinweise liegen auf `--ds-surface-2`, die
Statusfarbe steht nur im Icon. `tests/designTokens.spec.ts` verhindert die Rückkehr der alten
Palette, fester Farbwerte, Gradients, Blur, Karten-Schatten und Hover-Transforms.

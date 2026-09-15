import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Font data for generated images (icons and social cards).
 *
 * The TTFs are committed rather than fetched, for three reasons: the image
 * generator needs TTF or WOFF and next/font serves WOFF2; a build should not
 * depend on a third-party request succeeding; and the files are small because
 * they are the Latin subset. Newsreader is an SIL Open Font License face,
 * so redistributing it inside this repository is permitted.
 */
const FONT_DIR = path.join(process.cwd(), 'src', 'assets', 'fonts');

function read(file: string): Buffer {
  return readFileSync(path.join(FONT_DIR, file));
}

export function serifFonts() {
  return [
    // Newsreader publishes no static instances, and Satori cannot read a
    // variable font — it throws on the fvar table. These two files were cut
    // from the variable source with fontTools at wght 600/700 and opsz pinned
    // to 60, the display end of the optical range, because they only ever
    // render cards and icons at large sizes. Regenerate them the same way if
    // the face is ever updated.
    { name: 'Newsreader', data: read('Newsreader-SemiBold.ttf'), weight: 600 as const, style: 'normal' as const },
    { name: 'Newsreader', data: read('Newsreader-Bold.ttf'), weight: 700 as const, style: 'normal' as const },
  ];
}

/** Brand values, repeated here because generated images cannot read the CSS. */
export const ogColors = {
  ink: '#070c20',
  surface: '#0e1529',
  text: '#f4f6fa',
  muted: '#9395a0',
  accent: '#4c618a',
} as const;

export const ogSize = { width: 1200, height: 630 };

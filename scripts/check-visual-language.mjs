import { readFile, readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), 'utf8');
const failures = [];

async function sourceFiles(directory) {
  const absolute = resolve(root, directory);
  const entries = await readdir(absolute, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(?:css|ts|tsx)$/.test(entry.name))
    .map((entry) => relative(root, resolve(entry.parentPath, entry.name)));
}

const styles = await read('src/styles/index.css');
const lockedTokens = new Map([
  ['--color-bg', '#ffffff'],
  ['--color-surface', '#ffffff'],
  ['--color-elevated', '#f2f2f2'],
  ['--color-recessed', '#f6f6f6'],
  ['--color-line', '#e2e2e2'],
  ['--color-line-strong', '#111111'],
  ['--color-fg', '#111111'],
  ['--color-fg-2', '#565656'],
  ['--color-fg-3', '#6b6b6b'],
  ['--color-accent', '#111111'],
  ['--color-accent-ink', '#ffffff'],
  ['--color-ok', '#111111'],
  ['--color-warn', '#111111'],
  ['--color-danger', '#111111'],
  ['--font-sans', "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"],
  ['--font-mono', "'Geist Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace"],
  ['--radius-none', '0px'],
  ['--radius-sm', '0px'],
  ['--radius-md', '0px'],
  ['--radius-lg', '0px'],
  ['--radius-xl', '0px'],
  ['--radius-2xl', '0px'],
  ['--radius-3xl', '0px'],
  ['--radius-full', '0px'],
]);

for (const [token, value] of lockedTokens) {
  if (!styles.includes(`${token}: ${value};`)) {
    failures.push(`src/styles/index.css: locked token ${token} must remain ${value}`);
  }
}

function luminance(hex) {
  const channels = [1, 3, 5]
    .map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

for (const surface of ['--color-bg', '--color-elevated', '--color-recessed']) {
  const ratio = contrastRatio(lockedTokens.get('--color-fg-3'), lockedTokens.get(surface));
  if (ratio < 4.5) failures.push(`src/styles/index.css: muted small text contrast against ${surface} is ${ratio.toFixed(2)}:1; expected at least 4.5:1`);
}

const allowedHex = new Set([
  '#ffffff', '#f2f2f2', '#f6f6f6', '#e2e2e2', '#111111', '#565656', '#6b6b6b',
  '#fff', '#111',
]);

// Frozen exceptions from design/DESIGN.md: semantic/progress screentones, the
// danger hatch, a connection-state mark, and the deterministic QR fixture.
const gradientAllowlist = new Set([
  'src/ui/statusMarks.ts',
  'src/ui/Button.tsx',
  'src/ui/ProgressBar.tsx',
  'src/app/ConnectPage.tsx',
]);

const hardcodedHexAllowlist = new Set([
  'src/styles/index.css',
  'src/app/UiGallery.tsx',
  ...gradientAllowlist,
]);

// Hard zero-blur lift is reserved for action buttons and the open select menu.
const shadowAllowlist = new Set(['src/ui/Button.tsx', 'src/ui/Select.tsx']);
const chromaUtility = /\b(?:red|blue|green|yellow|orange|purple|pink|cyan|teal|indigo|violet|lime|amber|emerald|sky|rose|fuchsia)-\d+/g;

for (const path of await sourceFiles('src')) {
  const source = await read(path);
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  if (/(?:^|[\s"'`])rounded(?:-\[[^\]]+\]|-[\w-]+)?(?=$|[\s"'`])/.test(code)) {
    failures.push(`${path}: rounded utilities violate the square geometry lock`);
  }
  if (/backdrop-blur|["'\s]blur-(?!none\b)/.test(code)) {
    failures.push(`${path}: blur utilities violate the flat overlay lock`);
  }
  if (/\bfont-(?:bold|extrabold|black)\b/.test(code)) {
    failures.push(`${path}: typography weights above 600 violate the hierarchy lock`);
  }

  for (const match of source.matchAll(/#[\da-fA-F]{3,8}\b/g)) {
    if (!allowedHex.has(match[0].toLowerCase())) {
      failures.push(`${path}: non-canonical color ${match[0]} violates the monochrome token lock`);
    } else if (!hardcodedHexAllowlist.has(path)) {
      failures.push(`${path}: hardcoded ${match[0]} bypasses canonical theme tokens`);
    }
  }
  if (/\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/.test(code)) {
    failures.push(`${path}: direct color function bypasses the monochrome token lock`);
  }
  for (const match of source.matchAll(chromaUtility)) {
    failures.push(`${path}: chromatic utility ${match[0]} violates the monochrome token lock`);
  }

  if (source.includes('gradient') && !gradientAllowlist.has(path)) {
    failures.push(`${path}: gradient is not an allowlisted semantic screentone or fixture`);
  }
  if ((source.includes('shadow-[') || /\bshadow-(?:sm|md|lg|xl|2xl)\b/.test(source)) && !shadowAllowlist.has(path)) {
    failures.push(`${path}: shadow is not an allowlisted hard action/menu lift`);
  }
  if (/\bbox-shadow\s*:|\bdrop-shadow(?:-|\[)/.test(code)) {
    failures.push(`${path}: direct or drop shadow violates the zero-blur lift lock`);
  }
  if (path !== 'src/ui/CloseButton.tsx' && /<button\b[^>]*aria-label=["'](?:Close|Dismiss)/.test(code)) {
    failures.push(`${path}: icon-only close actions must use the canonical CloseButton`);
  }
  if (code.includes('OverlayCloseButton') || /[✕×]/.test(code)) {
    failures.push(`${path}: legacy or text-glyph close controls violate the CloseButton lock`);
  }
  if (!path.endsWith('.test.tsx') && path !== 'src/ui/Textarea.tsx' && /<textarea\b/.test(code)) {
    failures.push(`${path}: text areas must use the canonical Textarea primitive`);
  }
  if (!path.endsWith('.test.tsx') && path !== 'src/ui/ChoiceControls.tsx' && /<input\b[^>]*type=["']checkbox["']/.test(code)) {
    failures.push(`${path}: checkbox and switch controls must use canonical choice primitives`);
  }
  if (!path.endsWith('.test.tsx') && path !== 'src/ui/ChoiceControls.tsx' && /<input\b[^>]*type=["']radio["']/.test(code)) {
    failures.push(`${path}: radio controls must use the canonical Radio primitive`);
  }
  if (!path.endsWith('.test.tsx') && path !== 'src/ui/DateTimeInput.tsx' && /<input\b[^>]*type=["']datetime-local["']/.test(code)) {
    failures.push(`${path}: local date-time controls must use DateTimeInput`);
  }
  if (!path.endsWith('.test.tsx') && path !== 'src/ui/FileUpload.tsx' && /<input\b[^>]*type=["']file["']/.test(code)) {
    failures.push(`${path}: file inputs must use the canonical FileUpload primitive`);
  }
  if (!path.endsWith('.test.tsx') && path !== 'src/ui/DescriptionList.tsx' && /<(?:dl|dt|dd)\b/.test(code)) {
    failures.push(`${path}: repeated definition data must use DescriptionList and DescriptionItem`);
  }
  if (path !== 'src/ui/DescriptionList.tsx' && /function\s+Fact\s*\(/.test(code)) {
    failures.push(`${path}: local fact-row helpers compete with DescriptionItem`);
  }
  if (!path.endsWith('.test.tsx') && path !== 'src/ui/Icon.tsx' && path !== 'src/ui/Logo.tsx' && /<svg\b/.test(code)) {
    failures.push(`${path}: interface glyphs must use the canonical Icon primitive`);
  }
  if (!path.endsWith('.test.tsx') && path !== 'src/ui/Image.tsx' && /<img\b/.test(code)) {
    failures.push(`${path}: product images must use the canonical Image primitive`);
  }
  if (!path.endsWith('.test.tsx') && path !== 'src/ui/ProgressBar.tsx' && (/<progress\b/.test(code) || /role=["']progressbar["']/.test(code))) {
    failures.push(`${path}: progress indicators must use the canonical ProgressBar primitive`);
  }
  if (path !== 'src/ui/PageHeader.tsx' && /<PageHeader\b[^>]*\bactions=/.test(code)) {
    failures.push(`${path}: PageHeader actions must use the secondaryActions/primaryAction hierarchy`);
  }
  if (/<PageHeader\b[^>]*eyebrow=["'][^"']*\//.test(code)) {
    failures.push(`${path}: PageHeader eyebrow is a short section label, not a breadcrumb`);
  }
  if (/<PageHeader\b[^>]*(?:secondaryActions|primaryAction)=\{<Select\b/.test(code)) {
    failures.push(`${path}: selectors and filters belong below PageHeader`);
  }
}

const contract = await read('design/DESIGN.md');
for (const marker of [
  'Status: frozen visual contract',
  '## 7. Frozen interaction states',
  '## 8. Change control',
  'scripts/check-design.mjs',
  'scripts/check-visual-language.mjs',
  'Chrome DevTools evidence',
]) {
  if (!contract.includes(marker)) failures.push(`design/DESIGN.md: visual lock is missing ${marker}`);
}

const gallery = await read('src/app/UiGallery.tsx');
for (const marker of ['Locked design system', 'hard lift only', '<Logo', '<Icon', '<PageHeader', '<Button', '<ButtonLink', '<CloseButton', '<Textarea', '<Checkbox', '<Radio', '<Switch', '<DateTimeInput', '<Select', '<SelectionBar', '<SelectionReview', '<FilterToolbar', '<FilterChip', '<DescriptionList', '<Panel', '<StateNotice', '<CursorPagination', '<ProgressBar', '<Image', '<WorkspacePageFrame', '<SplitWorkspace', '<WorkspacePaneHeader', '<ConsoleFooter', '<Drawer', '<Dialog', '<SurfaceNotice', '<ToastViewport', '<ShellAnatomy']) {
  if (!gallery.includes(marker)) failures.push(`src/app/UiGallery.tsx: locked review surface is missing ${marker}`);
}

const fileUpload = await read('src/ui/FileUpload.tsx');
for (const marker of ['type="file"', 'className="sr-only"', 'aria-hidden="true"', 'Choose file', 'Replace', 'Clear', 'aria-describedby', 'aria-invalid', 'required={required}', 'max-sm:grid-cols-1']) {
  if (!fileUpload.includes(marker)) failures.push(`src/ui/FileUpload.tsx: file-upload contract is missing ${marker}`);
}
if (!gallery.includes('<FileUpload')) {
  failures.push('src/app/UiGallery.tsx: locked review surface is missing FileUpload states');
}

if (failures.length) {
  console.error(`Visual language violations:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Visual language is locked (${lockedTokens.size} tokens, ${gradientAllowlist.size} pattern exceptions, ${shadowAllowlist.size} lift exceptions).`);
}

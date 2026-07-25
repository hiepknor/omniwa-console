import { readFile, readdir } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const sourceRoot = resolve(root, 'src');
const sourceExtensions = new Set(['.ts', '.tsx']);

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return sourceExtensions.has(extname(entry.name)) ? [path] : [];
  }));
  return nested.flat();
}

const failures = [];
for (const path of await sourceFiles(sourceRoot)) {
  const file = relative(root, path);
  const source = await readFile(path, 'utf8');

  if (!file.startsWith('src/api/') && /\bfetch\s*\(/.test(source)) {
    failures.push(`${file}: network access must stay inside src/api/`);
  }

  if (file.startsWith('src/features/')) {
    const owner = file.split('/')[2];
    const imports = [...source.matchAll(/(?:from\s+|import\s*\()['"]([^'"]+)['"]/g)];
    const crossesFeatureBoundary = imports.some(([, specifier]) => {
      if (specifier.startsWith('@/features/')) {
        return specifier.split('/')[2] !== owner;
      }
      if (!specifier.startsWith('.')) return false;
      const target = relative(sourceRoot, resolve(dirname(path), specifier));
      return target.startsWith('features/') && target.split('/')[1] !== owner;
    });
    if (crossesFeatureBoundary) {
      failures.push(`${file}: features must not import other features`);
    }
  }

  if (file.startsWith('src/features/') && /<main(?:\s|>)/.test(source)) {
    failures.push(`${file}: Shell owns the document main landmark`);
  }

  if (file.startsWith('src/features/') && /\bqueryKey:\s*\[/.test(source)) {
    failures.push(`${file}: feature query keys must come from src/api/keys.ts factories`);
  }

  if (file.startsWith('src/features/') && /const\s+SCOPE\s*=\s*['"]session['"]/.test(source)) {
    failures.push(`${file}: session query scope must use the canonical API key constant`);
  }

  if (file.includes('-v2/') && !file.includes('.test.') && /new\s+URLSearchParams\s*\(/.test(source)) {
    failures.push(`${file}: v2 URL state must use the shared src/lib/url-search-state.ts helpers`);
  }

  if (file.includes('-v2/') && file.endsWith('/hooks.ts') && /(?:staleTime|refetchInterval):\s*\d/.test(source)) {
    failures.push(`${file}: v2 read timing must use the shared src/lib/query-policy.ts values`);
  }
}

if (failures.length > 0) {
  console.error(`Architecture boundary violations:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('Architecture boundaries are intact.');
}

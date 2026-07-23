import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const assets = resolve(new URL('../dist/assets', import.meta.url).pathname);
const entries = await readdir(assets);
const javascript = entries.filter((name) => name.endsWith('.js'));
const maximumChunkBytes = 300 * 1024;
const failures = [];

for (const name of javascript) {
  const size = (await stat(resolve(assets, name))).size;
  if (size > maximumChunkBytes) {
    failures.push(`${name}: ${(size / 1024).toFixed(1)} KiB exceeds the 300 KiB chunk budget`);
  }
}

const routeChunks = javascript.filter((name) => /Page(?:V2)?-[\w-]+\.js$/.test(name));
if (routeChunks.length < 5) {
  failures.push(`expected at least 5 lazy page chunks, found ${routeChunks.length}`);
}

if (failures.length > 0) {
  console.error(`Bundle regression detected:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`Bundle budget passed across ${javascript.length} chunks (${routeChunks.length} lazy pages).`);
}

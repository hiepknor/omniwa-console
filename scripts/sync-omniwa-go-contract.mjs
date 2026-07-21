import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const converter = require('swagger2openapi');

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const source = resolve(root, '../omniwa-go/docs/swagger.json');
const target = resolve(root, 'contracts/omniwa-go.openapi.json');

const swagger = JSON.parse(readFileSync(source, 'utf8'));

converter.convertObj(swagger, { patch: true, warnOnly: true }, (error, result) => {
  if (error) {
    process.stderr.write(`swagger2openapi conversion failed: ${error.message}\n`);
    process.exitCode = 1;
    return;
  }
  // Stable, deterministic output so contract:check can diff generated types.
  writeFileSync(target, `${JSON.stringify(result.openapi, null, 2)}\n`);
  const pathCount = Object.keys(result.openapi.paths ?? {}).length;
  process.stdout.write(`Synced omniwa-go contract → contracts/omniwa-go.openapi.json (${pathCount} paths).\n`);
});

// TypeDoc plugin: point every "Defined in" at the source file on GitHub.
//
// Packages import each other through their built `dist/*.d.ts` files, so
// members inherited from another Forge package (e.g. PublisherBase, MakerBase)
// are reported at a line in a gitignored `.d.ts` with no link. Those `.d.ts`
// files ship declaration maps, so map them back to the `.ts` source line.
// Paths are shown relative to the repo root, and links point at the tag of
// the release being documented (`v<version>` from lerna.json).
import fs from 'node:fs';
import path from 'node:path';

import { Converter } from 'typedoc';

import { externalPackage } from './tokens.mjs';

const REPO = 'https://github.com/electron/forge';
const ROOT = path.resolve(import.meta.dirname, '../..');
const REVISION = `v${JSON.parse(fs.readFileSync(path.join(ROOT, 'lerna.json'), 'utf8')).version}`;

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeVlq(segment) {
  const values = [];
  let value = 0;
  let shift = 0;
  for (const char of segment) {
    const digit = B64.indexOf(char);
    value += (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
    } else {
      values.push(value & 1 ? -(value >> 1) : value >> 1);
      value = 0;
      shift = 0;
    }
  }
  return values;
}

// generated line (0-based) -> { source, line } (line 0-based), first segment wins
function parseMap(mapFile) {
  const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
  const lines = [];
  let source = 0;
  let line = 0;
  map.mappings.split(';').forEach((group, generatedLine) => {
    for (const segment of group.split(',')) {
      if (!segment) continue;
      const v = decodeVlq(segment);
      if (v.length < 4) continue;
      source += v[1];
      line += v[2];
      lines[generatedLine] ??= {
        source: path.resolve(
          path.dirname(mapFile),
          map.sourceRoot ?? '',
          map.sources[source],
        ),
        line,
      };
    }
  });
  return lines;
}

export function load(app) {
  const maps = new Map();
  const mapFor = (file) => {
    if (!maps.has(file)) {
      const mapFile = `${file}.map`;
      maps.set(file, fs.existsSync(mapFile) ? parseMap(mapFile) : null);
    }
    return maps.get(file);
  };

  app.converter.on(Converter.EVENT_RESOLVE_END, (context) => {
    for (const reflection of Object.values(context.project.reflections)) {
      for (const source of reflection.sources ?? []) {
        let file = source.fullFileName;
        let line = source.line;
        if (!file) continue;

        // Declared in a dependency (e.g. options inherited from Packager):
        // name the package and link to it on npm instead of a local path.
        const pkg = externalPackage(file);
        if (pkg) {
          source.fileName = pkg;
          source.url = `https://www.npmjs.com/package/${pkg}`;
          continue;
        }

        if (file.endsWith('.d.ts')) {
          // Built declarations map back to their .ts source; hand-written
          // ones (plugin-vite's forge-vite-env.d.ts) are the source.
          const mapped = mapFor(file)?.[line - 1];
          if (mapped) {
            file = mapped.source;
            line = mapped.line + 1;
          } else if (file.includes(`${path.sep}dist${path.sep}`)) {
            continue;
          }
        }

        const relative = path.relative(ROOT, file).split(path.sep).join('/');
        if (relative.startsWith('..')) continue;
        source.fullFileName = file;
        source.fileName = relative;
        source.line = line;
        source.url = `${REPO}/blob/${REVISION}/${relative}#L${line}`;
      }
    }
  });
}

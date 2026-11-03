// TypeDoc plugin: one page per type, however many packages re-export it.
//
// @electron-forge/core re-exports ForgeMakeResult, StartOptions, ... from
// @electron-forge/shared-types, and plugin-base re-exports StartOptions.
// In TypeDoc's `packages` mode each re-export becomes a full copy of the page,
// so search and the sidebar list the same type up to three times.
//
// Here, a reflection declared in another documented package is a re-export.
// Links to it go to the declaring package's page (see `canonicalOf`, used by
// forge-theme.mjs and tokens.mjs), its own page becomes a short stub that
// points there, and sidebars-api.ts leaves it out (api/reexports.json).
//
// Members inherited from Node's types (e.g. ElectronProcess extends
// ChildProcess) are dropped: they are documented by Node.js.
import fs from 'node:fs';
import path from 'node:path';

import { Converter, ReflectionKind } from 'typedoc';
import {
  MarkdownPageEvent,
  MarkdownRendererEvent,
} from 'typedoc-plugin-markdown';

import { originPackage } from './tokens.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');

const canonical = new Map();

/** The reflection whose page documents `reflection` (itself if not a re-export). */
export function canonicalOf(reflection) {
  return canonical.get(reflection) ?? reflection;
}

export function isReexport(reflection) {
  return canonical.has(reflection);
}

// `packages/utils/types/src/index.ts` -> `@electron-forge/shared-types`
const packageNames = new Map();
function packageOf(fileName) {
  const match = /^(packages\/[^/]+\/[^/]+)\//.exec(fileName ?? '');
  if (!match) return undefined;
  if (!packageNames.has(match[1])) {
    const pkgJson = path.join(ROOT, match[1], 'package.json');
    packageNames.set(
      match[1],
      fs.existsSync(pkgJson)
        ? JSON.parse(fs.readFileSync(pkgJson, 'utf8')).name
        : undefined,
    );
  }
  return packageNames.get(match[1]);
}

const TOP_LEVEL =
  ReflectionKind.Interface |
  ReflectionKind.Class |
  ReflectionKind.TypeAlias |
  ReflectionKind.Function |
  ReflectionKind.Variable |
  ReflectionKind.Enum;

export function load(app) {
  app.converter.on(Converter.EVENT_RESOLVE_END, (context) => {
    for (const reflection of Object.values(context.project.reflections)) {
      if (
        reflection.kindOf(
          ReflectionKind.Property |
            ReflectionKind.Method |
            ReflectionKind.Accessor,
        ) &&
        reflection.inheritedFrom &&
        originPackage(reflection) === '@types/node'
      ) {
        context.project.removeReflection(reflection);
      }
    }
  });

  app.renderer.on(MarkdownRendererEvent.BEGIN, (event) => {
    canonical.clear();
    const modules = new Map(
      (event.project.children ?? []).map((m) => [m.name, m]),
    );
    for (const module of modules.values()) {
      for (const child of module.children ?? []) {
        if (!child.kindOf(TOP_LEVEL)) continue;
        const declaredIn = packageOf(child.sources?.[0]?.fileName);
        if (!declaredIn || declaredIn === module.name) continue;
        const target = modules
          .get(declaredIn)
          ?.children?.find(
            (c) => c.name === child.name && c.kind === child.kind,
          );
        if (target) canonical.set(child, target);
      }
    }
  });

  // Stub pages for re-exports, so old links and search still land somewhere.
  app.renderer.on(MarkdownPageEvent.END, (page) => {
    const target = canonical.get(page.model);
    if (!target) return;
    const router = app.renderer.router;
    const from = path.posix.dirname(router.getFullUrl(page.model));
    const to = path.posix.relative(from, router.getFullUrl(target));
    const pkg = target.parent?.name;
    page.contents = [
      '---',
      `title: ${JSON.stringify(page.model.name)}`,
      'search: false',
      '---',
      '',
      `# ${page.model.name}`,
      '',
      `Re-exported from \`${pkg}\`. See [\`${target.name}\`](${to}).`,
      '',
    ].join('\n');
  });

  app.renderer.on(MarkdownRendererEvent.END, (event) => {
    const router = app.renderer.router;
    const ids = [...canonical.keys()].map((r) =>
      router.getFullUrl(r).replace(/\.md$/, ''),
    );
    fs.writeFileSync(
      path.join(event.outputDirectory, 'reexports.json'),
      `${JSON.stringify(ids, null, 2)}\n`,
    );
  });
}

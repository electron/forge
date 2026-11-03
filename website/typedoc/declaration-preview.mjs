// TypeDoc plugin: put a TypeScript declaration summary at the top of every
// interface, class and type alias page, like TypeDoc's HTML theme does, e.g.
//
//   interface ForgeMakeResult {
//     arch: ForgeArch;
//     artifacts: string[];
//   }
//
// typedoc-plugin-markdown has no equivalent. The summary is emitted as an
// <ApiDeclaration> MDX element (src/theme/ApiDeclaration) whose `tokens` are
// [text, kind, href?] tuples, so referenced types stay links.
import { ReflectionKind } from 'typedoc';

import {
  apiDeclaration,
  container,
  kw,
  p,
  t,
  type,
  typeAlias,
} from './tokens.mjs';

// `ForgeHookMap` is a mapped type over the hook names, which says nothing
// on its own. Its page lists every hook as the function you'd write, in
// the order Forge runs them, from the two *HookSignatures interfaces.
function hookList(model, context) {
  const siblings = model.parent?.children ?? [];
  const named = (name) => siblings.find((child) => child.name === name);
  const config = named('ResolvedForgeConfig');
  const md = ['## Hooks', ''];
  for (const [title, name, mutating] of [
    ['Simple hooks', 'ForgeSimpleHookSignatures', false],
    ['Mutating hooks', 'ForgeMutatingHookSignatures', true],
  ]) {
    const signatures = named(name);
    if (!signatures) continue;
    md.push(`### ${title}`, '');
    if (signatures.comment)
      md.push(context.partials.comment(signatures.comment), '');
    md.push(
      `Arguments are listed in [\`${name}\`](${context.urlTo(signatures)}).`,
      '',
    );
    const hooks = [...(signatures.children ?? [])].sort(
      (a, b) => (a.sources?.[0]?.line ?? 0) - (b.sources?.[0]?.line ?? 0),
    );
    for (const hook of hooks) {
      const args = hook.type?.type === 'tuple' ? hook.type.elements : [];
      const line = [
        t(hook.name, 'function'),
        p('('),
        t('forgeConfig', 'property'),
        p(': '),
        ...(config
          ? type(
              { type: 'reference', name: config.name, reflection: config },
              context,
            )
          : [t('ResolvedForgeConfig', 'class-name')]),
      ];
      for (const arg of args) line.push(p(', '), ...type(arg, context));
      line.push(p('): '), t('Promise', 'class-name'), p('<'));
      if (mutating && args[0]) {
        line.push(...type(args[0].element ?? args[0], context), p(' | '));
      }
      line.push(kw('void'), p('>'));
      md.push(
        `#### ${hook.name}`,
        '',
        apiDeclaration([line], { variant: 'signature' }),
        '',
      );
      if (hook.comment) md.push(context.partials.comment(hook.comment), '');
    }
  }
  return md.join('\n');
}

export function load(app) {
  app.renderer.markdownHooks.on('content.end', (context) => {
    const model = context.page.model;
    if (
      model?.name !== 'ForgeHookMap' ||
      !model.kindOf?.(ReflectionKind.TypeAlias)
    ) {
      return '';
    }
    return hookList(model, context);
  });

  // Package pages start with the package README, whose heading is an h2
  // (`## maker-zip`), so Docusaurus would title them "index". Give module
  // pages their npm name as the title, and other pages their plain name:
  // the h1 (`Abstract Class: PluginBase\<C\>`) is escaped Markdown, which
  // would otherwise show up as-is in the browser tab.
  app.renderer.markdownHooks.on('page.begin', (context) => {
    const model = context.page.model;
    if (!model?.kindOf || model.kindOf(ReflectionKind.Project)) return '';
    return `---\ntitle: ${JSON.stringify(model.name)}\n---`;
  });

  app.renderer.markdownHooks.on('content.begin', (context) => {
    const model = context.page.model;
    if (!model?.kindOf) return '';
    let lines;
    if (model.kindOf(ReflectionKind.Interface)) {
      lines = container('interface', model, context);
    } else if (model.kindOf(ReflectionKind.Class)) {
      lines = container('class', model, context);
    } else if (model.kindOf(ReflectionKind.TypeAlias)) {
      lines = typeAlias(model, context);
    } else if (model.kindOf(ReflectionKind.Variable)) {
      // `const api: ForgeAPI`, with the type linked.
      lines = [
        [
          kw(model.flags.isConst ? 'const ' : 'let '),
          t(model.name, 'property'),
          ...(model.type ? [p(': '), ...type(model.type, context)] : []),
          p(';'),
        ],
      ];
    } else {
      return '';
    }
    return apiDeclaration(lines);
  });
}

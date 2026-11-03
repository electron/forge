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

export function load(app) {
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

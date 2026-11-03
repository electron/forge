// Turns TypeDoc reflections into [text, kind, href?] tokens for the
// <ApiDeclaration> MDX element (src/theme/ApiDeclaration), keeping referenced
// types as links to their API pages.
import { ReflectionKind } from 'typedoc';

import { canonicalOf } from './reexports.mjs';

export const INDENT = '  ';

/**
 * The npm package a declaration comes from when it isn't Forge's own code
 * (e.g. `@electron/packager` for options inherited from Packager), else
 * undefined.
 */
export function externalPackage(fullFileName) {
  const parts = (fullFileName ?? '').split(/[\\/]node_modules[\\/]/);
  if (parts.length < 2) return undefined;
  const segments = parts.at(-1).split(/[\\/]/);
  return segments[0].startsWith('@')
    ? `${segments[0]}/${segments[1]}`
    : segments[0];
}

/** `  // from @electron/packager` for a member declared in another package. */
const NPM = 'https://www.npmjs.com/package/';

export function originPackage(reflection) {
  const source = reflection?.sources?.[0];
  return (
    externalPackage(source?.fullFileName) ??
    (source?.url?.startsWith(NPM) ? source.url.slice(NPM.length) : undefined)
  );
}

export function originComment(reflection) {
  const pkg = originPackage(reflection);
  return pkg ? [t(`  // from ${pkg}`, 'comment')] : [];
}

/**
 * Members of a declaration: Forge's own first, then one block per dependency
 * they come from, headed `// from @electron/packager`.
 */
function body(children, context) {
  const own = [];
  const byPackage = new Map();
  for (const child of children ?? []) {
    const pkg = originPackage(child);
    if (!pkg) {
      own.push(...member(child, context));
      continue;
    }
    if (!byPackage.has(pkg)) byPackage.set(pkg, []);
    byPackage.get(pkg).push(...member(child, context, { origin: false }));
  }
  const lines = [...own];
  for (const [pkg, members] of byPackage) {
    if (lines.length) lines.push([t('')]);
    lines.push([t(INDENT), t(`// from ${pkg}`, 'comment')], ...members);
  }
  return lines;
}

export const t = (text, kind = 'plain', href) =>
  href ? [text, kind, href] : [text, kind];
export const p = (text) => t(text, 'punctuation');
export const kw = (text) => t(text, 'keyword');

export function hrefFor(reflection, context) {
  reflection = reflection && canonicalOf(reflection);
  if (!reflection || !context.router.hasUrl(reflection)) return undefined;
  const url = context.router.getFullUrl(reflection);
  const [file, hash] = url.split('#');
  const route = file.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '/');
  return `/api/${route}${hash ? `#${hash}` : ''}`;
}

export function typeParameters(params, context) {
  if (!params?.length) return [];
  const out = [p('<')];
  params.forEach((param, i) => {
    if (i) out.push(p(', '));
    out.push(t(param.name, 'class-name'));
    if (param.type) out.push(kw(' extends '), ...type(param.type, context));
    if (param.default) out.push(p(' = '), ...type(param.default, context));
  });
  out.push(p('>'));
  return out;
}

export function parameters(sig, context) {
  const out = [p('(')];
  (sig.parameters ?? []).forEach((param, i) => {
    if (i) out.push(p(', '));
    if (param.flags.isRest) out.push(p('...'));
    out.push(t(param.name, 'property'));
    out.push(p(param.flags.isOptional ? '?: ' : ': '));
    out.push(...type(param.type, context));
  });
  out.push(p(')'));
  return out;
}

export function type(node, context, parent) {
  if (!node) return [kw('any')];
  switch (node.type) {
    case 'intrinsic':
      return [kw(node.name)];
    case 'literal':
      return [
        t(
          typeof node.value === 'string'
            ? JSON.stringify(node.value)
            : String(node.value),
          typeof node.value === 'string' ? 'string' : 'number',
        ),
      ];
    case 'reference': {
      const href = hrefFor(node.reflection, context) ?? node.externalUrl;
      // A base class imported as a default export is referenced as `default`.
      const label =
        node.name === 'default' && node.reflection
          ? node.reflection.name
          : node.name;
      const out = [
        t(label, 'class-name', href && href !== '#' ? href : undefined),
      ];
      if (node.typeArguments?.length) {
        out.push(p('<'));
        node.typeArguments.forEach((arg, i) => {
          if (i) out.push(p(', '));
          out.push(...type(arg, context));
        });
        out.push(p('>'));
      }
      return out;
    }
    case 'array': {
      const inner = type(node.elementType, context, 'array');
      return [...inner, p('[]')];
    }
    case 'union':
    case 'intersection': {
      const sep = node.type === 'union' ? ' | ' : ' & ';
      const out = [];
      node.types.forEach((member, i) => {
        if (i) out.push(p(sep));
        out.push(...type(member, context, node.type));
      });
      return parent === 'array' ? [p('('), ...out, p(')')] : out;
    }
    case 'tuple': {
      const out = [p('[')];
      (node.elements ?? []).forEach((el, i) => {
        if (i) out.push(p(', '));
        out.push(...type(el, context));
      });
      return [...out, p(']')];
    }
    case 'typeOperator':
      return [kw(`${node.operator} `), ...type(node.target, context)];
    case 'query':
      return [kw('typeof '), ...type(node.queryType, context)];
    case 'indexedAccess':
      return [
        ...type(node.objectType, context),
        p('['),
        ...type(node.indexType, context),
        p(']'),
      ];
    case 'reflection': {
      const decl = node.declaration;
      if (decl.signatures?.length) {
        const sig = decl.signatures[0];
        const out = [
          ...typeParameters(sig.typeParameters, context),
          ...parameters(sig, context),
          p(' => '),
          ...type(sig.type, context),
        ];
        return parent === 'array' || parent === 'union'
          ? [p('('), ...out, p(')')]
          : out;
      }
      if (!decl.children?.length) return [p('{}')];
      const out = [p('{ ')];
      decl.children.forEach((child, i) => {
        if (i) out.push(p('; '));
        out.push(
          t(child.name, 'property'),
          p(child.flags.isOptional ? '?: ' : ': '),
        );
        out.push(...type(child.type, context));
      });
      return [...out, p(' }')];
    }
    case 'namedTupleMember':
      return [
        t(node.name, 'property'),
        p(node.isOptional ? '?: ' : ': '),
        ...type(node.element, context),
      ];
    case 'optional':
      return [...type(node.elementType, context), p('?')];
    case 'rest':
      return [p('...'), ...type(node.elementType, context)];
    case 'mapped': {
      // { [S in ForgeHookName]?: ForgeHookFn<S> }
      const optional =
        node.optionalModifier === '+'
          ? '?'
          : node.optionalModifier === '-'
            ? '-?'
            : '';
      return [
        p('{ '),
        ...(node.readonlyModifier === '+' ? [kw('readonly ')] : []),
        p('['),
        t(node.parameter, 'class-name'),
        kw(' in '),
        ...type(node.parameterType, context),
        ...(node.nameType ? [kw(' as '), ...type(node.nameType, context)] : []),
        p(`]${optional}: `),
        ...type(node.templateType, context),
        p(' }'),
      ];
    }
    case 'conditional':
      return [
        ...type(node.checkType, context),
        kw(' extends '),
        ...type(node.extendsType, context),
        p(' ? '),
        ...type(node.trueType, context),
        p(' : '),
        ...type(node.falseType, context),
      ];
    case 'inferred':
      return [kw('infer '), t(node.name, 'class-name')];
    case 'templateLiteral': {
      const out = [t(`\`${node.head}`, 'string')];
      for (const [inner, text] of node.tail) {
        out.push(p('${'), ...type(inner, context), p('}'), t(text, 'string'));
      }
      return [...out, t('`', 'string')];
    }
    default:
      return [t(node.toString())];
  }
}

export function member(child, context, { origin = true } = {}) {
  if (child.flags.isPrivate || child.name.startsWith('#')) return [];
  const prefix = [];
  if (child.flags.isProtected) prefix.push(kw('protected '));
  if (child.flags.isStatic) prefix.push(kw('static '));
  if (child.flags.isAbstract) prefix.push(kw('abstract '));
  if (child.flags.isReadonly) prefix.push(kw('readonly '));
  const name = t(child.name, 'property');

  if (child.kindOf(ReflectionKind.Constructor)) {
    return (child.signatures ?? []).map((sig) => [
      t(INDENT),
      kw('constructor'),
      ...parameters(sig, context),
      p(';'),
    ]);
  }
  if (child.kindOf(ReflectionKind.Method)) {
    return (child.signatures ?? []).map((sig) => [
      t(INDENT),
      ...prefix,
      name,
      ...typeParameters(sig.typeParameters, context),
      ...parameters(sig, context),
      p(': '),
      ...type(sig.type, context),
      p(';'),
      ...(origin ? originComment(child) : []),
    ]);
  }
  if (child.kindOf(ReflectionKind.Accessor)) {
    const lines = [];
    if (child.getSignature) {
      lines.push([
        t(INDENT),
        ...prefix,
        kw('get '),
        name,
        p('(): '),
        ...type(child.getSignature.type, context),
        p(';'),
      ]);
    }
    if (child.setSignature) {
      lines.push([
        t(INDENT),
        ...prefix,
        kw('set '),
        name,
        ...parameters(child.setSignature, context),
        p(';'),
      ]);
    }
    return lines;
  }
  return [
    [
      t(INDENT),
      ...prefix,
      name,
      p(child.flags.isOptional ? '?: ' : ': '),
      ...type(child.type, context),
      p(';'),
      ...(origin ? originComment(child) : []),
    ],
  ];
}

export function heritage(keyword, types, context) {
  if (!types?.length) return [];
  const out = [kw(` ${keyword} `)];
  types.forEach((ref, i) => {
    if (i) out.push(p(', '));
    out.push(...type(ref, context));
  });
  return out;
}

export function container(keyword, model, context) {
  const head = [
    ...(model.flags.isAbstract ? [kw('abstract ')] : []),
    kw(`${keyword} `),
    t(model.name, 'class-name'),
    ...typeParameters(model.typeParameters, context),
    ...heritage('extends', model.extendedTypes, context),
    ...heritage('implements', model.implementedTypes, context),
    p(' {'),
  ];
  return [head, ...body(model.children, context), [p('}')]];
}

export function typeAlias(model, context) {
  const head = [
    kw('type '),
    t(model.name, 'class-name'),
    ...typeParameters(model.typeParameters, context),
    p(' = '),
  ];
  const decl =
    model.type?.type === 'reflection' ? model.type.declaration : undefined;
  if (decl?.children?.length && !decl.signatures?.length) {
    return [[...head, p('{')], ...body(decl.children, context), [p('};')]];
  }
  return [[...head, ...type(model.type, context), p(';')]];
}

/** Lines of tokens -> the <ApiDeclaration> MDX element. */
export function apiDeclaration(lines, { variant } = {}) {
  const tokens = lines.flatMap((line, i) => (i ? [['\n'], ...line] : line));
  const variantProp = variant ? ` variant="${variant}"` : '';
  return `<ApiDeclaration${variantProp} tokens={${JSON.stringify(tokens)}} />`;
}

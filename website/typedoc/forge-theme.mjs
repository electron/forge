// TypeDoc plugin: the `forge` Markdown theme for the API reference.
//
// typedoc-plugin-markdown renders member signatures as a blockquote of inline
// code chips (`> **make**(`opts`): `Promise`<`ForgeMakeResult`[]>`). This
// theme renders them like TypeDoc's HTML theme instead:
// - signatures and property/variable declarations are one highlighted line
//   (<ApiDeclaration variant="signature">), with linked types
// - simple parameters are a list (`opts: MakeOptions`), not a heading each
// - a plain return type is one line (`Returns Promise<ForgeMakeResult[]>`)
import { ReflectionKind, ReflectionType, UnionType } from 'typedoc';
import { MarkdownTheme, MarkdownThemeContext } from 'typedoc-plugin-markdown';

import {
  apiDeclaration,
  kw,
  p,
  parameters,
  t,
  type,
  typeParameters,
} from './tokens.mjs';

function flags(reflection) {
  const out = [];
  if (!reflection?.flags) return out;
  if (reflection.flags.isProtected) out.push(kw('protected '));
  if (reflection.flags.isStatic) out.push(kw('static '));
  if (reflection.flags.isAbstract) out.push(kw('abstract '));
  if (reflection.flags.isReadonly) out.push(kw('readonly '));
  return out;
}

function signatureLine(model, options, context) {
  const line = [];
  if (options?.accessor) line.push(kw(`${options.accessor} `));
  line.push(...flags(model.parent));
  if (!['__call', '__type'].includes(model.name)) {
    if (model.kind === ReflectionKind.ConstructorSignature) {
      line.push(kw('new '), t(model.name.replace(/^new /, ''), 'class-name'));
    } else {
      line.push(t(model.name, 'function'));
    }
  }
  line.push(...typeParameters(model.typeParameters, context));
  line.push(...parameters(model, context));
  if (model.type) line.push(p(': '), ...type(model.type, context));
  return line;
}

function declarationLine(model, context) {
  const line = [...flags(model)];
  if (model.kindOf(ReflectionKind.Variable)) {
    line.push(kw(model.flags.isConst ? 'const ' : 'let '));
  }
  if (model.getSignature) line.push(kw('get '));
  else if (model.setSignature) line.push(kw('set '));
  const isAlias = model.kindOf(ReflectionKind.TypeAlias);
  if (isAlias) line.push(kw('type '));
  line.push(t(model.name, isAlias ? 'class-name' : 'property'));
  line.push(...typeParameters(model.typeParameters, context));
  const declType =
    model.type ??
    model.getSignature?.type ??
    model.setSignature?.parameters?.[0]?.type;
  if (model.getSignature) {
    line.push(p('(): '), ...type(declType, context));
  } else {
    line.push(p(isAlias ? ' = ' : model.flags.isOptional ? '?: ' : ': '));
    line.push(...type(declType, context));
  }
  return line;
}

function isSimpleParameter(parameter, context) {
  const paramType = parameter.type;
  if (paramType instanceof ReflectionType) {
    return (
      Boolean(paramType.declaration?.signatures) ||
      !paramType.declaration?.children?.length
    );
  }
  if (paramType instanceof UnionType) {
    return !context.helpers.hasUsefulTypeDetails(paramType);
  }
  return true;
}

const indent = (md) =>
  md
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n');

class ForgeThemeContext extends MarkdownThemeContext {
  constructor(...args) {
    super(...args);
    const base = this.partials;
    const context = this;

    this.partials = {
      ...base,

      signatureTitle: (model, options) =>
        apiDeclaration([signatureLine(model, options, context)], {
          variant: 'signature',
        }),

      declarationTitle: (model) => {
        // The page's own declaration is already in the summary at the top.
        if (model === context.page.model) return '';
        return apiDeclaration([declarationLine(model, context)], {
          variant: 'signature',
        });
      },

      parametersList: (params, options) => {
        const md = [];
        let list = [];
        const flush = () => {
          if (list.length) md.push(list.join('\n'));
          list = [];
        };
        for (const parameter of params) {
          if (!isSimpleParameter(parameter, context)) {
            flush();
            md.push(base.parametersList([parameter], options));
            continue;
          }
          const rest = parameter.flags.isRest ? '...' : '';
          const optional =
            parameter.flags.isOptional || parameter.defaultValue ? '?' : '';
          let item = `- **${rest}${parameter.name}${optional}**: ${base.someType(parameter.type)}`;
          if (parameter.defaultValue && parameter.defaultValue !== '...') {
            item += ` = \`${parameter.defaultValue}\``;
          }
          if (parameter.comment) {
            item += `\n\n${indent(base.comment(parameter.comment))}\n`;
          }
          list.push(item);
        }
        flush();
        return md.join('\n\n');
      },

      signatureReturns: (model, options) => {
        const returnType = model.type;
        const simple =
          returnType &&
          !model.comment?.getTag('@returns') &&
          !(returnType instanceof ReflectionType) &&
          !(
            returnType instanceof UnionType &&
            context.helpers.hasUsefulTypeDetails(returnType)
          );
        if (!simple) return base.signatureReturns(model, options);
        return `**Returns** ${base.someType(returnType)}`;
      },
    };
  }
}

class ForgeTheme extends MarkdownTheme {
  getRenderContext(page) {
    return new ForgeThemeContext(this, page, this.application.options);
  }
}

export function load(app) {
  app.renderer.defineTheme('forge', ForgeTheme);
}

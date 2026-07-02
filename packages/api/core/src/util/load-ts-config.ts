import crypto from 'node:crypto';
import { createRequire, isBuiltin } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import fs from 'graceful-fs';

import type * as ts from 'typescript';

/**
 * Zero-dependency TypeScript config loader.
 *
 * Loads a `.ts`/`.mts`/`.cts` Forge config using the USER PROJECT's own
 * `typescript` package (resolved from the project directory, so Forge itself
 * ships no compiler). The config file and every project-local TypeScript file
 * reachable through static analysis are transpiled to ES2022 ESM (CommonJS
 * for `.cts` sources) and written as uniquely-named temp sibling files next
 * to their sources. The emitted JavaScript is then post-processed via the
 * TypeScript AST:
 *
 *   - relative / tsconfig-`paths` specifiers  -> rewritten to the temp sibling
 *   - bare specifiers resolving to CJS deps   -> replaced with `createRequire`
 *     bindings, so the dependency instance is identical to a plain `require()`
 *     anywhere else in the process (single shared `Module._cache`)
 *   - bare specifiers resolving to ESM deps   -> left as native `import`
 *     (keeps dependencies that use top-level await working)
 *   - dynamic `import("./relative-ts")`       -> hoisted static import, so it
 *     still works after the temp files are deleted (e.g. post-load hooks)
 *
 * The entry temp file is evaluated with a native `await import()` and every
 * temp file is deleted in `finally`. Nothing process-global is ever
 * registered and unique temp names mean no stale ESM-cache hits.
 *
 * This "one real module system" property is what fixes
 * https://github.com/electron/forge/issues/3949: loaders that evaluate the
 * config's node_modules dependencies through a parallel module system (like
 * jiti) hand the config a *second copy* of packages such as webpack, so
 * `Compilation.PROCESS_ASSETS_STAGE_*` comparisons inside the webpack plugin
 * silently fail and `index.html` is dropped from packaged apps.
 *
 * Because the user's own compiler is available, load failures are upgraded to
 * proper type errors: if evaluating the config throws, the config is
 * type-checked and any diagnostics are surfaced instead of the raw crash.
 * Setting FORGE_TYPECHECK_CONFIG=1 type-checks the config before every load.
 */

type TypeScriptModule = typeof ts;

const TS_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);

/** Options that only make sense for a real build of the user's `src` tree
 * and cause false positives (e.g. TS6059) when type-checking the config. */
const CHECK_INCOMPATIBLE_OPTIONS = [
  'composite',
  'declaration',
  'declarationDir',
  'declarationMap',
  'emitDeclarationOnly',
  'incremental',
  'inlineSourceMap',
  'inlineSources',
  'out',
  'outDir',
  'outFile',
  'rootDir',
  'rootDirs',
  'sourceMap',
  'sourceRoot',
  'tsBuildInfoFile',
];

function loadUserTypeScript(projectDir: string): TypeScriptModule {
  const require = createRequire(path.join(projectDir, 'noop.js'));
  // Resolve the version from package.json first: TypeScript 7+ (the native
  // compiler) is `"type": "module"` with no root `"."` export, so a plain
  // `require('typescript')` would die with ERR_PACKAGE_PATH_NOT_EXPORTED
  // before any feature detection could run. `typescript/package.json` stays
  // exported across every version this loader can meet.
  let pkgPath: string;
  try {
    pkgPath = require.resolve('typescript/package.json');
  } catch {
    throw new Error(
      `Loading a TypeScript Forge config requires the "typescript" package (version 4.7.0 or later) to be installed in your project (searched from ${projectDir}). ` +
        `Forge's TypeScript templates include it by default — run \`npm install --save-dev typescript\` (or the equivalent for your package manager) and try again.`,
    );
  }
  const version: string = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  if (Number(version.split('.')[0]) >= 7) {
    // TypeScript 7 drops the JavaScript compiler API this loader is built on
    // (`transpileModule`, `resolveModuleName`, ...) in favor of a JSON-RPC
    // interface to the native compiler. Microsoft's prescribed path for
    // API-dependent tools is a side-by-side TypeScript 6 — use it
    // transparently when the project has it installed.
    try {
      const ts6 = require('@typescript/typescript6') as TypeScriptModule;
      if (typeof ts6.transpileModule === 'function') return ts6;
    } catch {
      // Not installed — fall through to the actionable error below.
    }
    throw new Error(
      `Your project's "typescript" dependency is version ${version}, but TypeScript 7+ (the native compiler) no longer provides the JavaScript compiler API that Forge uses to load TypeScript config files. ` +
        `Until Forge supports the TypeScript 7 API, install TypeScript 6 alongside it — run \`npm install --save-dev @typescript/typescript6\` (or pin \`typescript@6\`) and try again.`,
    );
  }
  return require('typescript') as TypeScriptModule;
}

function readTsconfigOptions(
  typescript: TypeScriptModule,
  configPath: string,
): ts.CompilerOptions {
  const found = typescript.findConfigFile(
    path.dirname(configPath),
    typescript.sys.fileExists,
    'tsconfig.json',
  );
  if (!found) return {};
  const read = typescript.readConfigFile(found, typescript.sys.readFile);
  if (read.error) return {};
  const parsed = typescript.parseJsonConfigFileContent(
    read.config,
    typescript.sys,
    path.dirname(found),
    undefined,
    // Passing the config file name sets `configFilePath`, so `types` /
    // `typeRoots` resolve relative to the project rather than the cwd.
    found,
  );
  return parsed.options ?? {};
}

function bundlerModuleResolution(
  typescript: TypeScriptModule,
): ts.ModuleResolutionKind {
  // `Bundler` needs TypeScript >= 5.0; fall back to node resolution before that.
  const kinds = typescript.ModuleResolutionKind as unknown as Record<
    string,
    ts.ModuleResolutionKind | undefined
  >;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- one of the two always exists
  return (kinds.Bundler ?? kinds.NodeJs)!;
}

function nearestPackageType(fromDir: string): 'module' | 'commonjs' {
  let dir = fromDir;
  for (;;) {
    const pkg = path.join(dir, 'package.json');
    if (fs.existsSync(pkg)) {
      try {
        return JSON.parse(fs.readFileSync(pkg, 'utf8')).type === 'module'
          ? 'module'
          : 'commonjs';
      } catch {
        return 'commonjs';
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return 'commonjs';
    dir = parent;
  }
}

/**
 * Classify a specifier that does NOT resolve to a project-local TypeScript
 * file, using Node's real resolution from the importing file.
 */
function classifyDependency(
  specifier: string,
  fromFile: string,
): 'builtin' | 'esm' | 'cjs' {
  if (isBuiltin(specifier)) return 'builtin';
  const require = createRequire(fromFile);
  let resolved: string;
  try {
    resolved = require.resolve(specifier);
  } catch {
    // ESM-only package (no "require" condition) or genuinely missing — leave
    // it to the native import, which either works or throws the right error.
    return 'esm';
  }
  if (resolved.endsWith('.mjs')) return 'esm';
  if (!resolved.endsWith('.js')) return 'cjs'; // .cjs / .json / .node
  return nearestPackageType(path.dirname(resolved)) === 'module'
    ? 'esm'
    : 'cjs';
}

/** Shift an inline source map down by `lineOffset` lines (for the banner). */
function shiftInlineSourceMap(code: string, lineOffset: number): string {
  return code.replace(
    /(\/\/# sourceMappingURL=data:application\/json;base64,)([A-Za-z0-9+/=]+)/,
    (_match, prefix: string, base64: string) => {
      try {
        const map = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
        map.mappings = ';'.repeat(lineOffset) + (map.mappings ?? '');
        return prefix + Buffer.from(JSON.stringify(map)).toString('base64');
      } catch {
        return prefix + base64;
      }
    },
  );
}

/**
 * Type-check the config with the user's own TypeScript, returning formatted
 * diagnostics (or undefined if the config is clean). Only ever runs when the
 * config failed to load or FORGE_TYPECHECK_CONFIG is set — the happy path
 * never pays for a full program creation.
 */
function typeCheckConfig(
  typescript: TypeScriptModule,
  entry: string,
  projectOptions: ts.CompilerOptions,
  projectDir: string,
): string | undefined {
  const options: ts.CompilerOptions = { ...projectOptions };
  for (const key of CHECK_INCOMPATIBLE_OPTIONS) {
    delete options[key];
  }
  // Check under the same semantics the loader evaluates with.
  options.noEmit = true;
  options.skipLibCheck = true;
  options.allowImportingTsExtensions = true;
  options.moduleResolution = bundlerModuleResolution(typescript);
  options.module = typescript.ModuleKind.ESNext;
  options.target =
    typescript.ScriptTarget.ES2022 ?? typescript.ScriptTarget.ESNext;
  options.esModuleInterop = true;

  const host = typescript.createCompilerHost(options);
  // Forge may run from anywhere — resolve everything from the project.
  host.getCurrentDirectory = () => projectDir;
  const program = typescript.createProgram([entry], options, host);
  const diagnostics = typescript
    .getPreEmitDiagnostics(program)
    .filter((d) => d.category === typescript.DiagnosticCategory.Error);
  if (diagnostics.length === 0) return undefined;
  return typescript.formatDiagnostics(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => projectDir,
    getNewLine: () => '\n',
  });
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

function applyEdits(code: string, edits: Edit[]): string {
  // Apply in reverse so earlier edit positions stay valid.
  let output = code;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  }
  return output;
}

async function evaluateConfig<T>(
  typescript: TypeScriptModule,
  entry: string,
  projectOptions: ts.CompilerOptions,
  projectDir: string,
): Promise<T> {
  const runId = crypto.randomBytes(6).toString('hex');

  const resolutionOptions: ts.CompilerOptions = {
    ...projectOptions,
    moduleResolution: bundlerModuleResolution(typescript),
    allowImportingTsExtensions: true,
    noEmit: true,
  };

  /** Resolve a specifier to a project-local TypeScript file (or undefined). */
  const resolveProjectTs = (
    specifier: string,
    containingFile: string,
  ): string | undefined => {
    const result = typescript.resolveModuleName(
      specifier,
      containingFile,
      resolutionOptions,
      typescript.sys,
    );
    const resolved = result.resolvedModule;
    if (!resolved || resolved.isExternalLibraryImport) return undefined;
    if (!TS_EXTENSIONS.has(resolved.extension)) return undefined;
    return path.resolve(resolved.resolvedFileName);
  };

  // ---- 1. Collect the project-local TypeScript graph -----------------------
  const graph = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- length checked above
    const file = queue.pop()!;
    if (graph.has(file)) continue;
    graph.add(file);
    const preprocessed = typescript.preProcessFile(
      fs.readFileSync(file, 'utf8'),
      true,
      true,
    );
    for (const imported of preprocessed.importedFiles) {
      const resolved = resolveProjectTs(imported.fileName, file);
      if (resolved && !graph.has(resolved)) queue.push(resolved);
    }
  }

  // Unique temp names per load: no stale ESM-cache hits across reloads.
  const tempOf = new Map<string, string>();
  for (const file of graph) {
    const emitExt = file.endsWith('.cts') ? '.cjs' : '.mjs';
    tempOf.set(
      file,
      path.join(
        path.dirname(file),
        `${path.basename(file)}.forge-${runId}${emitExt}`,
      ),
    );
  }

  /** Relative specifier from `fromOriginal`'s directory to `target`'s temp.
   * Temps are siblings of their sources, so other relative specifiers in the
   * emitted code keep resolving unchanged. */
  const relativeToTemp = (fromOriginal: string, target: string): string => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- target is always in the graph
    const temp = tempOf.get(target)!;
    let rel = path
      .relative(path.dirname(fromOriginal), temp)
      .split(path.sep)
      .join('/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return rel;
  };

  // ---- 2. Transpile + rewrite each file -------------------------------------
  const transpileFile = (file: string): string => {
    const isCts = file.endsWith('.cts');
    const emitOptions: ts.CompilerOptions = {
      module: isCts
        ? typescript.ModuleKind.CommonJS
        : typescript.ModuleKind.ESNext,
      target: typescript.ScriptTarget.ES2022 ?? typescript.ScriptTarget.ESNext,
      esModuleInterop: true,
      isolatedModules: true,
      // Inline source maps so stack traces can point back at the TypeScript
      // source even after the temp files are deleted.
      inlineSourceMap: true,
      inlineSources: true,
    };
    // Carry over the emit-affecting options from the user's tsconfig.
    for (const option of [
      'experimentalDecorators',
      'emitDecoratorMetadata',
      'jsx',
      'jsxFactory',
      'jsxFragmentFactory',
      'jsxImportSource',
      'useDefineForClassFields',
    ]) {
      if (projectOptions[option] !== undefined) {
        emitOptions[option] = projectOptions[option];
      }
    }
    const output = typescript.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: emitOptions,
      fileName: file,
      reportDiagnostics: true,
    });
    const fatal = (output.diagnostics ?? []).filter(
      (d) => d.category === typescript.DiagnosticCategory.Error,
    );
    if (fatal.length > 0) {
      throw new Error(
        `Failed to transpile ${file}:\n` +
          typescript.formatDiagnostics(fatal, {
            getCanonicalFileName: (fileName) => fileName,
            getCurrentDirectory: () => projectDir,
            getNewLine: () => '\n',
          }),
      );
    }
    return isCts
      ? rewriteCjs(output.outputText, file)
      : rewriteEsm(output.outputText, file);
  };

  /** Rewrite the ESM emit of `file` (parse emitted JS, string-edit by position). */
  const rewriteEsm = (code: string, file: string): string => {
    const sourceFile = typescript.createSourceFile(
      `${file}.mjs`,
      code,
      typescript.ScriptTarget.Latest,
      true,
      typescript.ScriptKind.JS,
    );
    const edits: Edit[] = [];
    const hoisted: string[] = [];
    let counter = 0;

    const cjsNamedBindings = (
      elements: readonly ts.ImportSpecifier[],
      moduleVar: string,
    ): string =>
      elements
        .map(
          (el) =>
            `const ${el.name.text} = ${moduleVar}[${JSON.stringify(
              (el.propertyName ?? el.name).text,
            )}];`,
        )
        .join(' ');

    const handleTopLevel = (statement: ts.Statement): void => {
      if (
        typescript.isImportDeclaration(statement) &&
        typescript.isStringLiteralLike(statement.moduleSpecifier)
      ) {
        const specifier = statement.moduleSpecifier.text;
        const tsFile = resolveProjectTs(specifier, file);
        if (tsFile) {
          edits.push({
            start: statement.moduleSpecifier.getStart(sourceFile),
            end: statement.moduleSpecifier.getEnd(),
            text: JSON.stringify(relativeToTemp(file, tsFile)),
          });
          return;
        }
        // Builtins and ESM deps stay native imports (single instance via the
        // real ESM loader; top-level-await deps keep working). CJS deps are
        // rewritten to the real `require`, sharing Node's CJS module cache
        // with the rest of the process (#3949).
        if (classifyDependency(specifier, file) !== 'cjs') return;
        counter += 1;
        const moduleVar = `__forgeMod_${counter}`;
        const parts = [
          `const ${moduleVar} = __forgeRequire(${JSON.stringify(specifier)});`,
        ];
        const clause = statement.importClause;
        if (clause) {
          if (clause.name) {
            parts.push(
              `const ${clause.name.text} = __forgeInterop(${moduleVar});`,
            );
          }
          if (clause.namedBindings) {
            if (typescript.isNamespaceImport(clause.namedBindings)) {
              parts.push(
                `const ${clause.namedBindings.name.text} = __forgeStar(${moduleVar});`,
              );
            } else {
              parts.push(
                cjsNamedBindings(clause.namedBindings.elements, moduleVar),
              );
            }
          }
        }
        edits.push({
          start: statement.getStart(sourceFile),
          end: statement.getEnd(),
          text: parts.join(' '),
        });
      } else if (
        typescript.isExportDeclaration(statement) &&
        statement.moduleSpecifier &&
        typescript.isStringLiteralLike(statement.moduleSpecifier)
      ) {
        const specifier = statement.moduleSpecifier.text;
        const tsFile = resolveProjectTs(specifier, file);
        if (tsFile) {
          edits.push({
            start: statement.moduleSpecifier.getStart(sourceFile),
            end: statement.moduleSpecifier.getEnd(),
            text: JSON.stringify(relativeToTemp(file, tsFile)),
          });
          return;
        }
        if (classifyDependency(specifier, file) !== 'cjs') return;
        if (
          !statement.exportClause ||
          !typescript.isNamedExports(statement.exportClause)
        ) {
          throw new Error(
            `\`export * from "${specifier}"\` re-exports from a CommonJS dependency are not supported in a TypeScript Forge config (${file}). Import the module and re-export explicitly.`,
          );
        }
        counter += 1;
        const moduleVar = `__forgeMod_${counter}`;
        const parts = [
          `const ${moduleVar} = __forgeRequire(${JSON.stringify(specifier)});`,
        ];
        const exportedNames: string[] = [];
        for (const el of statement.exportClause.elements) {
          const from = (el.propertyName ?? el.name).text;
          const local = `__forgeReExport_${counter}_${exportedNames.length}`;
          parts.push(
            from === 'default'
              ? `const ${local} = __forgeInterop(${moduleVar});`
              : `const ${local} = ${moduleVar}[${JSON.stringify(from)}];`,
          );
          exportedNames.push(`${local} as ${el.name.text}`);
        }
        parts.push(`export { ${exportedNames.join(', ')} };`);
        edits.push({
          start: statement.getStart(sourceFile),
          end: statement.getEnd(),
          text: parts.join(' '),
        });
      }
    };

    const visitExpressions = (node: ts.Node): void => {
      if (
        typescript.isCallExpression(node) &&
        node.arguments.length === 1 &&
        typescript.isStringLiteralLike(node.arguments[0])
      ) {
        const specifier = node.arguments[0].text;
        if (node.expression.kind === typescript.SyntaxKind.ImportKeyword) {
          // Dynamic import of a project TS file -> hoisted static import, so
          // it still resolves after the temps are deleted (post-load hooks).
          const tsFile = resolveProjectTs(specifier, file);
          if (tsFile) {
            counter += 1;
            hoisted.push(
              `import * as __forgeDynamic_${counter} from ${JSON.stringify(
                relativeToTemp(file, tsFile),
              )};`,
            );
            edits.push({
              start: node.getStart(sourceFile),
              end: node.getEnd(),
              text: `Promise.resolve(__forgeDynamic_${counter})`,
            });
          }
          // Bare / non-TS dynamic imports stay native.
        } else if (
          typescript.isIdentifier(node.expression) &&
          node.expression.text === 'require'
        ) {
          // Bare require("./relative-ts") -> require the ESM temp
          // (require(esm) works on Node >= 22.12 for TLA-free subgraphs).
          const tsFile = resolveProjectTs(specifier, file);
          if (tsFile) {
            edits.push({
              start: node.arguments[0].getStart(sourceFile),
              end: node.arguments[0].getEnd(),
              text: JSON.stringify(relativeToTemp(file, tsFile)),
            });
          }
        }
      }
      typescript.forEachChild(node, visitExpressions);
    };

    for (const statement of sourceFile.statements) handleTopLevel(statement);
    visitExpressions(sourceFile);

    // The banner is a single line so the inline source map only shifts by one.
    // `require`, `__filename` and `__dirname` all point at the ORIGINAL file.
    const banner = [
      `import { createRequire as __forgeCreateRequire } from "node:module";`,
      `const __forgeRequire = __forgeCreateRequire(${JSON.stringify(file)});`,
      `const require = __forgeRequire;`,
      `const __filename = ${JSON.stringify(file)};`,
      `const __dirname = ${JSON.stringify(path.dirname(file))};`,
      `const __forgeInterop = (m) => (m && m.__esModule ? m["default"] : m);`,
      `const __forgeStar = (m) => { if (m && m.__esModule) return m; const ns = { default: m }; for (const k in m) { if (k !== "default") ns[k] = m[k]; } return ns; };`,
      ...hoisted,
    ].join(' ');
    return `${banner}\n${shiftInlineSourceMap(applyEdits(code, edits), 1)}`;
  };

  /** Rewrite CJS emit (`.cts`): only relative-TS require()/import() specifiers
   * need fixing — everything else already goes through the real `require`. */
  const rewriteCjs = (code: string, file: string): string => {
    const sourceFile = typescript.createSourceFile(
      `${file}.cjs`,
      code,
      typescript.ScriptTarget.Latest,
      true,
      typescript.ScriptKind.JS,
    );
    const edits: Edit[] = [];
    const visit = (node: ts.Node): void => {
      const isRequireCall =
        typescript.isCallExpression(node) &&
        typescript.isIdentifier(node.expression) &&
        node.expression.text === 'require';
      const isDynamicImport =
        typescript.isCallExpression(node) &&
        node.expression.kind === typescript.SyntaxKind.ImportKeyword;
      if (
        (isRequireCall || isDynamicImport) &&
        node.arguments.length === 1 &&
        typescript.isStringLiteralLike(node.arguments[0])
      ) {
        const tsFile = resolveProjectTs(node.arguments[0].text, file);
        if (tsFile) {
          edits.push({
            start: node.arguments[0].getStart(sourceFile),
            end: node.arguments[0].getEnd(),
            text: JSON.stringify(relativeToTemp(file, tsFile)),
          });
        }
      }
      typescript.forEachChild(node, visit);
    };
    visit(sourceFile);
    return applyEdits(code, edits);
  };

  // ---- 3. Write temps, import the entry, always clean up --------------------
  const written: string[] = [];
  try {
    for (const file of graph) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- populated for the whole graph
      const temp = tempOf.get(file)!;
      fs.writeFileSync(temp, transpileFile(file));
      written.push(temp);
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- entry is always in the graph
    const namespace = await import(pathToFileURL(tempOf.get(entry)!).href);
    let exported: unknown =
      namespace && 'default' in namespace ? namespace.default : namespace;
    // A `.cts` config emits `exports.default` behind an `__esModule` marker,
    // which the namespace above wraps once more — unwrap it.
    if (
      exported &&
      typeof exported === 'object' &&
      '__esModule' in exported &&
      'default' in exported
    ) {
      exported = exported.default;
    }
    return exported as T;
  } finally {
    for (const temp of written) {
      try {
        fs.rmSync(temp, { force: true });
      } catch {
        // Best effort — never mask the actual load result.
      }
    }
  }
}

/**
 * Load a TypeScript Forge config file. See the module docs above for how.
 *
 * @param projectDir - the directory of the project whose config is loaded
 *   (used to resolve the project's own `typescript` package)
 * @param configPath - absolute path to the `.ts`/`.mts`/`.cts` config file
 */
export async function loadTypeScriptConfig<T>(
  projectDir: string,
  configPath: string,
): Promise<T> {
  const typescript = loadUserTypeScript(projectDir);
  const entry = path.resolve(configPath);
  const projectOptions = readTsconfigOptions(typescript, entry);

  if (process.env.FORGE_TYPECHECK_CONFIG) {
    const diagnostics = typeCheckConfig(
      typescript,
      entry,
      projectOptions,
      projectDir,
    );
    if (diagnostics) {
      throw new Error(
        `Type checking of your Forge config failed:\n\n${diagnostics}`,
      );
    }
  }

  try {
    return await evaluateConfig<T>(
      typescript,
      entry,
      projectOptions,
      projectDir,
    );
  } catch (err) {
    // The config crashed at runtime. Before rethrowing, type-check it — a
    // proper diagnostic (e.g. a typo'd import) beats a runtime stack trace.
    let diagnostics: string | undefined;
    try {
      diagnostics = typeCheckConfig(
        typescript,
        entry,
        projectOptions,
        projectDir,
      );
    } catch {
      // If the type check itself blows up, surface the original error.
    }
    if (diagnostics) {
      throw new Error(
        `Failed to load your Forge config — it has TypeScript type errors:\n\n${diagnostics}`,
        { cause: err },
      );
    }
    throw err;
  }
}

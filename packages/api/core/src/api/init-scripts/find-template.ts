import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { ForgeTemplate } from '@electron-forge/shared-types';
import debug from 'debug';

import { PossibleModule } from '../../util/import-search.js';

const d = debug('electron-forge:init:find-template');

export interface ForgeTemplateDetails {
  name: string;
  path: string;
  template: ForgeTemplate;
}

export const findTemplate = async (
  template: string,
): Promise<ForgeTemplateDetails> => {
  let foundTemplate: Omit<ForgeTemplateDetails, 'template'> | null = null;

  // Convert absolute paths to file URLs for cross-platform compatibility.
  // import.meta.resolve() doesn't recognize Windows-style paths like "D:\..."
  // and needs them as file URLs (e.g., "file:///D:/...").
  // When a path is absolute, we skip the prefixed package name lookups.
  const isAbsolutePath = path.isAbsolute(template);
  const templatePath = isAbsolutePath ? pathToFileURL(template).href : template;

  const resolveTemplateTypes = isAbsolutePath
    ? [templatePath]
    : ([
        `electron-forge-template-${template}`,
        `@electron-forge/template-${template}`,
        template,
      ] as const);
  for (const moduleName of resolveTemplateTypes) {
    try {
      d(`Trying template: ${moduleName}`);
      foundTemplate = {
        path: import.meta.resolve(moduleName),
        name: moduleName,
      };
      break;
    } catch (err) {
      d(`Error: ${err instanceof Error ? err.message : err}`);
    }
  }
  if (!foundTemplate) {
    throw new Error(`Failed to locate custom template: "${template}".`);
  } else {
    d(`found template module at: ${foundTemplate.path}`);

    const templateModule: PossibleModule<ForgeTemplate> = await import(
      foundTemplate.path
    );
    const tmpl = templateModule.default ?? templateModule;

    return {
      ...foundTemplate,
      template: tmpl,
    };
  }
};

import { ForgeTemplate } from '@electron-forge/shared-types';
import debug from 'debug';
import globalDirs from 'global-dirs';

import { PossibleModule } from '../../util/import-search';

const d = debug('electron-forge:init:find-template');

enum TemplateType {
  global = 'global',
  local = 'local',
}

export const findTemplate = async (template: string): Promise<ForgeTemplate> => {
  let templateModulePath!: string;
  const resolveTemplateTypes = [
    [TemplateType.global, `electron-forge-template-${template}`],
    [TemplateType.global, `@electron-forge/template-${template}`],
    [TemplateType.local, `electron-forge-template-${template}`],
    [TemplateType.local, `@electron-forge/template-${template}`],
    [TemplateType.global, template],
    [TemplateType.local, template],
  ];
  let foundTemplate = false;
  for (const [templateType, moduleName] of resolveTemplateTypes) {
    try {
      d(`Trying ${templateType} template: ${moduleName}`);
      if (templateType === TemplateType.global) {
        templateModulePath = require.resolve(moduleName, {
          paths: [globalDirs.npm.packages, globalDirs.yarn.packages],
        });
      } else {
        templateModulePath = require.resolve(moduleName);
      }
      foundTemplate = true;
      break;
    } catch (err) {
      d(`Error: ${err instanceof Error ? err.message : err}`);
    }
  }
  if (!foundTemplate) {
    throw new Error(`Failed to locate custom template: "${template}".`);
  }

  d(`found template module at: ${templateModulePath}`);

  const templateModule: PossibleModule<ForgeTemplate> = await import(templateModulePath);

  return templateModule.default ?? templateModule;
};

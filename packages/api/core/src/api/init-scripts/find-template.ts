import { ForgeTemplate } from '@electron-forge/shared-types';
import debug from 'debug';
import globalDirs from 'global-dirs';

import { PossibleModule } from '../../util/import-search';

const d = debug('electron-forge:init:find-template');

enum TemplateType {
  global = 'global',
  local = 'local',
}

export interface ForgeTemplateDetails {
  name: string;
  path: string;
  template: ForgeTemplate;
  type: TemplateType;
}

export const findTemplate = async (template: string): Promise<ForgeTemplateDetails> => {
  let foundTemplate: Omit<ForgeTemplateDetails, 'template'> | null = null;

  const resolveTemplateTypes = [
    [TemplateType.global, `electron-forge-template-${template}`],
    [TemplateType.global, `@electron-forge/template-${template}`],
    [TemplateType.local, `electron-forge-template-${template}`],
    [TemplateType.local, `@electron-forge/template-${template}`],
    [TemplateType.global, template],
    [TemplateType.local, template],
  ] as const;
  for (const [templateType, moduleName] of resolveTemplateTypes) {
    try {
      d(`Trying ${templateType} template: ${moduleName}`);
      let templateModulePath: string;
      if (templateType === TemplateType.global) {
        templateModulePath = require.resolve(moduleName, {
          paths: [globalDirs.npm.packages, globalDirs.yarn.packages],
        });
      } else {
        templateModulePath = require.resolve(moduleName);
      }
      foundTemplate = {
        path: templateModulePath,
        type: templateType,
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

    const templateModule: PossibleModule<ForgeTemplate> = await import(foundTemplate.path);
    const tmpl = templateModule.default ?? templateModule;

    return {
      ...foundTemplate,
      template: tmpl,
    };
  }
};

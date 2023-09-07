import { ForgeTemplate } from '@electron-forge/shared-types';
import debug from 'debug';
import resolvePackage from 'resolve-package';

import { PossibleModule } from '../../util/require-search';

const d = debug('electron-forge:init:find-template');

export const findTemplate = async (dir: string, template: string): Promise<ForgeTemplate> => {
  let templateModulePath!: string;
  const resolveTemplateTypes = [
    ['global', `electron-forge-template-${template}`],
    ['global', `@electron-forge/template-${template}`],
    ['local', `electron-forge-template-${template}`],
    ['local', `@electron-forge/template-${template}`],
    ['local', template],
  ];
  let foundTemplate = false;
  for (const [templateType, moduleName] of resolveTemplateTypes) {
    try {
      d(`Trying ${templateType} template: ${moduleName}`);
      if (templateType === 'global') {
        templateModulePath = await resolvePackage(moduleName);
      } else {
        // local
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

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const templateModule: PossibleModule<ForgeTemplate> = require(templateModulePath);

  return templateModule.default || templateModule;
};

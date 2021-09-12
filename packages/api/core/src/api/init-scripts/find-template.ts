import { asyncOra } from '@electron-forge/async-ora';
import debug from 'debug';
import resolvePackage from 'resolve-package';

import { ForgeTemplate } from '@electron-forge/shared-types';
import { PossibleModule } from '../../util/require-search';

const d = debug('electron-forge:init:find-template');

export default async (dir: string, template: string): Promise<ForgeTemplate> => {
  let templateModulePath!: string;
  await asyncOra(`Locating custom template: "${template}"`, async () => {
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
      throw new Error(`Failed to locate custom template: "${template}"\n\nTry \`npm install -g electron-forge-template-${template}\``);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-dynamic-require, global-require
  const templateModule: PossibleModule<ForgeTemplate> = require(templateModulePath);

  return templateModule.default || templateModule;
};

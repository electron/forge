import { ForgeTemplate, PossibleModule } from '@electron-forge/shared-types';
import debug from 'debug';

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

  const resolveTemplateTypes = [
    `electron-forge-template-${template}`,
    `@electron-forge/template-${template}`,
    template,
  ] as const;
  for (const moduleName of resolveTemplateTypes) {
    try {
      d(`Trying template: ${moduleName}`);
      foundTemplate = {
        path: require.resolve(moduleName),
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

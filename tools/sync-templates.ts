import * as path from 'path';

import * as fs from 'fs-extra';

const BASE_DIR = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.resolve(BASE_DIR, 'packages', 'template');
const CREATE_ELECTRON_APP_PKG_JSON = path.resolve(BASE_DIR, 'packages', 'external', 'create-electron-app', 'package.json');

(async () => {
  const createAppPj = await fs.readJson(CREATE_ELECTRON_APP_PKG_JSON);

  const templates: Array<Record<string, string>> = [];
  for (const subDir of await fs.readdirSync(TEMPLATES_DIR)) {
    const templateName = `@electron-forge/template-${subDir}`;
    templates.push({
      [templateName]: createAppPj.version,
    });
  }

  const packageJson = {
    ...createAppPj,
    dependencies: {
      '@electron-forge/cli': createAppPj.version,
      ...templates.reduce((acc, curr) => ({ ...acc, ...curr }), {}),
    },
  };

  await fs.writeJson(CREATE_ELECTRON_APP_PKG_JSON, packageJson, { spaces: 2 });
})().catch((err) => console.log(err));

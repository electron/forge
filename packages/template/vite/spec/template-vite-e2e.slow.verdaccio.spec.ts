import { testForgeTemplate } from '@electron-forge/test-utils';

testForgeTemplate({
  moduleFormats: ['cjs'],
  packagedRendererProtocol: 'app:',
  templateName: 'vite',
});

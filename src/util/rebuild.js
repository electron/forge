import rebuild from 'electron-rebuild';

import asyncOra from '../util/ora-handler';

export default async (buildPath, electronVersion, platform, arch, config = {}) => {
  if (!electronVersion) {
    throw new Error("Could not determine Electron version. Make sure that 'npm install' (or 'yarn') has been run before invoking electron-forge.");
  }

  await asyncOra('Preparing native dependencies', async (rebuildSpinner) => {
    const rebuilder = rebuild(Object.assign({}, config, {
      buildPath,
      electronVersion,
      arch,
    }));
    const { lifecycle } = rebuilder;

    let found = 0;
    let done = 0;

    const redraw = () => {
      rebuildSpinner.text = `Preparing native dependencies: ${done} / ${found}`; // eslint-disable-line
    };

    lifecycle.on('module-found', () => { found += 1; redraw(); });
    lifecycle.on('module-done', () => { done += 1; redraw(); });

    await rebuilder;
  });
};

import rebuild from 'electron-rebuild';

import asyncOra from '../util/ora-handler';

export default async (buildPath, electronVersion, platform, arch) => {
  await asyncOra('Preparing native dependencies', async (rebuildSpinner) => {
    const rebuilder = rebuild(buildPath, electronVersion, arch);
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

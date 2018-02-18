try {
  const Complete = require('tabtab/src/complete');
  const Installer = require('tabtab/src/installer');

  const options = { auto: true, name: 'electron-forge' };
  const complete = new Complete(options);
  const installer = new Installer(options, complete);

  let shell = process.env.SHELL;
  if (shell) shell = shell.split((process.platform !== 'win32') ? '/' : '\\').slice(-1)[0];

  if (installer[shell]) {
    installer.handle(options.name, options)
      .catch(e => console.warn(`Failed to install tab completion: ${e}`));
  } else {
    console.warn(`User shell ${shell} not supported, skipping completion install`);
  }
} catch (err) {
  console.log('tabtab install went wrong', err);
  process.exit(0);
}

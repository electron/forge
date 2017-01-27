import colors from 'colors';

process.on('unhandledRejection', (err) => {
  if (err && err.message && err.stack) {
    console.error('\nAn unhandled rejection has occurred inside Forge:'.red);
    console.error(colors.red(err.message));
    console.error(colors.red(err.stack));
  } else {
    console.error('\nElectron forge was terminated:'.red);
    console.error(colors.red(typeof err === 'string' ? err : JSON.stringify(err)));
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  if (err && err.message && err.stack) {
    console.error('\nAn unhandled exception has occurred inside Forge:'.red);
    console.error(colors.red(err.message));
    console.error(colors.red(err.stack));
  } else {
    console.error('\nElectron forge was terminated:'.red);
    console.error(colors.red(typeof err === 'string' ? err : JSON.stringify(err)));
  }
  process.exit(1);
});

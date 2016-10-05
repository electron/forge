import colors from 'colors';

process.on('unhandledRejection', (err) => {
  process.stdout.write('\n\nAn unhandled rejection has occurred inside Forge:\n');
  console.error(colors.red(err.stack));
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  process.stdout.write('\n\nAn unhandled exception has occurred inside Forge:\n');
  console.error(colors.red(err.stack));
  process.exit(1);
});

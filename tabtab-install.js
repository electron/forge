process.argv.push('install');
process.argv.push('--auto');
try {
  require('tabtab/src/cli');
} catch (e) {
  console.warning(`Failed to install tab completion: ${e}`);
}

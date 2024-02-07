/**
 * Silences warnings and other stdio logs produced from commands
 *
 * It does not silence errors.
 */

const { spawn } = require('@malept/cross-spawn-promise');

const [cmd, ...args] = process.argv.slice(2);

spawn(cmd, args, {
  stdio: 'pipe',
});

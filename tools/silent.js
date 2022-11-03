const cp = require('child_process');

const [cmd, ...args] = process.argv.slice(2);

const child = cp.spawn(cmd, args, {
  stdio: 'pipe',
});

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  else process.exit(code);
});

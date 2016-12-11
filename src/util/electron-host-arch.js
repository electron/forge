export default () => {
  if (process.arch === 'arm' && process.config.variables.arm_version === '7') {
    return 'armv7l';
  }

  return process.arch;
};

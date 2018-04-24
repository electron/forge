export default <T, A>(configObject: T | ((...args: A[]) => T), ...args: A[]): T => {
  if (typeof configObject === 'function') {
    return configObject(...args);
  }
  return configObject;
};

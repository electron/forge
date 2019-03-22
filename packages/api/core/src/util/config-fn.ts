// eslint-disable-next-line arrow-parens
export default <T, A>(configObject: T | ((...args: A[]) => T), ...args: A[]): T => {
  if (typeof configObject === 'function') {
    return (configObject as any as ((...args: A[]) => T))(...args);
  }
  return configObject;
};

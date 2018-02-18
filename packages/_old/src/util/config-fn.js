export default (configObject, ...args) => {
  if (typeof configObject === 'function') {
    return configObject(...args);
  }
  return configObject;
};

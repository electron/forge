// The dynamic import splits the bundle, so the emitted entry chunk carries
// Vite's preload machinery. index.html loads this entry as a non-async module
// script, which is what the module preload polyfill gets injected for.
import('./lazy.js').then(({ message }) => {
  document.title = message;
});

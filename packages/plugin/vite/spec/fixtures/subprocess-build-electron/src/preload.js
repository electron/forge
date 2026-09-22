/* eslint-disable */
class Handle {
  [Symbol.dispose]() {}
}

function open() {
  using handle = new Handle();
  return 'from-preload';
}

globalThis.preloadMarker = open();

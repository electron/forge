/* eslint-disable */
class Handle {
  [Symbol.dispose]() {}
}

function open() {
  using handle = new Handle();
  return 'renderer-ready';
}

globalThis.rendererMarker = open();

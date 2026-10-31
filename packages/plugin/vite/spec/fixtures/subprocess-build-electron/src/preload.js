class Handle {
  [Symbol.dispose]() {}
}

function open() {
  using handle = new Handle();
  return handle;
}

globalThis.preloadMarker = open();

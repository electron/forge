class Handle {
  [Symbol.dispose]() {}
}

export function open() {
  using handle = new Handle();
  return handle;
}

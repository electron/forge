/* eslint-disable */
// `using` is only left untransformed when `build.target` is new enough, which
// is how the spec checks that the derived Electron target reached the build.
class Handle {
  [Symbol.dispose]() {}
}

export function open() {
  using handle = new Handle();
  return handle;
}

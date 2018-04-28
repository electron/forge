declare module 'yarn-or-npm' {
  const yon: () => 'yarn' | 'npm';
  export default yon;
}

declare module 'sudo-prompt' {
  export const exec: () => void;
}

declare module 'resolve-package' {
  const resolve: (packageName: string) => Promise<string>;
  export default resolve;
}

declare module 'username' {
  const username: () => Promise<string>;
  export default username;
}

declare module 'resolve-package' {
  const resolve: (packageName: string) => Promise<string>;
  export default resolve;
}

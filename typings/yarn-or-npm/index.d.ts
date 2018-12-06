declare module 'yarn-or-npm' {
  const yon: () => 'yarn' | 'npm';
  export default yon;
}

declare module 'parcel-bundler' {
  export interface BundlerOptions {
    outDir?: string;
    outFile?: string;
    publicUrl?: string;
    watch?: boolean;
    cache?: boolean;
    cacheDir?: string;
    minify?: boolean;
    target: 'browser' | 'node' | 'electron';
    https?: boolean;
    logLevel?: 3 | 2 | 1;
    hmrPort?: number;
    sourceMaps?: boolean;
    hmrHostname?: string;
    detailedReport?: boolean;
  }

  class Bundler {
    constructor(file: string, options: BundlerOptions);

    bundle(): Promise<void>;
    middleware(): () => void;
    stop(): void;
  }

  const foo: typeof Bundler;

  export default foo;
}
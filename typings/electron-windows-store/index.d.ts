declare module 'electron-windows-store' {
  const run: (opts: any) => Promise<void>;
  export default run;
}

declare module 'electron-windows-store/lib/sign' {
  export const isValidPublisherName: (name: string) => boolean;
  export const makeCert: (opts: MakerCertOptions) => Promise<string>;

  interface MakerCertOptions {
    publisherName: string;
    certFilePath: string;
    certFileName: string;
    install: boolean;
    program: any;
  }
}

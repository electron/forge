declare module 'parse-author' {
  export type AuthorType = string | {
    name: string
  } | undefined;
  interface ParseAuthor {
    (author: AuthorType): AuthorType;
  }
  const parseAuthor: ParseAuthor;
  export default parseAuthor;
}

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

declare module 'cross-spawn/lib/util/resolveCommand' {
  interface Opts {
    command: string;
    options: {
      cwd: string | null;
    };
  }
  const resolveCommand: (opts: Opts, work: boolean) => string;
  export default resolveCommand;
}

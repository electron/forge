export interface Person {
  name: string;
  url?: string;
  email?: string;
}

export interface PackageJsonManifest {
  // mandatory (npm)
  name: string;
  version: string;
  engines: { [name: string]: string };

  // optional (npm)
  author?: string | Person;
  displayName?: string;
  description?: string;
  keywords?: string[];
  categories?: string[];
  homepage?: string;
  bugs?: string | { url?: string; email?: string };
  license?: string;
  contributors?: string | Person[];
  main?: string;
  browser?: string;
  repository?: string | { type?: string; url?: string };
  scripts?: { [name: string]: string };
  dependencies?: { [name: string]: string };
  devDependencies?: { [name: string]: string };
  private?: boolean;
  pricing?: string;

  // not supported (npm)
  // files?: string[];
  // bin
  // man
  // directories
  // config
  // peerDependencies
  // bundledDependencies
  // optionalDependencies
  // os?: string[];
  // cpu?: string[];
  // preferGlobal
  // publishConfig
}

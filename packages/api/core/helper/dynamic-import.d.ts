export declare function dynamicImport(path: string): Promise<any>;
/** Like {@linkcode dynamicImport()}, but falls back to require on failure. */
export declare function dynamicImportMaybe(path: string): Promise<any>;

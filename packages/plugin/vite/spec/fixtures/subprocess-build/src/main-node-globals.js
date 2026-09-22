/* eslint-disable */
export const fromEnv = process.env.FOO;
export const dir = __dirname;
export const metaUrl = import.meta.url;
export const metaDirname = import.meta.dirname;

export const lazy = () => import('./lazy.js');

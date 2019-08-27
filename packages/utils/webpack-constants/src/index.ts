// these are added by @electron-forge/plugin-webpack
// https://www.electronforge.io/config/plugins/webpack

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export const mainWindowWebpackEntry: string = MAIN_WINDOW_WEBPACK_ENTRY;
export const mainWindowPreloadWebpackEntry: string = MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY;

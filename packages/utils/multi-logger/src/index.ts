import Logger from './Logger.js';

export default Logger;
export type { LoggerListener, MergedLine } from './Logger.js';
export { default as Tab } from './Tab.js';
export { describeStatus, formatDuration } from './format.js';
export type { TagColor } from './format.js';
export type {
  LoggerKey,
  LoggerMode,
  LoggerOptions,
  TabState,
  TabStatus,
} from './types.js';

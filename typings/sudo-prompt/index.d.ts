declare module 'sudo-prompt' {
  export const exec: (command: string, options?: object, callback?: (error?: Error, stdout?: string, stderr?: string) => void) => void;
}

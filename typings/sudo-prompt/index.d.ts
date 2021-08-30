import { PromiseWithChild } from 'child_process';

// Copied from https://github.com/jorangreef/sudo-prompt/pull/124
// TODO: Remove this if/when that PR gets merged/released
declare module 'sudo-prompt' {
  namespace exec {
    function __promisify__(command: string): PromiseWithChild<{ stdout: string; stderr: string }>
      function __promisify__<TBuffer = string | Buffer>(
        command: string,
        options:
        | ((error?: Error, stdout?: TBuffer, stderr?: TBuffer) => void)
        | { name?: string; icns?: string; env?: Record<string, string> }
      ): PromiseWithChild<{ stdout: TBuffer; stderr: TBuffer }>
  }
}

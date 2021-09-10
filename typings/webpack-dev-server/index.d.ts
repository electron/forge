// TODO: Replace with @types/webpack-dev-server when it no longer depends on @types/webpack
// See: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/55300#issuecomment-904636931
declare module 'webpack-dev-server' {
  import { Server } from 'http';
  import { Compiler } from 'webpack';
  class WebpackDevServer {
    constructor(options: {}, compiler: Compiler)
    server: Server;
    start(): Promise<void>
    close(): void
  }
  export default WebpackDevServer;
}

// TODO: Replace with @types/webpack-dev-server when it is updated to v4
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

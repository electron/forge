

declare module "webpack-dev-middleware" {
    import {Compiler, Configuration} from 'webpack';
    const middleware: (compiler: Compiler, options: Options) => any;
    export interface Options {
        [proName: string]: any;
    }
    export default middleware;
}
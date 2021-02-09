


declare module "webpack-hot-middleware" {
    import {Compiler} from 'webpack';
    const middleware: (compiler: Compiler) => any;
    export interface Options {
        [proName: string]: any;
    }
    export default middleware;
}

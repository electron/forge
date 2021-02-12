


declare module "webpack-hot-middleware" {
    import {Compiler} from 'webpack';
    const middleware: (compiler: Compiler) => any;
    export default middleware;
}

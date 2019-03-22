import { EventEmitter } from 'events'

/**
* Creates a lazy instance of modules that can't be required before the
* app 'ready' event by returning a proxy object to mitigate side effects
* on 'require'
*
* @param {Function} creator - Function that creates a new module instance
* @param {PrototypeHolder} holder - the object holding the module prototype
* @param {Boolean} isEventEmitter - whether or not the module is an EventEmitter
* @returns {Object} - a proxy object for the
*/

// typings
interface PrototypeHolder { prototype: Object; }
interface Module { [method: string]: Function; }
type FancyModule<T, B> =
  B extends true
    ? EventEmitter & T
    : T;

export function createLazyInstance <T, B extends boolean>(creator: (() => T), holder: new () => T, isEventEmitter: B): FancyModule<T< B> {
  // let lazyModule!: Module;
  // const module: Module = {}
  // for (const method in holder.prototype) {
  //   module[method] = (...args: any) => {
  //     // if (!lazyModule) {
  //       // create instance on function at use-time
  //       // lazyModule = creator()
  //       // if (isEventEmitter) {
  //       //   EventEmitter.call(lazyModule)
  //       // }
  //     // }
  //     // return lazyModule[method](...args)
  //   }
  // }
  return null as any;
}

class Thing extends EventEmitter {
  public foo: number = 1;
}

const test = createLazyInstance(() => new Thing(), Thing, true);
const test2 = createLazyInstance(() => new Thing(), Thing, false);

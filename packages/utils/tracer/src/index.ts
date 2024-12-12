import * as fs from 'node:fs';

import { Fields, Tracer } from 'chrome-trace-event';

const store = global as any;
store._forgeTracer = store._forgeTracer || {
  tracer: new Tracer(),
  traceIdCounter: 1,
};
const forgeTracer: {
  tracer: Tracer;
  traceIdCounter: number;
} = store._forgeTracer;

if (process.env.ELECTRON_FORGE_TRACE_FILE) {
  store._forgeTracer.pipe(fs.createWriteStream(process.env.ELECTRON_FORGE_TRACE_FILE));
} else {
  store._forgeTracer = null;
}

const nextRoot = () => `forge-auto-trace-root-${forgeTracer.traceIdCounter++}`;

type TraceOptions = {
  name: string;
  category: string;
  extraDetails?: Record<string, string>;
  newRoot?: boolean;
};

function _autoTrace<Args extends any[], R = void>(
  tracer: Tracer | null,
  autoTraceId: string,
  opts: TraceOptions,
  fn: (childTrace: typeof autoTrace, ...args: Args) => R
): (...args: Args) => R {
  return (async (...args: Args) => {
    const traceArgs: Fields = {
      id: autoTraceId,
      name: opts.name,
      cat: [opts.category],
      args: opts.extraDetails,
      tid: autoTraceId.split('-')[autoTraceId.split('-').length - 1],
    };
    tracer?.begin(traceArgs);
    const childTrace = (opts: TraceOptions, fn: any) => {
      return _autoTrace(tracer?.child(traceArgs) ?? null, opts.newRoot ? nextRoot() : autoTraceId, opts, fn);
    };
    (childTrace as any)._autoEnd = true;
    (childTrace as any)._end = () => tracer?.end(traceArgs);
    try {
      return await Promise.resolve(fn(childTrace as any, ...args));
    } finally {
      if ((childTrace as any)._autoEnd) {
        (childTrace as any)._end();
      }
    }
  }) as any;
}

export function delayTraceTillSignal<O extends object, K extends keyof O>(trace: typeof autoTrace, signaller: O, signal: K) {
  const original: any = signaller[signal];
  (trace as any)._autoEnd = false;
  signaller[signal] = function (...args: any[]) {
    const result = original.call(signaller, ...args);
    if (typeof result === 'object' && result.then && result.catch) {
      result.then(() => (trace as any)._end()).catch(() => (trace as any)._end());
    } else {
      (trace as any)._end();
    }
    return result;
  } as any;
  return signaller;
}

export function autoTrace<Args extends any[], R = void>(opts: TraceOptions, fn: (childTrace: typeof autoTrace, ...args: Args) => R): (...args: Args) => R {
  return _autoTrace(forgeTracer.tracer, nextRoot(), opts, fn as any);
}

/* eslint "arrow-parens": "off", "@typescript-eslint/no-explicit-any": "off" */
export default <A, B>(fn1: A, fn2: B): [A, B] => {
  let once = true;
  let val: any;
  const make = <T>(fn: T): T =>
    ((...args: any[]) => {
      if (once) {
        val = (fn as any)(...args);
        once = false;
      }
      return val;
    }) as unknown as T;
  return [make(fn1), make(fn2)];
};

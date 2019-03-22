export const getAllDependencies = (pj: any) => {
  const tuples: { name: string; version: string; }[] = [];

  const forKey = (key: string) => {
    if (!pj[key]) return;
    if (typeof pj[key] !== 'object') return;
    for (const subkey of Object.keys(pj[key])) {
      tuples.push({ name: subkey, version: pj[key][subkey] });
    }
  };

  forKey('dependencies');
  forKey('devDependencies');
  forKey('peerDependencies');
  forKey('optionalDependencies');

  return tuples;
};

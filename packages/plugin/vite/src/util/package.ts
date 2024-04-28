import { DepType, Walker } from 'flora-colossus';

export async function getFlatDependencies(root: string) {
  const walker = new Walker(root);
  const deps = await walker.walkTree();

  return deps.filter((dep) => dep.depType === DepType.PROD);
}

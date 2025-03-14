import { describe, expect, it } from 'vitest';

import { supportsModuleRegister } from '../src/supports-module-register';

describe('supportsModuleRegister', () => {
  it('should return false for Node < 18', () => {
    expect(supportsModuleRegister('16.4.0')).toBe(false);
    expect(supportsModuleRegister('17.0.0')).toBe(false);
  });

  it('should return true for Node 18 if patch version >= 18.19', () => {
    expect(supportsModuleRegister('18.0.0')).toBe(false);
    expect(supportsModuleRegister('18.19.0')).toBe(true);
    expect(supportsModuleRegister('18.20.0')).toBe(true);
  });

  it('should return true for Node 20 if patch version >= 20.6', () => {
    expect(supportsModuleRegister('20.0.0')).toBe(false);
    expect(supportsModuleRegister('20.6.0')).toBe(true);
    expect(supportsModuleRegister('20.25.0')).toBe(true);
  });

  it('should return true for Node 22', () => {
    expect(supportsModuleRegister('22.0.0')).toBe(true);
  });
});

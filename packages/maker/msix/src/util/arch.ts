type MsixArch = 'x64' | 'arm64' | 'x86' | 'arm' | '*';

/**
 * Converts a Node.JS architecture to the corresponding MSIX architecture.
 * Valid Node.js values are x64, arm64, and ia32.
 */
export function toMsixArch(arch: string): MsixArch {
  const validArchitectures = ['x64', 'arm64'];

  if (arch === 'ia32') {
    return 'x86';
  }

  if (validArchitectures.includes(arch)) {
    return arch as MsixArch;
  }

  throw new Error(
    `Invalid architecture: ${arch}. Must be one of ${validArchitectures.join(', ')} or ia32`,
  );
}

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  ForgeMakeResult,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import { execa } from 'execa';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublisherR2, PublisherR2Config } from '../src/PublisherR2';

// Mock execa
vi.mock('execa');
vi.mock('node:fs');

describe('PublisherR2', () => {
  let publisher: PublisherR2;
  let tmpDir: string;

  beforeEach(async () => {
    // Create temporary directory for test artifacts
    const tmp = os.tmpdir();
    const tmpdir = path.join(tmp, 'electron-forge-test-');
    tmpDir = await fs.promises.mkdtemp(tmpdir);

    // Create test artifact files
    await fs.promises.writeFile(
      path.join(tmpDir, 'test-app-1.0.0.dmg'),
      'fake-dmg-content',
    );
    await fs.promises.writeFile(
      path.join(tmpDir, 'test-app-1.0.0.exe'),
      'fake-exe-content',
    );
    await fs.promises.writeFile(
      path.join(tmpDir, 'RELEASES'),
      'fake-releases-content',
    );

    // Mock execa to return successful responses
    vi.mocked(execa).mockResolvedValue({
      stdout: '',
      stderr: '',
      exitCode: 0,
      failed: false,
      killed: false,
      signal: undefined,
      signalDescription: undefined,
      command: '',
      escapedCommand: '',
      isCanceled: false,
      isTerminated: false,
      isMaxBuffer: false,
      isForcefullyTerminated: false,
      pipedFrom: [],
    } as never);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a PublisherR2 instance with correct name', () => {
      const config: PublisherR2Config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
        apiToken: 'test-api-token',
      };
      publisher = new PublisherR2(config);
      expect(publisher.name).toBe('r2');
    });
  });

  describe('publish', () => {
    let mockMakeResults: ForgeMakeResult[];
    const mockForgeConfig = {} as ResolvedForgeConfig;
    const mockSetStatusLine = vi.fn();

    beforeEach(() => {
      mockMakeResults = [
        {
          artifacts: [path.join(tmpDir, 'test-app-1.0.0.dmg')],
          packageJSON: {
            name: 'test-app',
            version: '1.0.0',
          },
          platform: 'darwin',
          arch: 'x64',
        },
        {
          artifacts: [path.join(tmpDir, 'test-app-1.0.0.exe')],
          packageJSON: {
            name: 'test-app',
            version: '1.0.0',
          },
          platform: 'win32',
          arch: 'x64',
        },
      ];
    });

    it('should throw error when bucket is not configured', async () => {
      const config = {
        accountId: 'test-account-id',
        apiToken: 'test-api-token',
      };
      publisher = new PublisherR2(config as PublisherR2Config);

      await expect(
        publisher.publish({
          makeResults: mockMakeResults,
          dir: tmpDir,
          forgeConfig: mockForgeConfig,
          setStatusLine: mockSetStatusLine,
        }),
      ).rejects.toThrow(
        'In order to publish to R2, you must set the "bucket" property',
      );
    });

    it('should throw error when accountId is not configured', async () => {
      const config = {
        bucket: 'test-bucket',
        apiToken: 'test-api-token',
      };
      publisher = new PublisherR2(config as PublisherR2Config);

      await expect(
        publisher.publish({
          makeResults: mockMakeResults,
          dir: tmpDir,
          forgeConfig: mockForgeConfig,
          setStatusLine: mockSetStatusLine,
        }),
      ).rejects.toThrow(
        'In order to publish to R2, you must set the "accountId" property',
      );
    });

    it('should throw error when apiToken is not configured', async () => {
      const config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
      };
      publisher = new PublisherR2(config as PublisherR2Config);

      await expect(
        publisher.publish({
          makeResults: mockMakeResults,
          dir: tmpDir,
          forgeConfig: mockForgeConfig,
          setStatusLine: mockSetStatusLine,
        }),
      ).rejects.toThrow(
        'In order to publish to R2, you must set the "apiToken" property',
      );
    });

    it('should upload artifacts successfully with basic configuration', async () => {
      const config: PublisherR2Config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
        apiToken: 'test-api-token',
      };
      publisher = new PublisherR2(config);

      await publisher.publish({
        makeResults: mockMakeResults,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify wrangler was called for each artifact
      expect(execa).toHaveBeenCalledTimes(2);

      // Verify wrangler command structure
      const calls = vi.mocked(execa).mock.calls;
      const firstCall = calls[0];

      expect(firstCall[0]).toBe('npx');

      // Type assertion for the arguments array
      const wranglerArgs = firstCall[1] as string[];
      expect(wranglerArgs).toContain('wrangler');
      expect(wranglerArgs).toContain('r2');
      expect(wranglerArgs).toContain('object');
      expect(wranglerArgs).toContain('put');
      expect(wranglerArgs).toContain('--file');
      expect(wranglerArgs).toContain('--content-type');
      expect(wranglerArgs).toContain('--remote');

      // Verify bucket is in the command
      const bucketArg = wranglerArgs.find((arg: string) =>
        arg.includes('test-bucket'),
      );
      expect(bucketArg).toBeDefined();

      // Verify status line updates
      expect(mockSetStatusLine).toHaveBeenCalledWith(
        'Uploading distributable (0/2)',
      );

      expect(mockSetStatusLine).toHaveBeenCalledWith(
        'Uploading distributable (2/2)',
      );
    });

    it('should upload artifacts with custom folder', async () => {
      const config: PublisherR2Config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
        apiToken: 'test-api-token',
        folder: 'custom-folder',
      };
      publisher = new PublisherR2(config);

      await publisher.publish({
        makeResults: mockMakeResults,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify the key includes custom folder
      const calls = vi.mocked(execa).mock.calls;
      const firstCall = calls[0];
      const wranglerArgs = firstCall[1] as string[];
      const bucketKeyArg = wranglerArgs.find((arg) =>
        arg.includes('test-bucket/'),
      );
      expect(bucketKeyArg).toContain('custom-folder/');
    });

    it('should use correct content-type for different file types', async () => {
      const config: PublisherR2Config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
        apiToken: 'test-api-token',
      };
      publisher = new PublisherR2(config);

      await publisher.publish({
        makeResults: mockMakeResults,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Check DMG file content-type
      const calls = vi.mocked(execa).mock.calls;
      const dmgCall = calls.find((call: unknown) => {
        const args = (call as unknown[])[1] as string[];
        return args.some((arg) => arg.includes('.dmg'));
      });

      if (dmgCall) {
        const args = dmgCall[1] as string[];
        const dmgContentTypeIndex = args.indexOf('--content-type');
        if (dmgContentTypeIndex >= 0) {
          expect(args[dmgContentTypeIndex + 1]).toBe(
            'application/x-apple-diskimage',
          );
        }
      }

      // Check EXE file content-type
      const exeCall = calls.find((call: unknown) => {
        const args = (call as unknown[])[1] as string[];
        return args.some((arg) => arg.includes('.exe'));
      });

      if (exeCall) {
        const args = exeCall[1] as string[];
        const exeContentTypeIndex = args.indexOf('--content-type');
        if (exeContentTypeIndex >= 0) {
          expect(args[exeContentTypeIndex + 1]).toBe(
            'application/x-msdos-program',
          );
        }
      }
    });

    it('should handle upload failures gracefully', async () => {
      const config: PublisherR2Config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
        apiToken: 'test-api-token',
      };
      publisher = new PublisherR2(config);

      // Mock execa to fail
      vi.mocked(execa).mockRejectedValueOnce(
        Object.assign(new Error('Upload failed'), {
          stderr: 'Network error',
          stdout: '',
          exitCode: 1,
        }),
      );

      await expect(
        publisher.publish({
          makeResults: [mockMakeResults[0]],
          dir: tmpDir,
          forgeConfig: mockForgeConfig,
          setStatusLine: mockSetStatusLine,
        }),
      ).rejects.toThrow('Failed to upload');
    });

    it('should use custom keyResolver when provided', async () => {
      const customKeyResolver = vi.fn(
        (fileName: string, platform: string, arch: string) =>
          `releases/${platform}/${arch}/${fileName}`,
      );

      const config: PublisherR2Config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
        apiToken: 'test-api-token',
        keyResolver: customKeyResolver,
      };
      publisher = new PublisherR2(config);

      await publisher.publish({
        makeResults: [mockMakeResults[0]],
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify keyResolver was called
      expect(customKeyResolver).toHaveBeenCalledWith(
        'test-app-1.0.0.dmg',
        'darwin',
        'x64',
      );

      // Verify the custom key was used in the upload
      const calls = vi.mocked(execa).mock.calls;
      const firstCall = calls[0];
      const wranglerArgs = firstCall[1] as string[];
      const bucketKeyArg = wranglerArgs.find((arg) =>
        arg.includes('test-bucket/'),
      );
      expect(bucketKeyArg).toContain('releases/darwin/x64/test-app-1.0.0.dmg');
    });
  });
});

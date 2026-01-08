import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Upload } from '@aws-sdk/lib-storage';
import {
  ForgeMakeResult,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublisherR2, PublisherR2Config } from '../src/PublisherR2';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/lib-storage');
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

    // Mock Upload class
    const mockUpload = {
      done: vi.fn().mockResolvedValue({}),
      on: vi.fn().mockReturnThis(),
    };
    vi.mocked(Upload).mockImplementation(() => mockUpload as unknown as Upload);
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
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
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
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
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
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
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

    it('should throw error when accessKeyId is not configured', async () => {
      const config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
        secretAccessKey: 'test-secret-key',
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
        'In order to publish to R2, you must set the "accessKeyId" property',
      );
    });

    it('should throw error when secretAccessKey is not configured', async () => {
      const config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
        accessKeyId: 'test-access-key',
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
        'In order to publish to R2, you must set the "secretAccessKey" property',
      );
    });

    it('should upload artifacts successfully with basic configuration', async () => {
      const config: PublisherR2Config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
      };
      publisher = new PublisherR2(config);

      await publisher.publish({
        makeResults: mockMakeResults,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify Upload was called for each artifact
      expect(Upload).toHaveBeenCalledTimes(2);

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
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
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
      const calls = vi.mocked(Upload).mock.calls;
      const firstCall = calls[0];
      const params = firstCall[0] as { params: { Key: string } };
      expect(params.params.Key).toContain('custom-folder/');
    });

    it('should use correct content-type for different file types', async () => {
      const config: PublisherR2Config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
      };
      publisher = new PublisherR2(config);

      await publisher.publish({
        makeResults: mockMakeResults,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Check DMG file content-type
      const calls = vi.mocked(Upload).mock.calls;
      type UploadParams = { params: { Key: string; ContentType: string } };
      const dmgCall = calls.find((call: unknown[]) => {
        const params = call[0] as UploadParams;
        return params.params.Key.includes('.dmg');
      });

      if (dmgCall) {
        const params = dmgCall[0] as UploadParams;
        expect(params.params.ContentType).toBe('application/x-apple-diskimage');
      }

      // Check EXE file content-type
      const exeCall = calls.find((call: unknown[]) => {
        const params = call[0] as UploadParams;
        return params.params.Key.includes('.exe');
      });

      if (exeCall) {
        const params = exeCall[0] as UploadParams;
        expect(params.params.ContentType).toBe('application/x-msdos-program');
      }
    });

    it('should handle upload failures gracefully', async () => {
      const config: PublisherR2Config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
      };
      publisher = new PublisherR2(config);

      // Mock Upload to fail
      const mockUpload = {
        done: vi.fn().mockRejectedValue(new Error('Upload failed')),
        on: vi.fn().mockReturnThis(),
      };
      vi.mocked(Upload).mockImplementation(
        () => mockUpload as unknown as Upload,
      );

      await expect(
        publisher.publish({
          makeResults: [mockMakeResults[0]],
          dir: tmpDir,
          forgeConfig: mockForgeConfig,
          setStatusLine: mockSetStatusLine,
        }),
      ).rejects.toThrow('Upload failed');
    });

    it('should use custom keyResolver when provided', async () => {
      const customKeyResolver = vi.fn(
        (fileName: string, platform: string, arch: string) =>
          `releases/${platform}/${arch}/${fileName}`,
      );

      const config: PublisherR2Config = {
        bucket: 'test-bucket',
        accountId: 'test-account-id',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
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
      const calls = vi.mocked(Upload).mock.calls;
      const firstCall = calls[0];
      const params = firstCall[0] as { params: { Key: string } };
      expect(params.params.Key).toBe('releases/darwin/x64/test-app-1.0.0.dmg');
    });
  });
});

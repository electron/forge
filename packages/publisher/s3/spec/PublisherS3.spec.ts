import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import {
  ForgeMakeResult,
  ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublisherS3, PublisherS3Config } from '../src/PublisherS3';

// Mock AWS SDK modules
vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/lib-storage');
vi.mock('node:fs');

describe('PublisherS3', () => {
  let publisher: PublisherS3;
  let mockS3Client: vi.Mocked<S3Client>;
  let mockUpload: vi.Mocked<Upload>;
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
    await fs.promises.writeFile(
      path.join(tmpDir, 'RELEASES.json'),
      'fake-releases-json-content',
    );

    // Mock S3Client constructor
    mockS3Client = {
      send: vi.fn(),
    } as any;
    vi.mocked(S3Client).mockImplementation(() => mockS3Client);

    // Mock Upload class
    mockUpload = {
      on: vi.fn().mockReturnThis(),
      done: vi.fn().mockResolvedValue(undefined),
    } as any;
    vi.mocked(Upload).mockImplementation(() => mockUpload);

    // Mock fs.createReadStream
    vi.mocked(fs.createReadStream).mockReturnValue('fake-stream' as any);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a PublisherS3 instance with correct name', () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
      };
      publisher = new PublisherS3(config);
      expect(publisher.name).toBe('s3');
    });
  });

  describe('generateCredentials', () => {
    it('should return credentials when accessKeyId and secretAccessKey are provided', () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        sessionToken: 'test-session-token',
      };
      publisher = new PublisherS3(config);

      const credentials = publisher.generateCredentials();
      expect(credentials).toEqual({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        sessionToken: 'test-session-token',
      });
    });

    it('should return undefined when credentials are not provided', () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
      };
      publisher = new PublisherS3(config);

      const credentials = publisher.generateCredentials();
      expect(credentials).toBeUndefined();
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
      const config: PublisherS3Config = {};
      publisher = new PublisherS3(config);

      await expect(
        publisher.publish({
          makeResults: mockMakeResults,
          dir: tmpDir,
          forgeConfig: mockForgeConfig,
          setStatusLine: mockSetStatusLine,
        }),
      ).rejects.toThrow(
        'In order to publish to S3, you must set the "bucket" property',
      );
    });

    it('should upload artifacts successfully with basic configuration', async () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
        region: 'us-east-1',
      };
      publisher = new PublisherS3(config);

      await publisher.publish({
        makeResults: mockMakeResults,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify S3Client was created with correct options
      expect(S3Client).toHaveBeenCalledWith({
        credentials: undefined,
        region: 'us-east-1',
        endpoint: undefined,
        forcePathStyle: false,
      });

      // Verify Upload was called for each artifact
      expect(Upload).toHaveBeenCalledTimes(2);
      expect(mockUpload.done).toHaveBeenCalledTimes(2);

      // Verify status line updates
      expect(mockSetStatusLine).toHaveBeenCalledWith(
        'Uploading distributable (0/2)',
      );
      expect(mockSetStatusLine).toHaveBeenCalledWith(
        'Uploading distributable (1/2)',
      );
      expect(mockSetStatusLine).toHaveBeenCalledWith(
        'Uploading distributable (2/2)',
      );
    });

    it('should upload artifacts with custom folder and credentials', async () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
        folder: 'custom-folder',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        region: 'eu-west-1',
      };
      publisher = new PublisherS3(config);

      await publisher.publish({
        makeResults: mockMakeResults,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify S3Client was created with credentials
      expect(S3Client).toHaveBeenCalledWith({
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
          sessionToken: undefined,
        },
        region: 'eu-west-1',
        endpoint: undefined,
        forcePathStyle: false,
      });

      // Verify Upload parameters
      expect(Upload).toHaveBeenCalledWith({
        client: mockS3Client,
        leavePartsOnError: true,
        params: {
          Body: 'fake-stream',
          Bucket: 'test-bucket',
          Key: expect.stringContaining('custom-folder/'),
          ACL: 'private',
        },
      });
    });

    it('should upload artifacts with public ACL when public is true', async () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
        public: true,
      };
      publisher = new PublisherS3(config);

      await publisher.publish({
        makeResults: mockMakeResults,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify Upload parameters include public ACL
      expect(Upload).toHaveBeenCalledWith({
        client: mockS3Client,
        leavePartsOnError: true,
        params: {
          Body: 'fake-stream',
          Bucket: 'test-bucket',
          Key: expect.any(String),
          ACL: 'public-read',
        },
      });
    });

    it('should omit ACL when omitAcl is true', async () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
        omitAcl: true,
        public: true, // This should be ignored when omitAcl is true
      };
      publisher = new PublisherS3(config);

      await publisher.publish({
        makeResults: mockMakeResults,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify Upload parameters don't include ACL
      expect(Upload).toHaveBeenCalledWith({
        client: mockS3Client,
        leavePartsOnError: true,
        params: {
          Body: 'fake-stream',
          Bucket: 'test-bucket',
          Key: expect.any(String),
          // ACL should not be present
        },
      });
    });

    it('should set Cache-Control metadata for RELEASES file', async () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
        releaseFileCacheControlMaxAge: 3600,
      };
      publisher = new PublisherS3(config);

      const makeResultsWithReleases: ForgeMakeResult[] = [
        {
          artifacts: [path.join(tmpDir, 'RELEASES')],
          packageJSON: {
            name: 'test-app',
            version: '1.0.0',
          },
          platform: 'win32',
          arch: 'x64',
        },
      ];

      await publisher.publish({
        makeResults: makeResultsWithReleases,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify Upload parameters include Cache-Control header
      expect(Upload).toHaveBeenCalledWith({
        client: mockS3Client,
        leavePartsOnError: true,
        params: {
          Body: 'fake-stream',
          Bucket: 'test-bucket',
          Key: expect.any(String),
          ACL: 'private',
          CacheControl: 'max-age=3600',
        },
      });
    });

    it('should set Cache-Control metadata for RELEASES.json file', async () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
        releaseFileCacheControlMaxAge: 3600,
      };
      publisher = new PublisherS3(config);

      const makeResultsWithReleasesJson: ForgeMakeResult[] = [
        {
          artifacts: [path.join(tmpDir, 'RELEASES.json')],
          packageJSON: {
            name: 'test-app',
            version: '1.0.0',
          },
          platform: 'win32',
          arch: 'x64',
        },
      ];

      await publisher.publish({
        makeResults: makeResultsWithReleasesJson,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify Upload parameters include Cache-Control header for RELEASES.json
      expect(Upload).toHaveBeenCalledWith({
        client: mockS3Client,
        leavePartsOnError: true,
        params: {
          Body: 'fake-stream',
          Bucket: 'test-bucket',
          Key: expect.any(String),
          ACL: 'private',
          CacheControl: 'max-age=3600',
        },
      });
    });

    it('should set Cache-Control metadata for both RELEASES and RELEASES.json files in same upload', async () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
        releaseFileCacheControlMaxAge: 3600,
      };
      publisher = new PublisherS3(config);

      const makeResultsWithBothReleases: ForgeMakeResult[] = [
        {
          artifacts: [
            path.join(tmpDir, 'RELEASES'),
            path.join(tmpDir, 'RELEASES.json'),
          ],
          packageJSON: {
            name: 'test-app',
            version: '1.0.0',
          },
          platform: 'win32',
          arch: 'x64',
        },
      ];

      await publisher.publish({
        makeResults: makeResultsWithBothReleases,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify Upload was called twice (once for each RELEASES file)
      expect(Upload).toHaveBeenCalledTimes(2);
      expect(mockUpload.done).toHaveBeenCalledTimes(2);

      // Verify both uploads include Cache-Control header
      const uploadCalls = vi.mocked(Upload).mock.calls;
      expect(uploadCalls[0][0].params.CacheControl).toEqual('max-age=3600');
      expect(uploadCalls[1][0].params.CacheControl).toEqual('max-age=3600');
    });

    it('should not set Cache-Control metadata for non-RELEASES files', async () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
        releaseFileCacheControlMaxAge: 3600,
      };
      publisher = new PublisherS3(config);

      await publisher.publish({
        makeResults: mockMakeResults,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify Upload parameters don't include Cache-Control metadata for non-RELEASES files
      expect(Upload).toHaveBeenCalledWith({
        client: mockS3Client,
        leavePartsOnError: true,
        params: {
          Body: 'fake-stream',
          Bucket: 'test-bucket',
          Key: expect.any(String),
          ACL: 'private',
          // Metadata should not be present for non-RELEASES files
        },
      });
    });

    it('should handle upload progress events', async () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
      };
      publisher = new PublisherS3(config);

      await publisher.publish({
        makeResults: mockMakeResults,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify progress event handler was set up
      expect(mockUpload.on).toHaveBeenCalledWith(
        'httpUploadProgress',
        expect.any(Function),
      );
    });

    it('should handle custom endpoint and forcePathStyle', async () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
        endpoint: 'https://s3.example.com',
        s3ForcePathStyle: true,
      };
      publisher = new PublisherS3(config);

      await publisher.publish({
        makeResults: mockMakeResults,
        dir: tmpDir,
        forgeConfig: mockForgeConfig,
        setStatusLine: mockSetStatusLine,
      });

      // Verify S3Client was created with custom endpoint and forcePathStyle
      expect(S3Client).toHaveBeenCalledWith({
        credentials: undefined,
        region: undefined,
        endpoint: 'https://s3.example.com',
        forcePathStyle: true,
      });
    });
  });

  describe('s3KeySafe', () => {
    it('should replace @ and / characters in keys', () => {
      const config: PublisherS3Config = {
        bucket: 'test-bucket',
      };
      publisher = new PublisherS3(config);

      // Access the private method through the class instance
      const result = (publisher as any).s3KeySafe(
        'test@example.com/path/to/file',
      );
      expect(result).toBe('test_example.com_path_to_file');
    });
  });
});

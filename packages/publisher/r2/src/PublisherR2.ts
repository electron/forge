import path from 'node:path';

import {
  PublisherOptions,
  PublisherStatic,
} from '@electron-forge/publisher-static';
import debug from 'debug';
import { execa, ExecaError, Result } from 'execa';
import mime from 'mime-types';

import { PublisherR2Config } from './Config';

const d = debug('electron-forge:publish:r2');

type R2Artifact = {
  path: string;
  keyPrefix: string;
  platform: string;
  arch: string;
};

export default class PublisherR2 extends PublisherStatic<PublisherR2Config> {
  name = 'r2';

  private r2KeySafe = (key: string) => {
    return key.replace(/@/g, '_').replace(/\//g, '_');
  };

  private createWranglerExecutor(accountId: string, apiToken: string) {
    return async (...args: string[]) => {
      const env = {
        CLOUDFLARE_ACCOUNT_ID: accountId,
        CLOUDFLARE_API_TOKEN: apiToken,
      };

      d(`executing: npx wrangler ${args.join(' ')}`);

      return execa('npx', ['wrangler', ...args], {
        env,
        stdio: 'pipe',
      });
    };
  }

  async publish({
    makeResults,
    setStatusLine,
  }: PublisherOptions): Promise<void> {
    const artifacts: R2Artifact[] = [];

    if (!this.config.bucket) {
      throw new Error(
        'In order to publish to R2, you must set the "bucket" property in your Forge publisher config. See the docs for more info',
      );
    }

    if (!this.config.accountId) {
      throw new Error(
        'In order to publish to R2, you must set the "accountId" property in your Forge publisher config.',
      );
    }

    if (!this.config.apiToken) {
      throw new Error(
        'In order to publish to R2, you must set the "apiToken" property in your Forge publisher config.',
      );
    }

    const { accountId, apiToken } = this.config;

    for (const makeResult of makeResults) {
      artifacts.push(
        ...makeResult.artifacts.map((artifact) => ({
          path: artifact,
          keyPrefix:
            this.config.folder || this.r2KeySafe(makeResult.packageJSON.name),
          platform: makeResult.platform,
          arch: makeResult.arch,
        })),
      );
    }

    d('uploading to R2 bucket:', this.config.bucket);

    let uploaded = 0;
    const updateStatusLine = () =>
      setStatusLine(
        `Uploading distributable (${uploaded}/${artifacts.length})`,
      );

    updateStatusLine();

    const wrangler = this.createWranglerExecutor(accountId, apiToken);

    await Promise.all(
      artifacts.map(async (artifact) => {
        d('uploading:', artifact.path);
        await this.uploadFile(artifact, wrangler);
        uploaded += 1;
        updateStatusLine();
      }),
    );
  }

  private async uploadFile(
    artifact: R2Artifact,
    wrangler: (...args: string[]) => Promise<
      Result<{
        env: { [key: string]: string };
        stdio: 'pipe';
      }>
    >,
  ): Promise<void> {
    const key = this.keyForArtifact(artifact);
    const contentType =
      mime.lookup(artifact.path) || 'application/octet-stream';

    d(
      `uploading ${path.basename(artifact.path)} with content-type: ${contentType}`,
    );

    try {
      const { stderr, exitCode } = await wrangler(
        'r2',
        'object',
        'put',
        `${this.config.bucket}/${key}`,
        '--file',
        artifact.path,
        '--content-type',
        contentType,
        '--remote',
      );

      if (exitCode !== 0 && stderr) {
        throw new Error(stderr);
      }

      d(`successfully uploaded: ${path.basename(artifact.path)}`);
    } catch (error) {
      if (error instanceof ExecaError) {
        const errorMessage = error.stderr || error.stdout || error.message;
        d(`upload failed for ${path.basename(artifact.path)}: ${errorMessage}`);
        throw new Error(
          `Failed to upload ${path.basename(artifact.path)} to R2: ${errorMessage}`,
        );
      }
      throw new Error(
        `Failed to upload ${path.basename(artifact.path)} to R2: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

export { PublisherR2, PublisherR2Config };

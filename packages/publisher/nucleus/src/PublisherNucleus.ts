import PublisherBase, { PublisherOptions } from '@electron-forge/publisher-base';
import { asyncOra } from '@electron-forge/async-ora';
import { ForgePlatform, ForgeArch } from '@electron-forge/shared-types';
import debug from 'debug';
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

import { PublisherNucleusConfig } from './Config';

const d = debug('electron-forge:publish:nucleus');

export default class PublisherNucleus extends PublisherBase<PublisherNucleusConfig> {
  name = 'nucleus';

  async publish({ makeResults }: PublisherOptions) {
    const { config } = this;

    for (const [i, makeResult] of makeResults.entries()) {
      const msg = `Uploading result (${i}/${makeResults.length})`;
      d(msg);

      await asyncOra(msg, async () => {
        const data = new FormData();
        data.append('platform', makeResult.platform);
        data.append('arch', makeResult.arch);
        data.append('version', makeResult.packageJSON.version);

        let i = 0;
        for (const artifactPath of makeResult.artifacts) {
          // Skip the RELEASES file, it is automatically generated on the server
          if (path.basename(artifactPath).toLowerCase() === 'releases') continue;
          data.append('file' + i, fs.createReadStream(artifactPath));
          i += 1;
        }
    
        const response = await fetch(`${config.host}/rest/app/${config.appId}/channel/${config.channelId}/upload`, {
          headers: {
            Authorization: config.token,
          },
          method: 'POST',
          body: data,
        });
        
        if (response.status !== 200) {
          throw `Unexpected response code from Nucleus: ${response.status}\n\nBody:\n${await response.text()}`;
        }
      });
    }
  }
}

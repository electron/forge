import debug from 'debug';
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs-promise';
import path from 'path';

import asyncOra from '../util/ora-handler';

const d = debug('electron-forge:publish:ers');

const ersPlatform = (platform, arch) => {
  switch (platform) {
    case 'darwin':
      return 'osx_64';
    case 'linux':
      return arch === 'ia32' ? 'linux_32' : 'linux_64';
    case 'win32':
      return arch === 'ia32' ? 'windows_32' : 'windows_64';
    default:
      return platform;
  }
};

export default async (artifacts, packageJSON, forgeConfig, authToken, tag, platform, arch) => {
  const ersConfig = forgeConfig.electronReleaseServer;
  if (!(ersConfig.baseUrl && ersConfig.username && ersConfig.password)) {
    throw 'In order to publish to ERS you must set the "electronReleaseServer.baseUrl", "electronReleaseServer.username" and "electronReleaseServer.password" properties in your forge config. See the docs for more info'; // eslint-disable-line
  }

  d('attempting to authenticate to ERS');

  const api = apiPath => `${ersConfig.baseUrl}/${apiPath}`;

  const { token } = await (await fetch(api('api/auth/login'), {
    method: 'POST',
    body: JSON.stringify({
      username: ersConfig.username,
      password: ersConfig.password,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })).json();

  const authFetch = (apiPath, options) => fetch(api(apiPath), Object.assign({}, options || {}, {
    headers: Object.assign({}, (options || {}).headers, { Authorization: `Bearer ${token}` }),
  }));

  const versions = await (await authFetch('api/version')).json();
  const existingVersion = versions.find(version => version.name === packageJSON.version);

  let channel = 'stable';
  if (packageJSON.version.indexOf('beta') !== -1) {
    channel = 'beta';
  }
  if (packageJSON.version.indexOf('alpha') !== -1) {
    channel = 'alpha';
  }

  if (!existingVersion) {
    await authFetch('api/version', {
      method: 'POST',
      body: JSON.stringify({
        channel: {
          name: channel,
        },
        name: packageJSON.version,
        notes: '',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let uploaded = 0;
    await asyncOra(`Uploading Artifacts ${uploaded}/${artifacts.length}`, async (uploadSpinner) => {
      const updateSpinner = () => {
        uploadSpinner.text = `Uploading Artifacts ${uploaded}/${artifacts.length}`; // eslint-disable-line no-param-reassign
      };

      await Promise.all(artifacts.map(artifactPath =>
        new Promise(async (resolve, reject) => {
          if (existingVersion) {
            const existingAsset = existingVersion.assets.find(asset => asset.name === path.basename(artifactPath));
            if (existingAsset) {
              d('asset at path:', artifactPath, 'already exists on server');
              uploaded += 1;
              updateSpinner();
              return;
            }
          }
          try {
            d('attempting to upload asset:', artifactPath);
            const artifactForm = new FormData();
            artifactForm.append('token', token);
            artifactForm.append('version', packageJSON.version);
            artifactForm.append('platform', ersPlatform(platform, arch));
            artifactForm.append('file', fs.createReadStream(artifactPath));
            await authFetch('api/asset', {
              method: 'POST',
              body: artifactForm,
              headers: artifactForm.getHeaders(),
            });
            d('upload successful for asset:', artifactPath);
            uploaded += 1;
            updateSpinner();
          } catch (err) {
            reject(err);
          }
        })
      ));
    });
  } else {
    d('version already exists, not publishing');
  }
};

import * as path from 'path';

// eslint-disable-next-line node/no-unpublished-import
import { protocol } from 'electron';

import type { WebpackPluginConfig } from '../Config';

type InternalConfig = Required<Required<WebpackPluginConfig>['customProtocolForPackagedAssets']>;
declare const __ELECTRON_FORGE_INTERNAL_PROTOCOL_CONFIGURATION__: InternalConfig;

const config: InternalConfig = __ELECTRON_FORGE_INTERNAL_PROTOCOL_CONFIGURATION__ as any;

const appRoot = path.join(__dirname, '..');
const rendererRoot = path.join(appRoot, 'renderer');

const STATUS_CODE_BAD_REQUEST = 400;
const STATUS_CODE_FORBIDDEN = 403;
const STATUS_CODE_INTERNAL_SERVER_ERROR = 500;

protocol.registerFileProtocol(config.protocolName, (request, cb) => {
  try {
    const requestUrl = new URL(decodeURI(request.url));

    if (requestUrl.protocol !== `${config.protocolName}:`) {
      return cb({ statusCode: STATUS_CODE_BAD_REQUEST });
    }

    if (request.url.includes('..')) {
      return cb({ statusCode: STATUS_CODE_FORBIDDEN });
    }

    if (requestUrl.host !== 'renderer') {
      return cb({ statusCode: STATUS_CODE_BAD_REQUEST });
    }

    if (!requestUrl.pathname || requestUrl.pathname === '/') {
      return cb({ statusCode: STATUS_CODE_BAD_REQUEST });
    }

    // Resolve relative to appRoot
    const filePath = path.join(appRoot, requestUrl.pathname);
    // But ensure we are within the rendererRoot
    const relative = path.relative(rendererRoot, filePath);
    const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);

    if (!isSafe) {
      return cb({ statusCode: STATUS_CODE_BAD_REQUEST });
    }

    return cb({ path: filePath });
  } catch (error) {
    const errorMessage = `Unexpected error in ${config.protocolName}:// protocol handler.`;
    console.error(errorMessage, error);
    return cb({ statusCode: STATUS_CODE_INTERNAL_SERVER_ERROR });
  }
});

protocol.registerSchemesAsPrivileged([
  {
    scheme: config.protocolName,
    privileges: config.privileges,
  },
]);

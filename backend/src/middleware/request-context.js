import crypto from 'node:crypto';
import pinoHttp from 'pino-http';
import { logger } from '../config/logger.js';

export const requestContext = pinoHttp({
  logger,
  genReqId(request, response) {
    const incomingId = request.headers['x-request-id'];
    const requestId =
      typeof incomingId === 'string' && incomingId.length <= 128
        ? incomingId
        : crypto.randomUUID();
    response.setHeader('x-request-id', requestId);
    return requestId;
  },
  customProps(request) {
    return { requestId: request.id };
  },
  serializers: {
    req(request) {
      return {
        id: request.id,
        method: request.method,
        url: request.url,
        remoteAddress: request.remoteAddress
      };
    },
    res(response) {
      return { statusCode: response.statusCode };
    }
  }
});

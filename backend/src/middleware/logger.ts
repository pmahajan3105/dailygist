import {Json} from "../../global";
import logger from "../../util/logger";
import { Request, NextFunction } from 'express'

const { v4: uuidv4 } = require('uuid');
const createNamespace = require('cls-hooked').createNamespace;
const request = createNamespace('request');
const getNamespace = require('cls-hooked').getNamespace;

// const formatRequestMessage = (namespace, message, error, request, isResponse, keepResponse) => {
//     const requestId = namespace.get('id');
//     const startTime = namespace.get('startTime');
//     const userId = request?.user_id ? request.user_id.split('-')[0] : null;
//
//     if (request && !isResponse) {
//         let params = {};
//         if (request.body) Object.assign(params, { ...request.body });
//
//         return `[${requestId}] ${userId} [CLIENT_IP] ${request?.headers?.['x-forwarded-for']?.split(',').shift()} [PATH] ${request.originalUrl} [REQUEST] [${request.method}] ${JSON.stringify(params)}`;
//     }
//     if (isResponse) {
//         const getResponseTime = startTime ? getCurrentTimestamp().getTime() - startTime.getTime() : 0;
//
//         return keepResponse ?
//             `[${requestId}] ${userId} [CLIENT_IP] ${request?.headers?.['x-forwarded-for']?.split(',').shift()} [PATH] ${request.originalUrl} [STATUS] ${message.statusCode} [TIME] ${getResponseTime}ms [RESPONSE] ${message.body}` :
//             `[${requestId}] ${userId} [CLIENT_IP] ${request?.headers?.['x-forwarded-for']?.split(',').shift()} [PATH] ${request.originalUrl} [STATUS] ${message.statusCode} [TIME] ${getResponseTime}ms`;
//     }
//
//     return error ? `[${requestId}] ${message} ${error.toString()}` : `[${requestId}] ${message} `;
// }

const logRequest = (request: Request) => {
    const namespace = getNamespace('request');
    const requestId = namespace.get('id');
    // const startTime = namespace.get('startTime');

    logger.info(`[${requestId}] [PATH] ${request.originalUrl} [REQUEST] [${request.method}]`);
}

const logResponse = (request: Request, statusCode: number, data: any) => {
    const namespace = getNamespace('request');
    const requestId = namespace.get('id');
    // const startTime = namespace.get('startTime');

    logger.info(`[${requestId}] [PATH] ${request.originalUrl} [STATUS] ${statusCode} [DATA] ${data}`);
}


export const loggerMiddleware = async (req: Request, res: any, next: NextFunction) => {
    request.bindEmitter(req);
    request.run(() => {
        request.set('id', uuidv4());
        // request.set('startTime', getCurrentTimestamp());
        // console.log('==================================')
        logRequest(req);

        if (res) {
            const defaultEnd = res.end;
            const chunks: any[] = [];
            let responseStatusCode;
            let responseData: Json = { body: '', statusCode: 0 }

            res.end = (...restArgs: any[]) => {
                if (restArgs[0]) {
                    chunks.push(Buffer.from(restArgs[0]));
                }
                responseData.body = Buffer.concat(chunks).toString('utf8');
                defaultEnd.apply(res, restArgs);
            };

            res.once('finish', () => {
                responseStatusCode = res.statusCode
                responseData.statusCode = responseStatusCode

                if (responseStatusCode >= 400) {
                    logger.error(responseData.body);
                }

                if (responseStatusCode === 200) {
                    logResponse(req, responseStatusCode, responseData.body)
                    // logger.info(responseData.body);
                }
            });
        }
        return next();
    });
}

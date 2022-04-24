import * as http from 'http';
import { NextFunction, Request, Response } from 'express';
import { PErrorCode } from './error-codes';

/**
 * @export
 * @class PodcasterAppError
 * @extends {Error}
 */
export class PError extends Error {
    code: PErrorCode;
    message: string;
    name: 'PodcasterAppError';

    /**
     * Creates an instance of PodcasterAppError.
     * @param {string} [status]
     * @param {string} [message]
     * @memberof PodcasterAppError
     */
    constructor(code?: PErrorCode, message?: string) {
        super(message);

        Error.captureStackTrace(this, this.constructor);

        this.code = code || PErrorCode.unknown;
        this.name = this.name;
        this.message = (message) || ('ERR' + code) || 'PAError';
    }
}


export default PError;
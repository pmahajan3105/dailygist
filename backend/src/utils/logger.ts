import winston from 'winston';
import path from 'path';
import {isDevelopment} from "./environment";

class Logger {
    private logger: winston.Logger;

    constructor() {
        console.log(isDevelopment)
        const logDir = path.join(process.cwd(), 'logs');

        this.logger = winston.createLogger({
            level: isDevelopment ? 'debug' : 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.json()
            ),
            defaultMeta: { service: 'dailygist-service' },
            transports: [
                new winston.transports.File({
                    filename: path.join(logDir, 'error.log'),
                    level: 'error',
                }),
                new winston.transports.File({
                    filename: path.join(logDir, 'combined.log'),
                }),
            ],
        });

        if (isDevelopment) {
            this.logger.add(new winston.transports.Console({
                format: winston.format.simple(),
            }));
        }
    }

    info(message: string, meta?: any) {
        this.logger.info(message, meta);
    }

    error(message: string, meta?: any) {
        this.logger.error(message, meta);
    }

    warn(message: string, meta?: any) {
        this.logger.warn(message, meta);
    }

    debug(message: string, meta?: any) {
        this.logger.debug(message, meta);
    }
}

export default new Logger();
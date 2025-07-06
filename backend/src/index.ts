import express from 'express';
import cors from 'cors';
import {config, isDevelopment} from "./util/environment";
import logger from "./util/logger";
import {databaseService} from "./shared/database/service";
import {authRoutes} from "./services/auth/routes";
import {emailRoutes} from "./services/email/routes";
import {defineAssociations} from "./shared/database";
import {newsletterRoutes} from "./services/newsletter/routes";
import {categoryRoutes} from "./services/categories/routes";
import {cronJobs} from "./shared/cron";
import {loggerMiddleware} from "./shared/middlewares/logger";
import {taskRoutes} from "./services/task/routes";
import {homeRoutes} from "./services/home/routes";
import {timeoutHandler} from "./shared/middlewares/timeout.handler";


class App {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeAssociations();
        this.initializeCronJobs();
    }

    private initializeMiddlewares() {
        this.app.use(timeoutHandler);
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(loggerMiddleware);
    }

    private initializeRoutes() {
        this.app.use('/v1/oauth', authRoutes());
        this.app.use('/v1/email', emailRoutes());
        this.app.use('/v1/newsletter', newsletterRoutes());
        this.app.use('/v1/category', categoryRoutes());
        this.app.use('/v1/task', taskRoutes());
        this.app.use('/v1/home', homeRoutes());
    }

    private initializeAssociations = () => {
        defineAssociations();
    }

    private initializeCronJobs = () => {
        cronJobs();
    }

    public listen() {
        const port = config.port;
        // @ts-ignore
        databaseService.get().sync({ alter: isDevelopment | { drop: false } }).then(() => {
            this.app.listen(port, () => {
                logger.info(`Server running on port ${port}`);
            });
        }).catch((e: any) => logger.error(`Error occurred while starting server`, e));

    }
}

const app = new App();
app.listen();
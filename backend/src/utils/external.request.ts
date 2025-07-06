import logger from "./logger";
import axios from "axios";
import {Json} from "../global";

export class ExternalRequestController {
    private readonly baseURL: any;
    private handler: any;

    constructor(url: string) {
        this.baseURL = url
        this.handler = axios.create({ baseURL: this.baseURL, timeout: 1000 });
    }

    post = async (url: string, body: Json, config= null) => {
        logger.info(`Sending post request to url: ${url} with body: ${body?.toString()}`);
        const response = await this.handler.post(url, body, config)
            .then((data: any) => data)
            .catch((error: any) => error.response);

        logger.info(`Response: ${JSON.stringify(response?.data)}`);
        return response;
    }

    get = async (url: string) => {
        logger.info(`Sending get request to url: ${url}`);
        const response = await this.handler.get(url).then((data: any) => data)
            .catch((error: any) => error.response);

        logger.info(`Response: ${JSON.stringify(response?.data)}`);
        return response;
    }

    put = async (url: string, body: Json) => {
        logger.info(`Sending put request to url: ${url} with body: ${JSON.stringify(body)}`);
        const response = await this.handler.put(url, body).then((data: any) => data)
            .catch((error: any) => error.response);

        logger.info(`Response: ${JSON.stringify(response?.data)}`);
        return response;
    }

    delete = async (url: string, config: Json) => {
        logger.info(`Sending delete request to url: ${url}`);
        const response = await this.handler.delete(url, config).then((data: any) => data)
            .catch((error: any) => error.response);

        logger.info(`Response: ${JSON.stringify(response?.data)}`);
        return response;
    }
}

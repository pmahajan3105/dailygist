import {QueryTypes} from "sequelize";

const {Sequelize} = require("sequelize");
import { config } from "../../util/environment";

class DatabaseService {
    private readonly sequelize;
    constructor() {
        if (!this.sequelize) {
            const databaseConfig = config.database;
            this.sequelize = new Sequelize(
                databaseConfig.database, databaseConfig.username, databaseConfig.password,
                Object.assign({}, databaseConfig, DatabaseService.getOptions())
            );
        }
    }

    static getOptions = () => {
        return {
            define: {
                freezeTableName: true
            },
            pool: {
                max: 25,
                min: 5,
                idle: 10000,
                acquire: 30000
            },
            logging: false
        }
    }

    get = () => {
        return this.sequelize
    }

    executeRawQuery = async (sqlQuery: string, showQuery = false ) => {
        let res = null;
        try {
            if (showQuery) console.log(`Query to be executed: ${ sqlQuery }`);
            res = await this.sequelize.query(sqlQuery, { type: QueryTypes.RAW });
        }
        catch (e) {
            console.error(`Error occurred while executing the script ${ sqlQuery }`, e);
            return null;
        }
        return res[ 0 ];
    }
}

export const databaseService = new DatabaseService();

import {Json} from "../../global";

export class BaseAccessor {
    private readonly model;
    constructor(model: any) {
        this.model = model;
    }

    create = async (data: Json, transaction = null) => {
        if (transaction) {
            return this.model.create(data, { transaction });
        }
        else {
            return this.model.create(data);
        }
    }


    findOne = async (condition: Json, attributes = []) => {
        if (attributes.length > 0) {
            return await this.model.findOne({
                where: condition,
                attributes
            });
        }
        return await this.model.findOne({
            where: condition
        });
    }

    update = async (condition: Json, updateObj: Json) => {
        return await this.model.update(updateObj, {
            where: { ...condition },
            returning: true,
        });
    }

    findAll = async (condition: Json | null = null, attributes: string[] = []) => {
        let obj = {}
        if (condition) {
            obj = {
                ...obj,
                where: condition
            }
        }
        if (attributes.length > 0) {
            obj = {
                ...obj,
                attributes
            }
        }
        return await this.model.findAll(obj);
    }

    delete = async (condition: Json) => {
        return await this.model.destroy({
            where: condition
        });
    }

    bulkCreate = async (instances: any[]) => {
        return await this.model.bulkCreate(instances, {
            returning: true
        });
    }
}

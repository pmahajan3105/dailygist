import {databaseService} from "./service";
import {user, connection} from '../../services/auth/model';
import {taskHistory} from '../../services/task/model';
import {
    newsletter,
    newsletterSummary,
    userNewsletter,
    newsletterDirectory,
    newsletterHighlights
} from "../../services/newsletter/models";
import {category, userCategoryMapping} from "../../services/categories/model";
import {userStreak} from "../../services/home/models";

const User = user(databaseService.get());
const Connection = connection(databaseService.get());
const TaskHistory = taskHistory(databaseService.get());
const Newsletter = newsletter(databaseService.get());
const Category = category(databaseService.get());
const NewsletterSummary = newsletterSummary(databaseService.get());
const UserNewsletter = userNewsletter(databaseService.get());
const NewsletterDirectory = newsletterDirectory(databaseService.get());
const UserCategoryMapping = userCategoryMapping(databaseService.get());
const UserStreak = userStreak(databaseService.get());
const NewsletterHighlights = newsletterHighlights(databaseService.get());

export const defineAssociations = () => {
    TaskHistory.belongsTo(User, {
        foreignKey: {
            name: 'userId',
            field: 'user_id',
            allowNull: false
        }
    });

    Connection.belongsTo(User, {
        foreignKey: {
            name: 'userId',
            field: 'user_id',
            allowNull: false
        }
    });

    Newsletter.belongsTo(NewsletterSummary, {
        foreignKey: {
            name: 'summaryId',
            field: 'summary_id',
        }
    })
    Newsletter.belongsTo(Category, {
        foreignKey: {
            name: 'categoryId',
            field: 'category_id',
        }
    })

    NewsletterSummary.belongsTo(User, {
        foreignKey: {
            name: 'userId',
            field: 'user_id',
            allowNull: false
        }
    });

    UserNewsletter.belongsTo(User,{
        foreignKey: {
            name: 'userId',
            field: 'user_id'
        },
        onDelete: 'cascade',
        hooks: false
    });
    UserNewsletter.belongsTo(Newsletter,{
        foreignKey:  {
            name: 'newsletterId',
            field: 'newsletter_id'
        },
        onDelete: 'cascade',
        hooks: false
    });

    NewsletterDirectory.belongsTo(Category,{
        foreignKey: {
            name: 'categoryId',
            field: 'category_id',
            allowNull: false
        },
    });

    UserCategoryMapping.belongsTo(User,{
        foreignKey: {
            name: 'userId',
            field: 'user_id'
        },
        onDelete: 'cascade',
        hooks: false
    });
    UserCategoryMapping.belongsTo(Category,{
        foreignKey:  {
            name: 'categoryId',
            field: 'category_id'
        },
        onDelete: 'cascade',
        hooks: false
    });

    UserStreak.belongsTo(User, {
        foreignKey: {
            name: 'userId',
            field: 'user_id'
        },
        onDelete: 'cascade',
        hooks: false
    });

    NewsletterHighlights.belongsTo(NewsletterSummary, {
        foreignKey: {
            name: 'summaryId',
            field: 'summary_id'
        },
        onDelete: 'cascade',
        hooks: false
    });

    NewsletterHighlights.belongsTo(User, {
        foreignKey: {
            name: 'userId',
            field: 'user_id'
        },
        onDelete: 'cascade',
        hooks: false
    });
}
export const dbModels  = {
    User, Connection, TaskHistory, Newsletter, Category, NewsletterSummary, UserNewsletter,
    NewsletterDirectory, UserCategoryMapping, databaseService, UserStreak, NewsletterHighlights
}


'use strict';

const { sanitizeEntity } =  require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async findCustom(ctx){
        const requestQuery = ctx.query;
        // let populates = [];
        // let removal = "";

        // if(requestQuery._populate){
        //     populates = requestQuery._populate;
        //     delete requestQuery._populate
        // }

        // if(requestQuery._remove){
        //     removal = requestQuery._remove;
        //     delete requestQuery._remove;
        // }

        let entities;
        if (requestQuery._q) {
            entities = await strapi.services.tags.search(requestQuery);
        } else {
            // entities = await strapi.query('tags').find(requestQuery, populates);
            entities = await strapi.query('tags').model.find().select({
                Name: 1
            })
        }

        return entities.map(entity => {
            // delete entity[removal];
            return sanitizeEntity(entity, { model: strapi.models.tags })
        });
    }
};

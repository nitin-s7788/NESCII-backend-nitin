'use strict';
const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    async findCustom(ctx){
        const requestQuery = ctx.query;
        let populates = [];
        let removal = "";
        let forPage = "";

        if(requestQuery._populate){
            populates = requestQuery._populate;
            delete requestQuery._populate
        }

        if(requestQuery._remove){
            removal = requestQuery._remove;
            delete requestQuery._remove;
        }

        if(requestQuery._for){
            forPage = requestQuery._for;
            delete requestQuery._for;
        }

        let entities;
        try{
            if (ctx.query._q) {
                entities = await strapi.query('categories').search(requestQuery);
            } else {
                entities = await strapi.query('categories').model.find().sort({Name: 1});
            }
        } catch(err){
            console.log(err);
            return ctx.send('Something went wrong!', 500);
        }

        return entities.map(entity => {
            delete entity[removal];
            // if(!entity.blogs)
            //     entity.blogs = [];

            // if(forPage == 'homepage'){
            //     entity.blogs = entity.blogs.length;
            // }

            return sanitizeEntity(entity, { model: strapi.query('categories').model })
        });
    }
};

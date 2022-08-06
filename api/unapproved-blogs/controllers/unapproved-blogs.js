'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    async create(ctx) {
        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            data.author = ctx.state.user.id;

            let searchTags = data.tagNames;
            searchTags.push(`${ctx.state.user.name}`);
            data.search_tags = searchTags;

            entity = await strapi.services['unapproved-blogs'].create(data, { files });
        } else {
            ctx.request.body.author = ctx.state.user.id;

            let searchTags = ctx.request.body.tagNames;
            searchTags.push(`${ctx.state.user.name}`);
            ctx.request.body.search_tags = searchTags;

            entity = await strapi.services['unapproved-blogs'].create(ctx.request.body);
        }
        return sanitizeEntity(entity, { model: strapi.models['unapproved-blogs'] });
    },

    async update(ctx) {
        const { id } = ctx.params;

        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            entity = await strapi.services['unapproved-blogs'].update({ id }, data, { files });
        } else {
            entity = await strapi.services['unapproved-blogs'].update({ id }, ctx.request.body);
        }

        return sanitizeEntity(entity, { model: strapi.models['unapproved-blogs'] });
    },

    async delete(ctx){
        const { id } = ctx.params;

        const entity = await strapi.services['unapproved-blogs'].delete({ id });

        if(entity.ImageUrl.length > 0){
            strapi.plugins["upload"].services.upload.remove({id: entity.ImageUrl[0].id});
        }

        if(entity.content_images && entity.content_images.length > 0){
            entity.content_images.forEach((item)=>{
                strapi.plugins['upload'].services.upload.remove({ id: item.id });
            });
        }

        return sanitizeEntity(entity, { model: strapi.models['unapproved-blogs'] });
    },

    async approve(ctx){
        const { id } = ctx.params;

        if(!ctx.request.body.approval_2){
            if(ctx.request.body.currentApproval){
                let currentBlog = await strapi.services.blogs.findOne({ id });
                currentBlog.approval_2 = false;
                await strapi.services['unapproved-blogs'].create(currentBlog);
                await strapi.services.blogs.delete({ id });

                return currentBlog;
            }

            let rejectedBlog = await strapi.services['unapproved-blogs'].update({ id }, {
                approval_2 : false
            });
            return sanitizeEntity(rejectedBlog, { model: strapi.models.blogs });
        }

        let entity = await strapi.services['unapproved-blogs'].findOne({id});
        if(!entity){
            ctx.response.status = 404;
            ctx.response.message = "Requested blog not found.";
            return;
        }

        let newBlog;
        console.log(ctx.request.body.featured);
        if(ctx.request.body.featured){
            entity.featured = true;
        }

        if(entity.original_blog_id){

            let currentBlog = await strapi.query('blogs').findOne({ id: entity.original_blog_id });
            if(!currentBlog){
                return ctx.send({message: 'Requested blog is not available.'}, 400);
            }

            let newContent = entity.Content;
            let newTagline = entity.tagline;
            let newTitle = entity.Title;
            let newImage = entity.ImageUrl;
            let newTags = entity.tags;
            let newCategory = entity.category;

            if(newImage){
                newBlog = await strapi.services.blogs.update({ id: entity.original_blog_id }, {
                    Content: newContent,
                    tagline: newTagline,
                    Title: newTitle,
                    ImageUrl: newImage,
                    tags: newTags,
                    category: newCategory
                });
            } else {
                newBlog = await strapi.services.blogs.update({ id: entity.original_blog_id }, {
                    Content: newContent,
                    tagline: newTagline,
                    Title: newTitle,
                    tags: newTags,
                    category: newCategory
                });
            }
            
        } else {
            entity.approval_2 = true;

            newBlog = await strapi.services.blogs.create(entity);

            const blogAuthor = await strapi.query('user', 'users-permissions').findOne({id: newBlog.author.id}, ['role']);
            
            if(blogAuthor.role.name=='Admin'){
                strapi.services['email'].sendMailToAllUsers('New Blog by NESCII Admin', 'newBlog1', {
                    "title": `${newBlog.Title}`, 
                    "tagline": `${newBlog.tagline}`, 
                    "redirectLink": `https://nescii.com/blogs/view/${newBlog._id}`, 
                    "imgLink": `${newBlog.ImageUrl[0] ? newBlog.ImageUrl[0].url : 'https://nescii.s3.ap-south-1.amazonaws.com/Literary_5e40a006c9.jpg'}`, 
                    "mailTitle": `New Blog by NESCII Admin`
                });
            } else {
                await strapi.services['unapproved-blogs'].sendApprovalMail(newBlog);
            }

        }
        await strapi.services['unapproved-blogs'].delete({id});

        return sanitizeEntity(newBlog, { model: strapi.models['unapproved-blogs'] });
    },
    async findCustom(ctx){
        const requestQuery = ctx.query;
        let populates = [];
        let removal = "";
        if(requestQuery._populate){
          populates = requestQuery._populate;
          delete requestQuery._populate
        }
    
        if(requestQuery._remove){
          removal = requestQuery._remove;
          delete requestQuery._remove;
        }
    
        let entities;
        if (ctx.query._q) {
          entities = await strapi.services.blogs.search(requestQuery);
        } else {
          entities = await strapi.query('unapproved-blogs').find(requestQuery, populates);
        }
    
        return entities.map(entity => {
          delete entity[removal];
          return sanitizeEntity(entity, { model: strapi.models['unapproved-blogs'] })
        });
    }
};

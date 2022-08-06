"use strict";
// const { allow } = require("joi");
const { sanitizeEntity, parseMultipartData } = require("strapi-utils");
// const parseMultipart = require("strapi-utils/lib/parse-multipart");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async findOne(ctx){
    const { id } = ctx.params;
    let currentBlog = await strapi.services.blogs.findOne({ id });

    if(!currentBlog){
      return ctx.send('Requested blog not found.', 404);
    }

    await strapi.services.blogs.update({id}, {
      Content: currentBlog.Content,
      view_count: currentBlog.view_count + 1
    });
    
    return sanitizeEntity(currentBlog, { model: strapi.models.blogs });
  },

  async report(ctx) {
    try {
      await strapi.query("blogs").model.updateOne(
        { _id: ctx.params.id, approval_2: true },
        {
          $addToSet: { reports: ctx.state.user.id },
        }
      );
      ctx.response.status = 200;
    } catch (e) {
      ctx.response.status = 500;
    }
  },

  /**
   *
   * Step 1: Get the blog.
   * Step 2: Check the user is allowed to delete the blog
   * Step 3: Fetch the comments of the blog
   * Step 4: For each comment delete all its replies
   * Step 5: Delete all the comments
   * Step 6: Delete the blog
   */

  async del(ctx) {
    const blogID = ctx.params.id;
    const user = ctx.state.user;
    try {
      const blog = await strapi.query("blogs").findOne({ id: blogID });
      if (!blog) {
        ctx.send({ message: "Bad Request" }, 400);
        return;
      }
      if (user.id === blog.author.id) {
        const comments = await strapi.query("comment").find({ blog: blogID });
        comments.forEach(async (element) => {
          strapi
            .query("reply")
            .model.deleteMany({ of_comment: element.id });
        });
        strapi.query("comment").model.deleteMany({ blog: blogID });
        
        if (blog.ImageUrl.length > 0) {
          const file = await strapi.plugins["upload"].services.upload.fetch({
            id: blog.ImageUrl[0].id,
          });
          if (file) {
            strapi.plugins["upload"].services.upload.remove(file);
          }
        }

        if(blog.content_images && blog.content_images.length > 0){
          blog.content_images.forEach((item)=>{
            strapi.plugins['upload'].services.upload.remove({id: item.id});
          })
        }

        strapi.services.blogs.delete({ id: blogID });

        ctx.send({ message: "OK" }, 200);
      } else {
        ctx.send({ message: "Unauthorized" }, 403);
      }
    } catch (e) {
      console.log(e);
      ctx.send({ message: "Internal Server Error" }, 500);
    }
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
      entities = await strapi.query('blogs').find(requestQuery, populates);
    }

    return entities.map(entity => {
      delete entity[removal];
      return sanitizeEntity(entity, { model: strapi.models.blogs })
    });
  }
};

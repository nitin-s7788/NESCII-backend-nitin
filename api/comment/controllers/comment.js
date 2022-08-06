"use strict";

const { sanitizeEntity } = require("strapi-utils/lib");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    let comment;
    if (ctx.is("multipart")) {
      ctx.response.status = 400;
      return { status: ctx.response.status, message: ctx.response.message };
    } else {
      try {
        ctx.request.body.author = ctx.state.user.id;
        const currentBlog = await strapi.services.blogs.findOne({
          id: ctx.request.body.blog,
        });
        // await strapi.plugins['email'].services.email.send({
        //   from: 'Nescii Admin<editor.nescii@gmail.com',
        //   to: `${blog.author.email}`,
        //   subject: `Comment has been posted on you blog ${blog.Title}`,
        //   text: `
        //     Your blog ${blog.Title} has a new comment posted by ${ctx.state.user.name}. 
        //   `
        // });
        if (currentBlog.approval_2) {
          comment = await strapi.services.comment.create(ctx.request.body);

          strapi.services.email.sendCustomMail(`${currentBlog.author.email}`, `A Comment has been posted on your Blog - "${currentBlog.Title}"`, 'newComment1',
            {
              "author": `by ${comment.author.name}`,
              "blogTitle": `${currentBlog.Title}`, 
              "content": `${comment.Comment}`, 
              "redirectLink": `https://nescii.com/blogs/view/${currentBlog._id}`, 
              "authorImage": `${comment.author.avatar ? comment.author.avatar.url : 'https://nescii.s3.ap-south-1.amazonaws.com/avatar_1577909_1280_f23001cdad.webp'}`,
              "mailFooterText": "on blog -"
              // "mailTitle": "New Comment"
            }
          );

          return sanitizeEntity(comment, { model: strapi.models.comment });
        } else {
          ctx.send({ message: "Invalid Request" }, 400);
        }
      } catch (e) {
        if (e.output && e.output.payload.message === "ValidationError") {
          ctx.response.status = 400;
          ctx.response.message =
            "Not enough field specified. Specify all the required fields";
        } else {
          ctx.response.status = 500;
        }
        return { status: ctx.response.status, message: ctx.response.message };
      }
    }
  },
};

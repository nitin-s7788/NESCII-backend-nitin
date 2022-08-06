"use strict";

const { sanitizeEntity } = require("strapi-utils/lib");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    let reply;
    if (ctx.is("multipart")) {
      ctx.response.status = 400;
      return { status: ctx.response.status, message: ctx.response.message };
    } else {
      try {
        ctx.request.body.author = ctx.state.user.id;
        reply = await strapi.services.reply.create(ctx.request.body);
        return sanitizeEntity(reply, { model: strapi.models.reply });
      } catch (e) {
        if (e.output.payload.message === "ValidationError") {
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

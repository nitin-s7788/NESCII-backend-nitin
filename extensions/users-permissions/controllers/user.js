"use strict";
const { parseMultipartData, sanitizeEntity, convertRestQueryParams } = require("strapi-utils");
const Joi = require("joi");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const sanitizeUser = (user) => {
    user.blogs.forEach((item)=>item.Content = "");
    user.blogs.unapproved_blogs.forEach((item)=>item.Content = "");
    
    sanitizeEntity(user, {
      model: strapi.query("user", "users-permissions").model,
    });
  }

module.exports = {
  async findAUser(ctx) {
    const { id } = ctx.params;
    let user = await strapi.query('user', "users-permissions").findOne({id}, [
      {
        path: "events",
        populate: "event_categories"
      },
      "preferences",
      "blogs",
      "unapproved_blogs",
      "followers",
      "following",
      "role"
    ]);

    if (!user) {
        return ctx.send('Requested user does not exist.', 404);
    }

    user.blogs.forEach((item)=>item.Content = "");
    user.unapproved_blogs.forEach((item)=>item.Content = "");
    return sanitizeEntity(user, {
      model: strapi.query("user", "users-permissions").model
    });
  },

  async find(ctx) {
    let users;

    if (ctx.query._q) {
      users = await strapi
        .query("user", "users-permissions")
        .search(ctx.query, [
          {
            path: "blogs_bookmark",
            select: "id",
            populate: [
              {
                path: "author",
              },
            ],
          },
          {
            path: "blog_upvotes",
            select: "id",
            populate: [
              {
                path: "author",
              },
            ],
          },
          {
            path: "blogs",
            select: "id",
            // match: { approval_2: true },
          },
          {
            select: "id",
            path: "followers",
          },
          {
            select: "id",
            path: "following",
          },
          // {
          //   select: "id",
          //   path: "comments",
          // },
          // {
          //   select: "id",
          //   path: "replies",
          // },
        ]);
    } else {
      users = await strapi.query("user", "users-permissions").find(ctx.query, [
        {
          path: "blogs_bookmark",
          select: "id",
          populate: [
            {
              path: "author",
            },
          ],
        },
        {
          path: "blog_upvotes",
          select: "id",
          populate: [
            {
              path: "author",
            },
          ],
        },
        {
          path: "blogs",
          select: "id",
          // match: { approval_2: true },
        },
        {
          select: "id",
          path: "followers",
        },
        {
          select: "id",
          path: "following",
        },
        // {
        //   select: "id",
        //   path: "comments",
        // },
        // {
        //   select: "id",
        //   path: "replies",
        // },
      ]);
    }

    return users.map(sanitizeUser);
  },

  async updateUserOps(ctx) {
    const userToFollowId = ctx.request.body.id;
    if (ctx.state.user.id === userToFollowId) return ctx.response.send();
    try {
      if (ctx.request.body.operation === "follow") {
        await strapi.query("user", "users-permissions").model.updateOne(
          { _id: ctx.state.user.id },
          {
            $addToSet: { following: userToFollowId },
          }
        );
        await strapi.query("user", "users-permissions").model.updateOne(
          { _id: userToFollowId },
          {
            $addToSet: { followers: ctx.state.user.id },
          }
        );

        const userFollowedData = await strapi.query("user", "users-permissions").model.findOne({ _id: userToFollowId });
        try{
          await strapi.services.email.sendCustomMail(`${userFollowedData.email}`, `Yay! You have a new follower`, 'newFollower1',
            {
              "author": `${ctx.state.user.name}`, 
              "content": 'started following you.', 
              "redirectLink": `https://nescii.com/profile/${ctx.state.user.id}`, 
              "authorImage": `${ctx.state.user.avatar ? ctx.state.user.avatar.url : 'https://nescii.s3.ap-south-1.amazonaws.com/avatar_1577909_1280_f23001cdad.webp'}`,
              "mailFooterText": "Tap to see thier profile"
            }
          );
        } catch(error){
          console.log(error);
        }

      } else if (ctx.request.body.operation === "unfollow") {
        await strapi.query("user", "users-permissions").model.updateOne(
          { _id: ctx.state.user.id },
          {
            $pull: { following: userToFollowId },
          }
        );
        await strapi.query("user", "users-permissions").model.updateOne(
          { _id: userToFollowId },
          {
            $pull: { followers: ctx.state.user.id },
          }
        );
      } else if (ctx.request.body.operation === "upvote") {
        if (!ctx.request.body.blogId) return ctx.badRequest("missing blog id");
        await strapi.query("blogs").model.updateOne(
          { _id: ctx.request.body.blogId },
          {
            $addToSet: { upvoters: ctx.state.user.id },
          }
        );
      } else if (ctx.request.body.operation === "downvote") {
        if (!ctx.request.body.blogId) return ctx.badRequest("missing blog id");
        await strapi.query("blogs").model.updateOne(
          { _id: ctx.request.body.blogId },
          {
            $pull: { upvoters: ctx.state.user.id },
          }
        );
      } else if (ctx.request.body.operation === "addBookmark") {
        if (!ctx.request.body.blogId) return ctx.badRequest("missing blog id");
        await strapi.query("user", "users-permissions").model.updateOne(
          { _id: ctx.state.user.id },
          {
            $addToSet: { blogs_bookmark: ctx.request.body.blogId },
          }
        );
      }
      else if (ctx.request.body.operation === "removeBookmark") {
        if (!ctx.request.body.blogId) return ctx.badRequest("missing blog id");
        await strapi.query("user", "users-permissions").model.updateOne(
          { _id: ctx.state.user.id },
          {
            $pull: { blogs_bookmark: ctx.request.body.blogId },
          }
        );
      }
       else {
        throw new Error("Unknown operation");
      }

      // let user = await strapi
      //   .query("user", "users-permissions")
      //   .findOne({ _id: ctx.state.user.id });

      // return sanitizeEntity(user, {
      //   model: strapi.query("user", "users-permissions").model,
      // });

      return { data: 'success', error: null };
    } catch (e) {
      return ctx.response.send();
    }
  },

  async updateProfile(ctx) {
    const validConnect = Joi.object({
      modeOfConnect: Joi.string()
        .valid("github", "facebook", "linkedin", "instagram")
        .required(),
      profileURL: Joi.string().required(),
    });
    const validObj = Joi.object({
      Age: Joi.number().integer().allow(""),
      gender: Joi.string().valid("Male", "Female", "Other", ""),
      connectWithUs: Joi.array()
        .items(validConnect)
        .unique("modeOfConnect")
        .unique("profileURL"),
      bio: Joi.string().allow(""),
      name: Joi.string().allow(""),
      institute: Joi.string().allow(""),
      Contact_Number: Joi.number().allow(""),
    });

    const id = ctx.state.user.id;

    let user, avatar;
    const allowedProps = [
      "gender",
      "bio",
      "name",
      "institute",
      "connectWithUs",
      "Age",
      "Contact_Number",
    ];

    try {
      if (ctx.is("multipart")) {
        const { data, files } = parseMultipartData(ctx);
        const updateData = Object.keys(data)
          .filter((key) => allowedProps.includes(key))
          .reduce((obj, key) => {
            obj[key] = data[key];
            return obj;
          }, {});
        Joi.assert(updateData, validObj);
        if (ctx.state.user.avatar) {
          if (Array.isArray(files)) {
            throw strapi.errors.badRequest(null, {
              errors: [
                {
                  id: "Upload.replace.single",
                  message: "Cannot replace a file with multiple ones",
                },
              ],
            });
          }
          [user, avatar] = await Promise.allSettled([
            strapi
              .query("user", "users-permissions")
              .update({ id }, updateData, { files }),
            strapi.plugins.upload.services.upload.replace(
              ctx.state.user.avatar.id,
              {
                data: {
                  name: null,
                  alternativeText: null,
                  caption: null,
                },
                file: files.avatar,
              }
            ),
          ]);
        } else {
          [user, avatar] = await Promise.allSettled([
            strapi
              .query("user", "users-permissions")
              .update({ id }, updateData, { files }),
            strapi.plugins.upload.services.upload.upload({
              data: {
                name: null,
                alternativeText: null,
                caption: null,
                refId: ctx.state.user.id,
                ref: "user",
                field: "avatar",
                source: "users-permissions",
              },
              files: files.avatar,
            }),
          ]);
        }
      } else {
        const updateData = Object.keys(ctx.request.body)
          .filter((key) => allowedProps.includes(key))
          .reduce((obj, key) => {
            obj[key] = ctx.request.body[key];
            return obj;
          }, {});
        Joi.assert(updateData, validObj);
        user = await strapi
          .query("user", "users-permissions")
          .update({ id }, updateData);
      }

      return sanitizeEntity(user, {
        model: strapi.query("user", "users-permissions").model,
      });
    } catch (e) {
      if (Joi.isError(e)) {
        return ctx.badRequest(e.details[0].message);
      }
      ctx.response.status = 500;
    }
  },

  async me(ctx) {
    if (!ctx.state.user) {
      return ctx.badRequest(null, [
        { messages: [{ id: "No authorization header was found" }] },
      ]);
    }

    const user = await strapi.query('user', 'users-permissions').findOne({id: ctx.state.user.id}, [
      {
        path: "events",
        populate: "event_categories"
      },
      "unapproved_blogs",
      "followers",
      "following",
      "role"
    ]);

    return sanitizeEntity(user, {model: strapi.query('user', 'users-permissions').model});
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
      entities = await strapi.query('user', 'users-permissions').search(requestQuery);
    } else {
      entities = await strapi.query('user', 'users-permissions').find(requestQuery, populates);
    }

    return entities.map(entity => {
      delete entity[removal];
      entity.blogs = entity.blogs ? entity.blogs.length : 0;


      // console.log(entity);        
        
      return sanitizeEntity(entity, { model: strapi.query('user', 'users-permissions').model })
    });
  },

  async findOneCustom(ctx){
    let populates = [];
    let removal = "";
    const requestQuery = ctx.query;

    if(requestQuery._populate){
      populates = requestQuery._populate;
    }

    if(requestQuery._remove){
      removal = requestQuery._remove;
    }

    const { id } = ctx.params;
    const entity = await strapi.query('user', 'users-permissions').findOne({id}, populates);

    if(removal)
      delete entity[removal];

    return sanitizeEntity(entity, { model: strapi.query('user', 'users-permissions').model });
  },

  async getAllValid(ctx) {
    try {
      let data = await strapi.plugins[
        "users-permissions"
      ].services.user.fetchAll(
        {
          confirmed: true,
          blocked: false,
          ...ctx.query,
        },
        [
          {
            path: "blogs",
            match: { approval_2: true },
          },
          {
            path: "followers",
          },
          {
            path: "following",
          },
        ]
      );
      if (data) {
        data = sanitizeUser(data);
      }
      ctx.body = data;
    } catch (e) {}
  },
};

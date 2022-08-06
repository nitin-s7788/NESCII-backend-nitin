"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
  // find(params, populate) {
  //   return strapi.query("blogs").find(params, [
  //     {
  //       path: "author",
  //     },
  //     {
  //       path: "tags",
  //     },
  //     {
  //       path: "category",
  //     },
  //   ]);
  // },

  findOne(params, populate) {
    return strapi.query("blogs").findOne(params, [
      {
        path: "comments",
        populate: [
          {
            path: "replies",
            populate: [{ path: "author" }],
          },
          {
            path: "author",
          },
        ],
      },
      {
        path: "author",
        populate: "followers"
      },
      {
        path: "tags"
      },
      {
        path: "category"
      }
    ]);
  },
};

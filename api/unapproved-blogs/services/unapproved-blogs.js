'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
    async sendApprovalMail(blogObject){
        let currentBlog = await strapi.services.blogs.findOne({ id: blogObject.id });
        await strapi.services.email.sendCustomMail(`${currentBlog.author.email}`, 'Yay! Your blog has been approved', 'newBlog1',
          {
            "title": `${currentBlog.Title}`, 
            "tagline": `${currentBlog.tagline}`, 
            // "content": `${currentBlog.Content.slice(0,200)}...`, 
            "redirectLink": `https://nescii.com/blogs/view/${currentBlog._id}`, 
            "imgLink": `${currentBlog.ImageUrl[0] ? currentBlog.ImageUrl[0].url : 'https://nescii.s3.ap-south-1.amazonaws.com/Literary_5e40a006c9.jpg'}`, 
            "mailTitle": "Yay! Your blog has been approved"
          }
        );

        currentBlog.author.followers.forEach((item)=>{
          strapi.services.email.sendCustomMail(`${item.email}`, `New Blog by ${currentBlog.author.name}`, 'newBlog1',
            {
              "title": `${currentBlog.Title}`, 
              "tagline": `${currentBlog.tagline}`, 
              // "content": `${currentBlog.Content.slice(0,200)}...`, 
              "redirectLink": `https://nescii.com/blogs/view/${currentBlog._id}`, 
              "imgLink": `${currentBlog.ImageUrl[0] ? currentBlog.ImageUrl[0].url : 'https://nescii.s3.ap-south-1.amazonaws.com/Literary_5e40a006c9.jpg'}`, 
              "mailTitle": `New Blog by ${currentBlog.author.name}`
            }
          );
        });

        console.log(`[${new Date()}]: mails sent`);
    }
};

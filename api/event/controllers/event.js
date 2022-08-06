const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {

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
      entities = await strapi.services.event.search(requestQuery);
    } else {
      entities = await strapi.query('event').find(requestQuery, populates);
    }

    return entities.map(entity => {
      delete entity[removal];
      return sanitizeEntity(entity, { model: strapi.models.event })
    });
  },

  async create(ctx) {
    let entity;

    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      data.user = ctx.state.user.id;
      entity = await strapi.services.event.create(data, { files });
    } else {
        ctx.request.body.user = ctx.state.user.id;
        entity = await strapi.services.event.create(ctx.request.body);
    }

    let allUsers = await strapi.query('user', 'users-permissions').model.find({isOrganization: false});
    
    allUsers.forEach( async (item)=>{
        try{
            await strapi.services.email.sendCustomMail(`${item.email}`, `New Event by ${entity.user.name}`, 'newEvent1',
              {
                "title": `${entity.Title}`, 
                "tagline": `${entity.Tagline}`, 
                // "content": '', 
                "redirectLink": `https://nescii.com/events/view/${entity.id}`, 
                "imgLink": `${entity.Poster[0] ? entity.Poster[0].url : entity.user.avatar.url}`,
                "mailTitle": `New Event by ${entity.user.name}`
              }
            );
        } catch(error){
            console.log(error);
        }
    });
    
    return sanitizeEntity(entity, { model: strapi.models.event });
  },

  async update(ctx) {
    const { id } = ctx.params;

    const currentEvent = await strapi.query("event").findOne({ id });
    if(!currentEvent){
      ctx.response.status = 404;
      ctx.response.message = 'Not Found';
      return { status: ctx.response.status, message: ctx.response.message };
    }

    if(currentEvent.user.id !== ctx.state.user.id){
      ctx.response.status = 403;
      ctx.response.message = 'User not Authorized';
      return { status: ctx.response.status, message: ctx.response.message };
    };

    if(ctx.request.body.newAnnouncement){
        let announcement = ctx.request.body.newAnnouncement;
        let allUsers = await strapi.plugins["users-permissions"].services.user.fetchAll();
        allUsers.forEach( async (item)=>{
          try{
            strapi.services.email.sendCustomMail(`${item.email}`, `New Announcement for the event - ${currentEvent.Title}`, 'newAnnounce1',
              {
                "author": `on Event - ${currentEvent.Title}`, 
                "content": `${announcement.Message}`, 
                "redirectLink": `https://nescii.com/profile/${ctx.state.user.id}`, 
                "authorImage": `${currentEvent.Poster[0] ? currentEvent.Poster[0].url : currentEvent.user.avatar.url}`,
                "mailFooterText": `Tap to learn more about the event`
                // "mailTitle": "New Announcement",
                // "eventName": `${currentEvent.Title}`
              }
            );
          }catch(error){
              console.log(error);
          }
        });
    }

    delete ctx.request.body.newAnnouncement;

    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.event.update({ id }, data, {
        files,
      });
    } else {
      entity = await strapi.services.event.update({ id }, ctx.request.body);
    }

    return sanitizeEntity(entity, { model: strapi.models.event });
  },

  async delete(ctx){
    const eventID = ctx.params.id;
    try {
      const event = await strapi.query("event").findOne({ id: eventID });
      if (!event) {
        ctx.send({ message: "Bad Request" }, 400);
        return;
      }
      await strapi.services.event.delete({ id: eventID });
      if (event.Poster.length > 0) {
        const file = await strapi.plugins["upload"].services.upload.fetch({
          id: event.Poster[0].id,
        });
        if (file) {
          strapi.plugins["upload"].services.upload.remove(file);
        }
      }
      ctx.send({ message: "OK" }, 200);
    } catch (e) {
      console.log(e);
      ctx.send({ message: "Internal Server Error" }, 500);
    }
  }
};

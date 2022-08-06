module.exports = async (ctx, next) => {
    if(!ctx.state.user){
        return ctx.unauthorized('User not authorized');
    }

    if(ctx.state.user.role.name=='Admin'){
        return await next();
    }
    const { id } = ctx.params;

    let entity = await strapi.query('unapproved-blogs').findOne({ id });
    if(!entity){
        return ctx.send({message: 'Requested blog not found.'}, 404);
    }

    if(ctx.state.user.id!=entity.author.id){
        return ctx.unauthorized('User not authorized');
    }

    return await next();
}
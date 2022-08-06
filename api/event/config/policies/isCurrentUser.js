module.exports = async (ctx, next) => {
    const { id } = ctx.params;

    let entity = await strapi.query('event').findOne({id});
    if(!entity){
        return ctx.send({message: 'Bad Request'}, 400);
    }

    if(ctx.state.user.id!=entity.user.id && ctx.state.user.role.name!='Admin'){
        return ctx.unauthorized('User not authorized');
    }

    return await next();
}
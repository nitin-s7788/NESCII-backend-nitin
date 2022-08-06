module.exports = async (ctx, next) => {
    const user = ctx.state.user;

    if(!user || user.role.name!=='Admin'){
        return ctx.unauthorized('Admin permissions needed to access the route');
    }

    return await next();
}